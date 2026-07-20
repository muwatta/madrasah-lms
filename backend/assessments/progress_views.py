import csv
import io
from datetime import timedelta
from django.db import models
from django.db.models import Avg
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Question, Quiz, QuizAttempt
from .serializers import QuizAttemptSerializer
from curriculum.models import Subject, Topic, Enrollment
from results.models import ExamResult
from results.serializers import ExamResultSerializer


class BulkQuestionUploadView(APIView):
    def post(self, request):
        csv_file = request.FILES.get('file')
        if not csv_file:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            decoded = csv_file.read().decode('utf-8')
            reader = csv.DictReader(io.StringIO(decoded))
        except Exception:
            return Response({'error': 'Invalid CSV file'}, status=status.HTTP_400_BAD_REQUEST)

        required_cols = {'question_text', 'question_type', 'correct_answer'}
        if not required_cols.issubset(set(reader.fieldnames or [])):
            return Response(
                {'error': f'CSV must have columns: {", ".join(required_cols)}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created = []
        errors = []
        madrasah = request.user.madrasah

        for i, row in enumerate(reader, start=2):
            try:
                q_type = row['question_type'].strip().lower()
                if q_type not in ('mcq', 'fill_blank', 'short_answer', 'essay'):
                    errors.append({'row': i, 'error': f'Invalid question_type: {q_type}'})
                    continue

                topic_id = row.get('topic_id', '').strip()
                topic = None
                if topic_id:
                    try:
                        topic = Topic.objects.get(id=int(topic_id), subject__madrasah=madrasah)
                    except (Topic.DoesNotExist, ValueError):
                        errors.append({'row': i, 'error': f'Topic {topic_id} not found'})
                        continue

                options = None
                if q_type == 'mcq':
                    opts_raw = row.get('options', '').strip()
                    options = [o.strip() for o in opts_raw.split('|') if o.strip()] if opts_raw else None
                    if not options or len(options) < 2:
                        errors.append({'row': i, 'error': 'MCQ needs at least 2 options (pipe-separated)'})
                        continue

                difficulty = row.get('difficulty', 'medium').strip().lower()
                if difficulty not in ('easy', 'medium', 'hard'):
                    difficulty = 'medium'

                question = Question.objects.create(
                    madrasah=madrasah,
                    topic=topic,
                    created_by=request.user,
                    question_text=row['question_text'].strip(),
                    question_type=q_type,
                    options=options,
                    correct_answer=row['correct_answer'].strip(),
                    explanation=row.get('explanation', '').strip(),
                    difficulty=difficulty,
                )
                created.append(question.id)
            except Exception as e:
                errors.append({'row': i, 'error': str(e)})

        return Response({
            'created': len(created),
            'errors': errors,
            'question_ids': created,
        }, status=status.HTTP_201_CREATED if created else status.HTTP_400_BAD_REQUEST)


class QuizAnalyticsView(APIView):
    def get(self, request, pk):
        try:
            quiz = Quiz.objects.get(pk=pk, madrasah=request.user.madrasah)
        except Quiz.DoesNotExist:
            return Response({'error': 'Quiz not found'}, status=status.HTTP_404_NOT_FOUND)

        attempts = QuizAttempt.objects.filter(quiz=quiz, submitted_at__isnull=False)
        total_attempts = attempts.count()

        if total_attempts == 0:
            return Response({
                'quiz': {'id': quiz.id, 'title': quiz.title},
                'total_attempts': 0,
                'average_score': 0,
                'pass_rate': 0,
                'question_analytics': [],
                'score_distribution': [],
                'difficulty_breakdown': {},
            })

        avg_score = attempts.aggregate(avg=models.Avg('percentage'))['avg'] or 0
        pass_count = attempts.filter(percentage__gte=quiz.passing_score).count()
        pass_rate = round((pass_count / total_attempts) * 100, 1)

        from .models import Question
        questions = Question.objects.filter(id__in=quiz.question_ids)
        question_map = {q.id: q for q in questions}

        question_analytics = []
        for q_id in quiz.question_ids:
            q = question_map.get(q_id)
            if not q:
                continue

            correct_count = 0
            wrong_answers = {}
            for attempt in attempts:
                answer = attempt.answers.get(str(q_id)) or attempt.answers.get(q_id)
                if answer is None:
                    continue
                result = attempt.results.get(str(q_id)) or attempt.results.get(q_id) if hasattr(attempt, 'results') else None

                correct = str(answer).strip().lower() == str(q.correct_answer).strip().lower()
                if correct:
                    correct_count += 1
                else:
                    ans_key = str(answer).strip()
                    wrong_answers[ans_key] = wrong_answers.get(ans_key, 0) + 1

            answered_count = sum(
                1 for a in attempts
                if a.answers.get(str(q_id)) is not None or a.answers.get(q_id) is not None
            )
            accuracy = round((correct_count / answered_count) * 100, 1) if answered_count > 0 else 0

            top_wrong = sorted(wrong_answers.items(), key=lambda x: x[1], reverse=True)[:5]

            question_analytics.append({
                'question_id': q.id,
                'question_text': q.question_text,
                'question_type': q.question_type,
                'difficulty': q.difficulty,
                'accuracy': accuracy,
                'correct_count': correct_count,
                'total_answered': answered_count,
                'top_wrong_answers': [{'answer': a, 'count': c} for a, c in top_wrong],
            })

        question_analytics.sort(key=lambda x: x['accuracy'])

        score_distribution = []
        for bucket_start in range(0, 100, 10):
            bucket_end = bucket_start + 10
            count = attempts.filter(percentage__gte=bucket_start, percentage__lt=bucket_end).count()
            score_distribution.append({
                'range': f'{bucket_start}-{bucket_end}',
                'count': count,
            })
        score_distribution.append({'range': '100', 'count': attempts.filter(percentage=100).count()})

        difficulty_breakdown = {}
        for q in questions:
            d = q.difficulty
            if d not in difficulty_breakdown:
                difficulty_breakdown[d] = {'total': 0, 'accuracy_sum': 0}
            difficulty_breakdown[d]['total'] += 1
            qa = next((a for a in question_analytics if a['question_id'] == q.id), None)
            if qa:
                difficulty_breakdown[d]['accuracy_sum'] += qa['accuracy']

        for d, data in difficulty_breakdown.items():
            data['avg_accuracy'] = round(data['accuracy_sum'] / data['total'], 1) if data['total'] > 0 else 0
            del data['accuracy_sum']

        return Response({
            'quiz': {'id': quiz.id, 'title': quiz.title, 'passing_score': quiz.passing_score},
            'total_attempts': total_attempts,
            'average_score': round(avg_score, 1),
            'pass_rate': pass_rate,
            'question_analytics': question_analytics,
            'score_distribution': score_distribution,
            'difficulty_breakdown': difficulty_breakdown,
        })


class StudentProgressView(APIView):
    def get(self, request):
        user = request.user
        now = timezone.now()

        attempts = QuizAttempt.objects.filter(student=user, submitted_at__isnull=False).order_by('-submitted_at')

        streak = 0
        if attempts.exists():
            dates = []
            for a in attempts:
                d = a.submitted_at.date()
                if d not in dates:
                    dates.append(d)
            dates.sort(reverse=True)
            today = now.date()
            check_date = today
            for d in dates:
                if d == check_date:
                    streak += 1
                    check_date -= timedelta(days=1)
                elif d == check_date - timedelta(days=1):
                    check_date = d
                    streak += 1
                else:
                    break

        enrollments = Enrollment.objects.filter(student=user).select_related('subject')
        subject_mastery = []
        for enroll in enrollments:
            subject_attempts = attempts.filter(quiz__subject=enroll.subject)
            avg = subject_attempts.aggregate(avg=Avg('percentage'))['avg']
            total = subject_attempts.count()
            subject_mastery.append({
                'subject_id': enroll.subject.id,
                'subject_name_ar': enroll.subject.name_ar,
                'subject_name_en': enroll.subject.name_en,
                'average_score': round(avg, 1) if avg else 0,
                'total_attempts': total,
            })

        badges = []
        total_attempts = attempts.count()
        overall_avg = attempts.aggregate(avg=Avg('percentage'))['avg']
        overall_avg = round(overall_avg, 1) if overall_avg else 0

        if total_attempts >= 1:
            badges.append({'id': 'first_quiz', 'name_ar': 'أول خطوة', 'name_en': 'First Step', 'description_ar': 'أكمل أول اختبار', 'description_en': 'Completed first quiz', 'icon': '🎯', 'earned': True})
        else:
            badges.append({'id': 'first_quiz', 'name_ar': 'أول خطوة', 'name_en': 'First Step', 'description_ar': 'أكمل أول اختبار', 'description_en': 'Completed first quiz', 'icon': '🎯', 'earned': False})

        if total_attempts >= 10:
            badges.append({'id': 'dedicated', 'name_ar': 'المجتهد', 'name_en': 'Dedicated', 'description_ar': 'أكمل 10 اختبارات', 'description_en': 'Completed 10 quizzes', 'icon': '📚', 'earned': True})
        else:
            badges.append({'id': 'dedicated', 'name_ar': 'المجتهد', 'name_en': 'Dedicated', 'description_ar': f'أكمل {total_attempts}/10 اختبارات', 'description_en': f'{total_attempts}/10 quizzes completed', 'icon': '📚', 'earned': False})

        if overall_avg >= 80:
            badges.append({'id': 'excellence', 'name_ar': 'المتفوق', 'name_en': 'Excellence', 'description_ar': 'متوسط 80%+', 'description_en': 'Average 80%+', 'icon': '⭐', 'earned': True})
        else:
            badges.append({'id': 'excellence', 'name_ar': 'المتفوق', 'name_en': 'Excellence', 'description_ar': f'المتوسط الحالي {overall_avg}%', 'description_en': f'Current average {overall_avg}%', 'icon': '⭐', 'earned': False})

        if streak >= 3:
            badges.append({'id': 'streak3', 'name_ar': 'المتوالي', 'name_en': 'On a Roll', 'description_ar': 'سلسلة 3 أيام', 'description_en': '3-day streak', 'icon': '🔥', 'earned': True})
        else:
            badges.append({'id': 'streak3', 'name_ar': 'المتوالي', 'name_en': 'On a Roll', 'description_ar': 'سلسلة 3 أيام', 'description_en': '3-day streak', 'icon': '🔥', 'earned': False})

        perfect_count = attempts.filter(percentage=100).count()
        if perfect_count >= 1:
            badges.append({'id': 'perfect', 'name_ar': 'مثالي', 'name_en': 'Perfect Score', 'description_ar': 'حصل على 100%', 'description_en': 'Scored 100%', 'icon': '💯', 'earned': True})
        else:
            badges.append({'id': 'perfect', 'name_ar': 'مثالي', 'name_en': 'Perfect Score', 'description_ar': 'احصل على 100%', 'description_en': 'Score 100%', 'icon': '💯', 'earned': False})

        if any(m['average_score'] >= 85 for m in subject_mastery if m['total_attempts'] >= 3):
            badges.append({'id': 'master', 'name_ar': 'إتقان', 'name_en': 'Mastery', 'description_ar': 'إتقان مادة (85%+)', 'description_en': 'Master a subject (85%+)', 'icon': '🏆', 'earned': True})
        else:
            badges.append({'id': 'master', 'name_ar': 'إتقان', 'name_en': 'Mastery', 'description_ar': 'إتقان مادة (85%+)', 'description_en': 'Master a subject (85%+)', 'icon': '🏆', 'earned': False})

        exam_results = ExamResult.objects.filter(student=user).select_related('exam')

        return Response({
            'streak': streak,
            'subject_mastery': subject_mastery,
            'badges': badges,
            'stats': {
                'total_attempts': total_attempts,
                'overall_average': overall_avg,
                'total_enrolled_subjects': enrollments.count(),
                'total_badges_earned': sum(1 for b in badges if b['earned']),
                'total_badges': len(badges),
            },
            'recent_attempts': QuizAttemptSerializer(attempts[:10], many=True).data,
            'exam_results': ExamResultSerializer(exam_results[:10], many=True).data,
        })
