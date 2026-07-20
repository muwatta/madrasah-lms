from django.db.models import Avg, Count, Q, F
from rest_framework.response import Response
from rest_framework.views import APIView
from datetime import timedelta
from django.utils import timezone
from users.models import User, StudentParent
from assessments.models import QuizAttempt
from curriculum.models import Enrollment


class StudentInterventionAlertsView(APIView):
    def get(self, request):
        if request.user.role not in ('ustaadh', 'mudeer'):
            return Response({'error': 'Access denied'}, status=403)

        madrasah = request.user.madrasah
        now = timezone.now()
        threshold_date = now - timedelta(days=3)

        student_ids = Enrollment.objects.filter(
            madrasah=madrasah,
            ustaadh=request.user if request.user.role == 'ustaadh' else None,
        ).values_list('student_id', flat=True).distinct()

        if request.user.role == 'mudeer':
            student_ids = Enrollment.objects.filter(
                madrasah=madrasah,
            ).values_list('student_id', flat=True).distinct()

        students = User.objects.filter(id__in=student_ids, role='student', madrasah=madrasah)
        alerts = []

        for student in students:
            student_alerts = []

            recent_attempts = QuizAttempt.objects.filter(
                student=student,
                submitted_at__isnull=False,
                submitted_at__gte=threshold_date,
            )
            has_recent = recent_attempts.exists()

            if not has_recent:
                any_attempt = QuizAttempt.objects.filter(
                    student=student,
                    submitted_at__isnull=False,
                ).exists()
                if any_attempt:
                    student_alerts.append({
                        'type': 'inactive',
                        'severity': 'warning',
                        'message_ar': f'{student.get_full_name()} لم ي练习 منذ 3 أيام',
                        'message_en': f'{student.get_full_name()} hasn\'t practiced in 3+ days',
                    })

            low_avg = QuizAttempt.objects.filter(
                student=student,
                submitted_at__isnull=False,
                percentage__isnull=False,
            ).aggregate(avg=Avg('percentage'))['avg']

            if low_avg is not None and low_avg < 60:
                student_alerts.append({
                    'type': 'struggling',
                    'severity': 'critical',
                    'message_ar': f'{student.get_full_name()} متوسط درجاته {round(low_avg, 1)}% (تحت 60%)',
                    'message_en': f'{student.get_full_name()} averaging {round(low_avg, 1)}% (below 60%)',
                })

            recent_high = QuizAttempt.objects.filter(
                student=student,
                submitted_at__isnull=False,
                percentage__gte=90,
                submitted_at__gte=now - timedelta(days=14),
            ).count()

            if recent_high >= 3:
                student_alerts.append({
                    'type': 'needs_challenge',
                    'severity': 'info',
                    'message_ar': f'{student.get_full_name()} يحقق درجات عالية ({recent_high} اختبارات 90%+). يحتاج محتوى أكثر تحدياً',
                    'message_en': f'{student.get_full_name()} scoring high ({recent_high} quizzes at 90%+). Needs challenging content',
                })

            if student_alerts:
                alerts.append({
                    'student': {
                        'id': student.id,
                        'name': student.get_full_name(),
                        'email': student.email,
                    },
                    'alerts': student_alerts,
                })

        alerts.sort(key=lambda x: sum(1 for a in x['alerts'] if a['severity'] == 'critical'), reverse=True)

        return Response({
            'total_alerts': sum(len(a['alerts']) for a in alerts),
            'students_with_alerts': len(alerts),
            'alerts': alerts,
        })


class AdminEngagementView(APIView):
    def get(self, request):
        if request.user.role != 'mudeer':
            return Response({'error': 'Access denied'}, status=403)

        madrasah = request.user.madrasah
        now = timezone.now()

        weekly_active = QuizAttempt.objects.filter(
            student__madrasah=madrasah,
            submitted_at__gte=now - timedelta(days=7),
        ).values('student_id').distinct().count()

        daily_attempts = []
        for i in range(6, -1, -1):
            day = now - timedelta(days=i)
            count = QuizAttempt.objects.filter(
                student__madrasah=madrasah,
                submitted_at__date=day.date(),
            ).count()
            daily_attempts.append({
                'date': day.strftime('%a'),
                'count': count,
            })

        teacher_stats = []
        from users.models import User as UserModel
        for teacher in UserModel.objects.filter(madrasah=madrasah, role='ustaadh'):
            t_attempts = QuizAttempt.objects.filter(
                quiz__created_by=teacher,
                submitted_at__isnull=False,
            )
            avg = t_attempts.aggregate(avg=Avg('percentage'))['avg']
            teacher_stats.append({
                'teacher_id': teacher.id,
                'name': teacher.get_full_name(),
                'total_attempts': t_attempts.count(),
                'average_score': round(avg, 1) if avg else 0,
                'student_count': Enrollment.objects.filter(ustaadh=teacher).values('student_id').distinct().count(),
            })

        subject_trends = []
        from curriculum.models import Subject
        for subject in Subject.objects.filter(madrasah=madrasah):
            s_avg = QuizAttempt.objects.filter(
                quiz__subject=subject,
                submitted_at__isnull=False,
            ).aggregate(avg=Avg('percentage'))['avg']
            subject_trends.append({
                'subject_id': subject.id,
                'name_ar': subject.name_ar,
                'name_en': subject.name_en,
                'average_score': round(s_avg, 1) if s_avg else 0,
                'attempt_count': QuizAttempt.objects.filter(quiz__subject=subject).count(),
            })

        return Response({
            'weekly_active_students': weekly_active,
            'daily_attempts': daily_attempts,
            'teacher_stats': teacher_stats,
            'subject_trends': subject_trends,
        })