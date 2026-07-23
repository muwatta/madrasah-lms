from __future__ import annotations
from django.db.models import QuerySet
from .models import Quiz, Question, QuizAttempt, QuizAssignment


def get_quizzes(*, madrasah, status=None, subject=None, school_class=None, teacher=None) -> QuerySet:
    qs = Quiz.objects.filter(madrasah=madrasah).select_related(
        'subject', 'school_class', 'session', 'term', 'created_by')
    if status:
        qs = qs.filter(status=status)
    if subject:
        qs = qs.filter(subject_id=subject)
    if school_class:
        qs = qs.filter(school_class_id=school_class)
    if teacher:
        qs = qs.filter(created_by=teacher)
    return qs


def get_quiz_by_id(*, quiz_id: int, madrasah) -> Quiz | None:
    return Quiz.objects.filter(pk=quiz_id, madrasah=madrasah).select_related(
        'subject', 'school_class', 'session', 'term', 'created_by').first()


def get_quiz_with_questions(*, quiz_id: int, madrasah) -> Quiz | None:
    return Quiz.objects.filter(pk=quiz_id, madrasah=madrasah).select_related(
        'subject', 'school_class', 'created_by').prefetch_related(
        'quiz_questions__question').first()


def get_questions(*, madrasah, subject=None, topic=None, school_class=None,
                  question_type=None, difficulty=None, search=None) -> QuerySet:
    qs = Question.objects.filter(madrasah=madrasah, is_active=True).select_related(
        'subject', 'topic', 'school_class', 'created_by')
    if subject:
        qs = qs.filter(subject_id=subject)
    if topic:
        qs = qs.filter(topic_id=topic)
    if school_class:
        qs = qs.filter(school_class_id=school_class)
    if question_type:
        qs = qs.filter(question_type=question_type)
    if difficulty:
        qs = qs.filter(difficulty=difficulty)
    if search:
        qs = qs.filter(question_text__icontains=search)
    return qs


def get_question_by_id(*, question_id: int, madrasah) -> Question | None:
    return Question.objects.filter(pk=question_id, madrasah=madrasah).select_related(
        'subject', 'topic', 'school_class', 'created_by').first()


def get_student_quizzes(*, student, madrasah) -> QuerySet:
    assignment_class_ids = QuizAssignment.objects.filter(
        school_class__enrollments__student=student,
    ).values_list('quiz_id', flat=True).distinct()

    return Quiz.objects.filter(
        madrasah=madrasah,
        is_published=True,
    ).filter(
        models.Q(assignments__school_class__enrollments__student=student) |
        models.Q(id__in=assignment_class_ids)
    ).select_related(
        'subject', 'school_class', 'created_by'
    ).distinct()


def get_attempts_for_quiz(*, quiz_id: int, madrasah) -> QuerySet:
    return QuizAttempt.objects.filter(
        quiz_id=quiz_id, madrasah=madrasah
    ).select_related('student').order_by('-started_at')


def get_student_attempt(*, quiz_id: int, student, attempt_number: int = None) -> QuizAttempt | None:
    qs = QuizAttempt.objects.filter(
        quiz_id=quiz_id, student=student
    ).select_related('quiz')
    if attempt_number:
        qs = qs.filter(attempt_number=attempt_number)
    return qs.order_by('-attempt_number').first()


def get_quiz_stats(*, quiz_id: int, madrasah) -> dict:
    attempts = QuizAttempt.objects.filter(
        quiz_id=quiz_id, madrasah=madrasah,
        status__in=('submitted', 'graded', 'released'),
    )
    from django.db.models import Avg, Max, Min, Count
    agg = attempts.aggregate(
        total=Count('id'),
        avg_score=Avg('percentage'),
        max_score=Max('percentage'),
        min_score=Min('percentage'),
        passed=Count('id', filter=models.Q(is_pass=True)),
    )
    return {
        'total_attempts': agg['total'] or 0,
        'average_score': round(agg['avg_score'] or 0, 1),
        'highest_score': round(agg['max_score'] or 0, 1),
        'lowest_score': round(agg['min_score'] or 0, 1),
        'pass_rate': round((agg['passed'] / agg['total'] * 100) if agg['total'] else 0, 1),
    }


def get_question_analysis(*, quiz_id: int, madrasah) -> list:
    from .models import QuizAnswer
    questions = Quiz.objects.get(pk=quiz_id).quiz_questions.select_related('question')
    results = []
    for qq in questions:
        answers = QuizAnswer.objects.filter(
            attempt__quiz_id=quiz_id,
            question=qq.question,
            attempt__status__in=('submitted', 'graded', 'released'),
        )
        total = answers.count()
        correct = answers.filter(is_correct=True).count()
        results.append({
            'question_id': qq.question.id,
            'question_text': qq.question.question_text[:100],
            'total_answers': total,
            'correct_count': correct,
            'correct_pct': round((correct / total * 100) if total else 0, 1),
        })
    return results


# Needed for Q() lookups
from django.db import models
