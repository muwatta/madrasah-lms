import json
from .models import Question, QuizAttempt


def grade_quiz(attempt):
    quiz = attempt.quiz
    questions = Question.objects.filter(id__in=quiz.question_ids)
    question_map = {q.id: q for q in questions}

    score = 0
    auto_graded_count = 0
    results = {}

    for q_id_str, user_answer in attempt.answers.items():
        q_id = int(q_id_str) if isinstance(q_id_str, str) else q_id_str
        question = question_map.get(q_id)
        if not question:
            continue

        is_correct = False

        if question.question_type in ('mcq', 'fill_blank', 'short_answer'):
            auto_graded_count += 1
            correct = question.correct_answer.strip().lower()
            given = str(user_answer).strip().lower()

            if question.question_type == 'mcq':
                is_correct = given == correct
            elif question.question_type == 'fill_blank':
                is_correct = given == correct
            elif question.question_type == 'short_answer':
                correct_keywords = set(correct.split())
                given_keywords = set(given.split())
                overlap = correct_keywords & given_keywords
                if len(correct_keywords) > 0:
                    is_correct = len(overlap) / len(correct_keywords) >= 0.5

        results[str(q_id)] = {
            'is_correct': is_correct,
            'user_answer': user_answer,
            'correct_answer': question.correct_answer if question.question_type != 'essay' else None,
            'explanation': question.explanation,
        }

        if is_correct:
            score += 1

    percentage = round((score / auto_graded_count) * 100, 1) if auto_graded_count > 0 else 0

    attempt.score = score
    attempt.percentage = percentage
    attempt.save()

    return {
        'score': score,
        'total': auto_graded_count,
        'percentage': percentage,
        'results': results,
    }
