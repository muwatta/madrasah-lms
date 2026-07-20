from rest_framework import generics, status, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Q, Avg, F, Sum
from django.db.models.functions import Coalesce
from django.utils import timezone
from datetime import timedelta, date
from decimal import Decimal

from .models import AtRiskPrediction, SkillAssessment, DigitalPortfolio
from .serializers import (
    AtRiskPredictionSerializer, SkillAssessmentSerializer, DigitalPortfolioSerializer,
)
from config.permissions import IsMudeer, IsStaff
from users.models import User
from school_ops.models import Attendance
from assessments.models import QuizAttempt
from lessons.models import Homework, HomeworkSubmission


# ── At-Risk Prediction ──

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
        madrasah = request.user.madrasah
        students = User.objects.filter(madrasah=madrasah, role='student', is_active=True)
        today = date.today()
        one_year_ago = today - timedelta(days=365)
        thirty_days_ago = today - timedelta(days=30)

        counts = {'low': 0, 'moderate': 0, 'high': 0, 'critical': 0}

        for student in students:
            factors = {}

            # Attendance rate (last 90 days)
            att_window = today - timedelta(days=90)
            att_records = Attendance.objects.filter(
                student=student, date__gte=att_window, madrasah=madrasah,
            )
            att_total = att_records.count()
            att_present = att_records.filter(status__in=['present', 'late']).count()
            attendance_rate = att_present / att_total if att_total > 0 else 1.0
            factors['attendance_rate'] = round(attendance_rate, 3)

            # Average quiz score
            quiz_avg = QuizAttempt.objects.filter(
                student=student, percentage__isnull=False,
            ).aggregate(avg=Avg('percentage'))['avg']
            avg_score = float(quiz_avg) if quiz_avg else 50.0
            factors['avg_score'] = round(avg_score, 1)

            # Homework completion rate
            homeworks_assigned = Homework.objects.filter(
                madrasah=madrasah, is_published=True,
                school_class__enrollments__student=student,
            ).distinct().count()
            homeworks_submitted = HomeworkSubmission.objects.filter(
                student=student, madrasah=madrasah,
            ).values('homework').distinct().count()
            hw_completion = homeworks_submitted / homeworks_assigned if homeworks_assigned > 0 else 1.0
            factors['homework_completion'] = round(hw_completion, 3)

            # Missing assignments
            missing = homeworks_assigned - homeworks_submitted
            factors['missing_assignments'] = max(missing, 0)

            # Consecutive absences
            recent_att = Attendance.objects.filter(
                student=student, madrasah=madrasah, date__gte=thirty_days_ago,
            ).order_by('-date')
            consecutive = 0
            for att in recent_att:
                if att.status in ('absent',):
                    consecutive += 1
                else:
                    break
            factors['consecutive_absences'] = consecutive

            # Calculate weighted risk score (0-100, higher = more at risk)
            att_risk = (1 - attendance_rate) * 30
            score_risk = max(0, (60 - avg_score) / 60) * 25
            hw_risk = (1 - hw_completion) * 25
            absence_risk = min(consecutive / 10, 1) * 20
            risk_score = round(att_risk + score_risk + hw_risk + absence_risk, 2)
            risk_score = min(max(risk_score, 0), 100)

            if risk_score >= 70:
                risk_level = 'critical'
            elif risk_score >= 50:
                risk_level = 'high'
            elif risk_score >= 30:
                risk_level = 'moderate'
            else:
                risk_level = 'low'

            counts[risk_level] += 1

            # Build recommendations
            recs = []
            if attendance_rate < 0.8:
                recs.append("Follow up on attendance - student absent more than 20% of the time")
            if avg_score < 60:
                recs.append("Schedule academic support sessions - average score below 60%")
            if hw_completion < 0.6:
                recs.append("Check homework submission barriers - completion rate below 60%")
            if consecutive >= 3:
                recs.append("Contact parents/guardians - consecutive absences detected")
            if not recs:
                recs.append("Student is performing well - continue monitoring")

            AtRiskPrediction.objects.update_or_create(
                madrasah=madrasah,
                student=student,
                defaults={
                    'risk_score': risk_score,
                    'risk_level': risk_level,
                    'factors': factors,
                    'recommendations': '\n'.join(recs),
                    'is_active': True,
                },
            )

        return Response({
            'generated': students.count(),
            'summary': counts,
        }, status=status.HTTP_201_CREATED)


# ── Teacher Workload ──

class TeacherWorkloadListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsMudeer]
    serializer_class = AtRiskPredictionSerializer  # placeholder, we override list

    def list(self, request, *args, **kwargs):
        madrasah = request.user.madrasah
        today = date.today()
        week_end = today + timedelta(days=(6 - today.weekday()))

        teachers = User.objects.filter(madrasah=madrasah, role='ustaadh', is_active=True)
        data = []
        for teacher in teachers:
            lesson_plans = Homework.objects.filter(
                madrasah=madrasah, teacher=teacher,
            ).count()
            homework_count = Homework.objects.filter(
                madrasah=madrasah, teacher=teacher,
            ).count()
            ungraded = HomeworkSubmission.objects.filter(
                homework__teacher=teacher, homework__madrasah=madrasah, status='submitted',
            ).count()
            upcoming = Homework.objects.filter(
                madrasah=madrasah, teacher=teacher, due_date__date__gte=today, due_date__date__lte=week_end,
            ).count()

            data.append({
                'teacher_id': teacher.id,
                'teacher_name': teacher.get_full_name(),
                'lesson_plans_count': lesson_plans,
                'homework_count': homework_count,
                'ungraded_submissions': ungraded,
                'upcoming_this_week': upcoming,
            })

        return Response(data)


class TeacherWorkloadMeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role not in ('ustaadh', 'mudeer', 'idaarah'):
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

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
            'teacher_id': user.id,
            'teacher_name': user.get_full_name(),
            'lesson_plans_count': lesson_plans,
            'homework_count': homework_count,
            'ungraded_submissions': ungraded,
            'upcoming_this_week': upcoming,
        })


# ── Skill Assessment ──

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


# ── Digital Portfolio ──

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
        madrasah = request.user.madrasah
        today = date.today()
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        week_end = today + timedelta(days=(6 - today.weekday()))

        total_students = User.objects.filter(madrasah=madrasah, role='student', is_active=True).count()
        total_teachers = User.objects.filter(madrasah=madrasah, role='ustaadh', is_active=True).count()

        # Today's attendance
        today_att = Attendance.objects.filter(madrasah=madrasah, date=today)
        today_total = today_att.count()
        today_present = today_att.filter(status='present').count()
        today_attendance_rate = round((today_present / today_total) * 100, 1) if today_total > 0 else 0
        today_absentees = today_att.filter(status='absent').count()

        # Fees
        from school_ops.models import Fee, FeePayment
        fees_this_month = FeePayment.objects.filter(
            fee__madrasah=madrasah, payment_date__gte=month_start.date(),
        ).aggregate(total=Coalesce(Sum('amount_paid'), Decimal('0')))['total']
        outstanding_fees = Fee.objects.filter(
            madrasah=madrasah,
        ).aggregate(
            total=Coalesce(Sum('amount') - Sum('amount_paid'), Decimal('0')),
        )['total']

        # Upcoming exams
        from results.models import Exam
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
        from school_ops.models import Notification
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
