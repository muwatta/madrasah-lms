from __future__ import annotations
import random
from decimal import Decimal
from django.db import transaction
from django.db import models
from django.utils import timezone
from .models import (
    Quiz, Question, QuizQuestion, QuizAssignment,
    QuizAttempt, QuizAnswer, ViolationLog,
)


class QuizService:
    """Business logic for quiz CRUD and lifecycle."""

    @staticmethod
    @transaction.atomic
    def create_quiz(*, madrasah, created_by, title, description, instructions,
                    subject, school_class, session=None, term=None,
                    difficulty=2, estimated_duration_minutes=30,
                    available_from=None, available_until=None,
                    time_limit_minutes=30, grace_period_minutes=5,
                    max_attempts=1, passing_score=Decimal('60.00'),
                    marks_per_question=Decimal('1.00'),
                    negative_marking=False, negative_mark_fraction=Decimal('0.25'),
                    randomize_questions=False, randomize_options=False,
                    one_question_per_page=True, allow_review=True,
                    allow_back_navigation=True, show_question_numbers=True,
                    auto_save=True, grading_mode='auto_release_later',
                    require_fullscreen=False, max_violations=5,
                    auto_submit_on_violations=True,
                    question_ids=None) -> Quiz:
        quiz = Quiz.objects.create(
            madrasah=madrasah,
            created_by=created_by,
            title=title,
            description=description,
            instructions=instructions,
            subject=subject,
            school_class=school_class,
            session=session,
            term=term,
            difficulty=difficulty,
            estimated_duration_minutes=estimated_duration_minutes,
            available_from=available_from,
            available_until=available_until,
            time_limit_minutes=time_limit_minutes,
            grace_period_minutes=grace_period_minutes,
            max_attempts=max_attempts,
            passing_score=passing_score,
            marks_per_question=marks_per_question,
            negative_marking=negative_marking,
            negative_mark_fraction=negative_mark_fraction,
            randomize_questions=randomize_questions,
            randomize_options=randomize_options,
            one_question_per_page=one_question_per_page,
            allow_review=allow_review,
            allow_back_navigation=allow_back_navigation,
            show_question_numbers=show_question_numbers,
            auto_save=auto_save,
            grading_mode=grading_mode,
            require_fullscreen=require_fullscreen,
            max_violations=max_violations,
            auto_submit_on_violations=auto_submit_on_violations,
        )

        if question_ids:
            for i, qid in enumerate(question_ids):
                try:
                    q = Question.objects.get(pk=qid, madrasah=madrasah)
                    QuizQuestion.objects.create(
                        quiz=quiz, question=q, sort_order=i,
                        marks=marks_per_question)
                except Question.DoesNotExist:
                    continue

        return quiz

    @staticmethod
    @transaction.atomic
    def update_quiz(*, quiz, **kwargs) -> Quiz:
        for key, value in kwargs.items():
            if key == 'question_ids':
                continue
            setattr(quiz, key, value)
        quiz.save()

        if 'question_ids' in kwargs:
            quiz.quiz_questions.all().delete()
            for i, qid in enumerate(kwargs['question_ids']):
                try:
                    q = Question.objects.get(pk=qid, madrasah=quiz.madrasah)
                    QuizQuestion.objects.create(
                        quiz=quiz, question=q, sort_order=i,
                        marks=quiz.marks_per_question)
                except Question.DoesNotExist:
                    continue

        return quiz

    @staticmethod
    @transaction.atomic
    def publish_quiz(*, quiz) -> Quiz:
        if quiz.question_count == 0:
            raise ValueError("Cannot publish a quiz with no questions.")
        quiz.status = 'published'
        quiz.is_published = True
        quiz.save()
        return quiz

    @staticmethod
    @transaction.atomic
    def archive_quiz(*, quiz) -> Quiz:
        quiz.status = 'archived'
        quiz.is_published = False
        quiz.save()
        return quiz

    @staticmethod
    @transaction.atomic
    def assign_quiz(*, quiz, school_class_ids: list[int], assign_all=True, student_ids=None) -> list:
        assignments = []
        for cid in school_class_ids:
            a, _ = QuizAssignment.objects.update_or_create(
                quiz=quiz, school_class_id=cid,
                defaults={'assigned_to_all': assign_all, 'student_ids': student_ids or []})
            assignments.append(a)
        return assignments


