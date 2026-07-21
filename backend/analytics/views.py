from rest_framework import generics, status, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import AtRiskPrediction, SkillAssessment, DigitalPortfolio
from .serializers import (
    AtRiskPredictionSerializer, SkillAssessmentSerializer, DigitalPortfolioSerializer,
)
from config.permissions import IsMudeer, IsStaff



class AtRiskPredictionListView(generics.ListAPIView):
    serializer_class = AtRiskPredictionSerializer
    permission_classes = [permissions.IsAuthenticated, IsMudeer]

    def get_queryset(self):
        qs = AtRiskPrediction.objects.filter(
            madrasah=self.request.user.madrasah, is_active=True,
        ).select_related('student')
        risk_level = self.request.query_params.get('risk_level')
        if risk_level:
            qs = qs.filter(risk_level=risk_level)
        return qs


class AtRiskPredictionDetailView(generics.RetrieveAPIView):
    serializer_class = AtRiskPredictionSerializer
    permission_classes = [permissions.IsAuthenticated, IsMudeer]

    def get_queryset(self):
        return AtRiskPrediction.objects.filter(madrasah=self.request.user.madrasah).select_related('student')


class GenerateAtRiskPredictionsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsMudeer]

    def post(self, request):
        from .tasks import generate_at_risk_predictions
        generate_at_risk_predictions.delay(madrasah_id=request.user.madrasah_id)
        return Response({
            'message': 'At-risk prediction generation started',
        }, status=status.HTTP_202_ACCEPTED)



class TeacherWorkloadListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsMudeer]
    serializer_class = AtRiskPredictionSerializer  

    def list(self, request, *args, **kwargs):
        from datetime import date, timedelta
        from django.db.models import Count
        from users.models import User
        from lessons.models import Homework, HomeworkSubmission

        madrasah = request.user.madrasah
        today = date.today()
        week_end = today + timedelta(days=(6 - today.weekday()))

        teachers = User.objects.filter(madrasah=madrasah, role='ustaadh', is_active=True)
        teacher_ids = list(teachers.values_list('id', flat=True))

        hw_counts = Homework.objects.filter(
            madrasah=madrasah, teacher_id__in=teacher_ids,
        ).values('teacher_id').annotate(count=Count('id'))
        hw_count_map = {h['teacher_id']: h['count'] for h in hw_counts}

        ungraded_counts = HomeworkSubmission.objects.filter(
            homework__teacher_id__in=teacher_ids, homework__madrasah=madrasah, status='submitted',
        ).values('homework__teacher_id').annotate(count=Count('id', distinct=True))
        ungraded_map = {u['homework__teacher_id']: u['count'] for u in ungraded_counts}

        upcoming_counts = Homework.objects.filter(
            madrasah=madrasah, teacher_id__in=teacher_ids,
            due_date__date__gte=today, due_date__date__lte=week_end,
        ).values('teacher_id').annotate(count=Count('id'))
        upcoming_map = {u['teacher_id']: u['count'] for u in upcoming_counts}

        data = []
        for teacher in teachers:
            data.append({
                'teacher': teacher.id,
                'teacher_name': teacher.get_full_name(),
                'lesson_plans_count': hw_count_map.get(teacher.id, 0),
                'homework_count': hw_count_map.get(teacher.id, 0),
                'ungraded_submissions_count': ungraded_map.get(teacher.id, 0),
                'upcoming_lessons': upcoming_map.get(teacher.id, 0),
            })

        return Response(data)


class TeacherWorkloadMeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role not in ('ustaadh', 'mudeer', 'idaarah'):
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

        from datetime import date, timedelta
        from lessons.models import Homework, HomeworkSubmission

        madrasah = user.madrasah
        today = date.today()
        week_end = today + timedelta(days=(6 - today.weekday()))

        lesson_plans = Homework.objects.filter(
            madrasah=madrasah, teacher=user,
        ).count()
        homework_count = Homework.objects.filter(
            madrasah=madrasah, teacher=user,
        ).count()
        ungraded = HomeworkSubmission.objects.filter(
            homework__teacher=user, homework__madrasah=madrasah, status='submitted',
        ).count()
        upcoming = Homework.objects.filter(
            madrasah=madrasah, teacher=user, due_date__date__gte=today, due_date__date__lte=week_end,
        ).count()

        return Response({
            'teacher': user.id,
            'teacher_name': user.get_full_name(),
            'lesson_plans_count': lesson_plans,
            'homework_count': homework_count,
            'ungraded_submissions_count': ungraded,
            'upcoming_lessons': upcoming,
        })


class SkillAssessmentListCreateView(generics.ListCreateAPIView):
    serializer_class = SkillAssessmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = SkillAssessment.objects.filter(madrasah=user.madrasah).select_related('student', 'teacher')
        if user.role == 'student':
            qs = qs.filter(student=user)
        student_id = self.request.query_params.get('student')
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if user.role not in ('mudeer', 'ustaadh', 'idaarah'):
            raise PermissionDenied()
        teacher = user if user.role == 'ustaadh' else None
        serializer.save(madrasah=user.madrasah, teacher=teacher)


class SkillAssessmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SkillAssessmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = SkillAssessment.objects.filter(madrasah=user.madrasah)
        if user.role == 'student':
            qs = qs.filter(student=user)
        return qs

    def perform_destroy(self, instance):
        if self.request.user.role not in ('mudeer', 'ustaadh', 'idaarah'):
            raise PermissionDenied()
        instance.delete()



class DigitalPortfolioListCreateView(generics.ListCreateAPIView):
    serializer_class = DigitalPortfolioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = DigitalPortfolio.objects.filter(madrasah=user.madrasah).select_related('student')
        if user.role == 'student':
            qs = qs.filter(student=user)
        student_id = self.request.query_params.get('student')
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'student':
            serializer.save(madrasah=user.madrasah, student=user)
        elif user.role in ('mudeer', 'idaarah'):
            serializer.save(madrasah=user.madrasah)
        else:
            raise PermissionDenied()


class DigitalPortfolioDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DigitalPortfolioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = DigitalPortfolio.objects.filter(madrasah=user.madrasah)
        if user.role == 'student':
            qs = qs.filter(student=user)
        return qs

    def perform_destroy(self, instance):
        if self.request.user.role not in ('mudeer', 'idaarah') and instance.student != self.request.user:
            raise PermissionDenied()
        instance.delete()


# ── Admin Dashboard ──

class AdminDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsMudeer]

    def get(self, request):
        from datetime import date, timedelta
        from django.utils import timezone
        from django.db.models import Sum, F, Avg
        from django.db.models.functions import Coalesce
        from decimal import Decimal
        from users.models import User
        from school_ops.models import Attendance, Fee, FeePayment, Notification
        from lessons.models import HomeworkSubmission
        from assessments.models import QuizAttempt
        from results.models import Exam

        madrasah = request.user.madrasah
        today = date.today()
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        total_students = User.objects.filter(madrasah=madrasah, role='student', is_active=True).count()
        total_teachers = User.objects.filter(madrasah=madrasah, role='ustaadh', is_active=True).count()

        # Today's attendance
        today_att = Attendance.objects.filter(madrasah=madrasah, date=today)
        today_total = today_att.count()
        today_present = today_att.filter(status='present').count()
        today_attendance_rate = round((today_present / today_total) * 100, 1) if today_total > 0 else 0
        today_absentees = today_att.filter(status='absent').count()

        # Fees
        fees_this_month = FeePayment.objects.filter(
            fee__madrasah=madrasah, payment_date__gte=month_start.date(),
        ).aggregate(total=Coalesce(Sum('amount_paid'), Decimal('0')))['total']
        outstanding_fees = Fee.objects.filter(
            madrasah=madrasah,
        ).aggregate(
            total=Coalesce(Sum('amount') - Sum('amount_paid'), Decimal('0')),
        )['total']

        # Upcoming exams
        upcoming_exams = Exam.objects.filter(
            madrasah=madrasah, exam_date__gte=today, exam_date__lte=today + timedelta(days=7),
        ).count()

        # At-risk count
        at_risk_count = AtRiskPrediction.objects.filter(
            madrasah=madrasah, is_active=True, risk_level__in=['high', 'critical'],
        ).count()

        # Ungraded submissions
        ungraded = HomeworkSubmission.objects.filter(
            homework__madrasah=madrasah, status='submitted',
        ).count()

        # Performance trend (last 6 months avg scores)
        six_months_ago = (now.replace(day=1) - timedelta(days=180)).replace(day=1)
        monthly_avgs = (
            QuizAttempt.objects.filter(
                quiz__madrasah=madrasah,
                submitted_at__gte=six_months_ago,
                percentage__isnull=False,
            )
            .annotate(month=F('submitted_at__month'), year=F('submitted_at__year'))
            .values('year', 'month')
            .annotate(avg=Avg('percentage'))
            .order_by('year', 'month')
        )
        month_map = {(row['year'], row['month']): row['avg'] for row in monthly_avgs}

        performance_trend = []
        for i in range(5, -1, -1):
            m_date = now - timedelta(days=i * 30)
            m_start = m_date.replace(day=1)
            avg = month_map.get((m_start.year, m_start.month))
            performance_trend.append({
                'month': m_start.strftime('%b'),
                'avg_score': round(float(avg), 1) if avg else 0,
            })

        # Recent notifications
        recent_notifications = Notification.objects.filter(
            madrasah=madrasah,
        ).select_related('recipient')[:5]
        notifications_data = [{
            'id': n.id,
            'title': n.title,
            'message': n.message,
            'type': n.notification_type,
            'created_at': n.created_at.isoformat(),
        } for n in recent_notifications]

        return Response({
            'total_students': total_students,
            'total_teachers': total_teachers,
            'today_attendance_rate': today_attendance_rate,
            'today_absentees': today_absentees,
            'fees_collected_this_month': float(fees_this_month),
            'outstanding_fees': float(outstanding_fees),
            'upcoming_exams': upcoming_exams,
            'at_risk_count': at_risk_count,
            'ungraded_submissions': ungraded,
            'performance_trend': performance_trend,
            'recent_notifications': notifications_data,
        })