class QuestionService:
    """Business logic for question bank CRUD."""

    @staticmethod
    @transaction.atomic
    def create_question(*, madrasah, created_by, subject, topic=None,
                        school_class=None, question_type='mcq', difficulty=2,
                        marks=Decimal('1.00'), question_text, question_text_ar='',
                        options=None, correct_answer, explanation='',
                        explanation_ar='') -> Question:

        if question_type == 'true_false' and not options:
            options = [
                {'key': 'A', 'text': 'True', 'text_ar': 'صحيح'},
                {'key': 'B', 'text': 'False', 'text_ar': 'خطأ'},
            ]
            if correct_answer not in ('A', 'B', 'true', 'false'):
                raise ValueError("Correct answer for True/False must be A, B, true, or false.")
            if correct_answer in ('true', 'false'):
                correct_answer = 'A' if correct_answer == 'true' else 'B'

        if question_type == 'mcq':
            if not options or len(options) < 2:
                raise ValueError("MCQ requires at least 2 options.")
            valid_keys = [o.get('key', '') for o in options]
            if correct_answer not in valid_keys:
                raise ValueError(f"Correct answer must be one of: {', '.join(valid_keys)}")

        return Question.objects.create(
            madrasah=madrasah,
            created_by=created_by,
            subject=subject,
            topic=topic,
            school_class=school_class,
            question_type=question_type,
            difficulty=difficulty,
            marks=marks,
            question_text=question_text,
            question_text_ar=question_text_ar,
            options=options or [],
            correct_answer=correct_answer,
            explanation=explanation,
            explanation_ar=explanation_ar,
        )

    @staticmethod
    @transaction.atomic
    def update_question(*, question, **kwargs) -> Question:
        for key, value in kwargs.items():
            setattr(question, key, value)
        question.save()
        return question

    @staticmethod
    @transaction.atomic
    def duplicate_question(*, question, created_by) -> Question:
        return Question.objects.create(
            madrasah=question.madrasah,
            created_by=created_by,
            subject=question.subject,
            topic=question.topic,
            school_class=question.school_class,
            question_type=question.question_type,
            difficulty=question.difficulty,
            marks=question.marks,
            question_text=question.question_text,
            question_text_ar=question.question_text_ar,
            options=question.options,
            correct_answer=question.correct_answer,
            explanation=question.explanation,
            explanation_ar=question.explanation_ar,
        )


class AttemptService:
    """Business logic for quiz attempts."""

    @staticmethod
    def can_attempt(*, quiz, student) -> tuple[bool, str]:
        if not quiz.is_published:
            return False, "Quiz is not published."
        if not quiz.is_available_now:
            return False, "Quiz is not available at this time."

        existing = QuizAttempt.objects.filter(
            quiz=quiz, student=student,
            status__in=('in_progress',)).first()
        if existing:
            return True, "Resuming existing attempt."

        completed = QuizAttempt.objects.filter(
            quiz=quiz, student=student,
            status__in=('submitted', 'graded', 'released')).count()
        if completed >= quiz.max_attempts:
            return False, "Maximum attempts reached."

        return True, "OK"

    @staticmethod
    @transaction.atomic
    def start_attempt(*, quiz, student, ip_address=None, user_agent='') -> QuizAttempt:
        can, msg = AttemptService.can_attempt(quiz=quiz, student=student)
        if not can:
            raise ValueError(msg)

        existing = QuizAttempt.objects.filter(
            quiz=quiz, student=student, status='in_progress').first()
        if existing:
            return existing

        attempt_number = QuizAttempt.objects.filter(
            quiz=quiz, student=student).count() + 1

        attempt = QuizAttempt.objects.create(
            madrasah=quiz.madrasah,
            quiz=quiz,
            student=student,
            attempt_number=attempt_number,
            ip_address=ip_address,
            user_agent=user_agent,
            total_marks=quiz.total_marks,
        )

        # Pre-create empty answers for all questions
        questions = quiz.quiz_questions.select_related('question').order_by('sort_order')
        if quiz.randomize_questions:
            question_list = list(questions)
            random.shuffle(question_list)
            questions = question_list

        for i, qq in enumerate(questions):
            QuizAnswer.objects.create(
                attempt=attempt,
                question=qq.question,
            )

        return attempt

    @staticmethod
    @transaction.atomic
    def save_answer(*, attempt, question_id: int, selected_answer: str) -> QuizAnswer:
        if attempt.status != 'in_progress':
            raise ValueError("Attempt is no longer in progress.")

        answer = QuizAnswer.objects.filter(
            attempt=attempt, question_id=question_id).first()
        if not answer:
            raise ValueError("Invalid question for this attempt.")

        answer.selected_answer = selected_answer
        answer.answered_at = timezone.now()
        answer.save()
        return answer

    @staticmethod
    @transaction.atomic
    def toggle_flag(*, attempt, question_id: int) -> QuizAnswer:
        answer = QuizAnswer.objects.filter(
            attempt=attempt, question_id=question_id).first()
        if not answer:
            raise ValueError("Invalid question for this attempt.")
        answer.is_flagged = not answer.is_flagged
        answer.save()
        return answer

    @staticmethod
    @transaction.atomic
    def submit_attempt(*, attempt) -> QuizAttempt:
        if attempt.status != 'in_progress':
            raise ValueError("Attempt already submitted.")

        attempt.status = 'submitted'
        attempt.submitted_at = timezone.now()
        attempt.time_spent_seconds = int(
            (attempt.submitted_at - attempt.started_at).total_seconds())

        quiz = attempt.quiz

        # Auto-grade
        total_score = Decimal('0')
        total_possible = Decimal('0')
        answers = attempt.answers.select_related('question')

        for answer in answers:
            question = answer.question
            qq = QuizQuestion.objects.filter(
                quiz=quiz, question=question).first()
            effective_marks = qq.effective_marks if qq else question.marks
            total_possible += effective_marks

            correct = question.correct_answer.upper()
            selected = answer.selected_answer.upper()

            if question.question_type == 'true_false':
                correct = correct if correct in ('A', 'B') else ('A' if correct in ('TRUE', 'true') else 'B')
                selected = selected if selected in ('A', 'B') else ('A' if selected in ('TRUE', 'true') else 'B')

            if selected == correct:
                answer.is_correct = True
                answer.marks_awarded = effective_marks
                total_score += effective_marks
            else:
                answer.is_correct = False
                if quiz.negative_marking:
                    deduction = effective_marks * quiz.negative_mark_fraction
                    answer.marks_awarded = -deduction
                    total_score -= deduction
                else:
                    answer.marks_awarded = Decimal('0')

            answer.save()

        attempt.score = max(total_score, Decimal('0'))
        attempt.total_marks = total_possible
        attempt.percentage = round(
            (attempt.score / total_possible * 100) if total_possible > 0 else 0, 2)
        attempt.is_pass = attempt.percentage >= quiz.passing_score

        # Handle grading mode
        if quiz.grading_mode == 'auto_immediate':
            attempt.status = 'released'
        else:
            attempt.status = 'submitted'

        attempt.save()
        return attempt


class ViolationService:
    """Track anti-cheating violations."""

    @staticmethod
    @transaction.atomic
    def log_violation(*, attempt, violation_type, details=None) -> ViolationLog:
        log = ViolationLog.objects.create(
            attempt=attempt,
            violation_type=violation_type,
            details=details or {},
        )

        # Auto-submit if too many violations
        violation_count = ViolationLog.objects.filter(attempt=attempt).count()
        if (attempt.quiz.auto_submit_on_violations and
                violation_count >= attempt.quiz.max_violations and
                attempt.status == 'in_progress'):
            AttemptService.submit_attempt(attempt=attempt)

        return log
