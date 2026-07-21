from datetime import timedelta

from django.db.models import Avg, Count, Q, Sum
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView
from users.models import User, StudentParent
from assessments.models import Quiz, QuizAttempt
from results.models import Exam, ExamResult
from curriculum.models import Subject, Enrollment
from school_ops.models import Attendance, Fee


class TeacherDashboardView(APIView):
    def get(self, request):
        user = request.user
        madrasah = user.madrasah

        subjects = Subject.objects.filter(madrasah=madrasah)
        enrollments = Enrollment.objects.filter(ustaadh=user)
        students = User.objects.filter(
            id__in=enrollments.values_list('student_id', flat=True)
        ).distinct()

        subject_performance = []
        for subject in subjects:
            subject_enrollments = enrollments.filter(subject=subject)
            student_ids = subject_enrollments.values_list('student_id', flat=True)

            avg_score = QuizAttempt.objects.filter(
                student_id__in=student_ids,
                quiz__subject=subject,
                percentage__isnull=False
            ).aggregate(avg=Avg('percentage'))['avg']

            subject_performance.append({
                'subject_id': subject.id,
                'subject_name': subject.name_ar,
                'student_count': subject_enrollments.count(),
                'average_score': round(avg_score, 1) if avg_score else 0,
            })

        recent_quizzes = Quiz.objects.filter(created_by=user).order_by('-created_at')[:5]
        recent_activity = []
        for quiz in recent_quizzes:
            attempts = quiz.attempts.filter(submitted_at__isnull=False)
            avg = attempts.aggregate(avg=Avg('percentage'))['avg']
            recent_activity.append({
                'quiz_id': quiz.id,
                'quiz_title': quiz.title,
                'subject': quiz.subject.name_ar,
                'attempt_count': attempts.count(),
                'average_score': round(avg, 1) if avg else 0,
                'created_at': quiz.created_at.isoformat(),
            })

        total_students = students.count()
        total_quizzes = Quiz.objects.filter(created_by=user).count()
        total_attempts = QuizAttempt.objects.filter(
            student__in=students,
            submitted_at__isnull=False
        ).count()

        return Response({
            'total_students': total_students,
            'total_quizzes': total_quizzes,
            'total_attempts': total_attempts,
            'subject_performance': subject_performance,
            'recent_activity': recent_activity,
        })


class TeacherStudentPerformanceView(APIView):
    def get(self, request, student_id):
        if request.user.role != 'ustaadh':
            return Response({'error': 'Access denied'}, status=403)

        try:
            student = User.objects.get(id=student_id, role='student', madrasah=request.user.madrasah)
        except User.DoesNotExist:
            return Response({'error': 'Student not found'}, status=404)

        attempts = QuizAttempt.objects.filter(
            student=student,
            submitted_at__isnull=False
        ).select_related('quiz', 'quiz__subject').order_by('-submitted_at')

        performance_data = []
        for attempt in attempts:
            performance_data.append({
                'id': attempt.id,
                'quiz_title': attempt.quiz.title,
                'subject': attempt.quiz.subject.name_ar,
                'score': float(attempt.score) if attempt.score is not None else None,
                'percentage': float(attempt.percentage) if attempt.percentage is not None else None,
                'submitted_at': attempt.submitted_at.isoformat() if attempt.submitted_at else None,
            })

        overall_avg = attempts.filter(
            percentage__isnull=False
        ).aggregate(avg=Avg('percentage'))['avg']

        exam_results = ExamResult.objects.filter(student=student).select_related('exam')
        exam_data = []
        for result in exam_results:
            exam_data.append({
                'id': result.id,
                'exam_title': result.exam.title,
                'subject': result.exam.subject.name_ar,
                'score': float(result.score),
                'grade': result.grade,
                'exam_date': result.exam.exam_date.isoformat(),
            })

        return Response({
            'student': {
                'id': student.id,
                'name': student.get_full_name(),
                'email': student.email,
            },
            'overall_average': round(overall_avg, 1) if overall_avg else 0,
            'quiz_attempts': performance_data,
            'exam_results': exam_data,
        })


class ParentDashboardView(APIView):
    def get(self, request):
        user = request.user
        children_links = StudentParent.objects.filter(parent=user).select_related('student')
        children = [link.student for link in children_links]

        children_data = []
        for child in children:
            attempts = QuizAttempt.objects.filter(
                student=child,
                submitted_at__isnull=False
            )

            avg_score = attempts.aggregate(avg=Avg('percentage'))['avg']

            recent_attempts = attempts.order_by('-submitted_at')[:5]
            recent = []
            for a in recent_attempts:
                recent.append({
                    'quiz_title': a.quiz.title,
                    'percentage': float(a.percentage) if a.percentage else None,
                    'submitted_at': a.submitted_at.isoformat() if a.submitted_at else None,
                })

            exam_results = ExamResult.objects.filter(student=child).select_related('exam')
            exams = []
            for r in exam_results:
                exams.append({
                    'exam_title': r.exam.title,
                    'score': float(r.score),
                    'grade': r.grade,
                    'exam_date': r.exam.exam_date.isoformat(),
                })

            subjects = Subject.objects.filter(
                enrollments__student=child
            ).values_list('name_ar', flat=True)

            children_data.append({
                'id': child.id,
                'name': child.get_full_name(),
                'email': child.email,
                'overall_average': round(avg_score, 1) if avg_score else None,
                'total_quizzes': attempts.count(),
                'subjects': list(subjects),
                'recent_attempts': recent,
                'exam_results': exams,
            })

        thirty_days_ago = timezone.now().date() - timedelta(days=30)

        total_due = Fee.objects.filter(
            student__in=children, status__in=['pending', 'overdue', 'partial']
        ).aggregate(total=Sum('amount'))['total'] or 0

        total_paid = Fee.objects.filter(
            student__in=children
        ).aggregate(total=Sum('amount_paid'))['total'] or 0

        overdue_fees = Fee.objects.filter(student__in=children, status='overdue')
        overdue_count = overdue_fees.count()
        overdue_amount = overdue_fees.aggregate(total=Sum('amount'))['total'] or 0

        att_records = Attendance.objects.filter(
            student__in=children, date__gte=thirty_days_ago
        )
        att_total = att_records.count()
        att_present = att_records.filter(status='present').count()
        att_absent = att_records.filter(status='absent').count()

        return Response({
            'children': children_data,
            'fee_summary': {
                'total_due': float(total_due),
                'total_paid': float(total_paid),
                'outstanding': float(total_due - total_paid),
                'overdue_count': overdue_count,
                'overdue_amount': float(overdue_amount),
            },
            'attendance_summary': {
                'total_days': att_total,
                'present': att_present,
                'absent': att_absent,
                'overall_rate': round((att_present / att_total) * 100, 1) if att_total > 0 else 0,
            },
        })


class AdminDashboardView(APIView):
    def get(self, request):
        user = request.user
        madrasah = user.madrasah

        total_users = User.objects.filter(madrasah=madrasah).count()
        total_students = User.objects.filter(madrasah=madrasah, role='student').count()
        total_teachers = User.objects.filter(madrasah=madrasah, role='ustaadh').count()
        total_parents = User.objects.filter(madrasah=madrasah, role='parent').count()

        total_subjects = Subject.objects.filter(madrasah=madrasah).count()
        total_quizzes = Quiz.objects.filter(madrasah=madrasah).count()
        total_exams = Exam.objects.filter(madrasah=madrasah).count()

        avg_performance = QuizAttempt.objects.filter(
            quiz__madrasah=madrasah,
            percentage__isnull=False
        ).aggregate(avg=Avg('percentage'))['avg']

        subject_stats = Subject.objects.filter(madrasah=madrasah).annotate(
            student_count=Count('enrollments', distinct=True),
            quiz_count=Count('quizzes', distinct=True),
        ).values('id', 'name_ar', 'student_count', 'quiz_count')

        return Response({
            'total_users': total_users,
            'total_students': total_students,
            'total_teachers': total_teachers,
            'total_parents': total_parents,
            'total_subjects': total_subjects,
            'total_quizzes': total_quizzes,
            'total_exams': total_exams,
            'average_performance': round(avg_performance, 1) if avg_performance else 0,
            'subject_stats': list(subject_stats),
        })


class StudentDashboardView(APIView):
    def get(self, request):
        user = request.user
        madrasah = user.madrasah

        from curriculum.enrollment_serializers import EnrollmentSerializer
        from assessments.serializers import QuizListSerializer, QuizAttemptSerializer
        from results.serializers import ExamResultSerializer

        enrollments = Enrollment.objects.filter(student=user)
        quizzes = Quiz.objects.filter(madrasah=madrasah, is_published=True)
        attempts = QuizAttempt.objects.filter(student=user)
        exam_results = ExamResult.objects.filter(student=user).select_related('exam')

        return Response({
            'enrollments': EnrollmentSerializer(enrollments, many=True).data,
            'quizzes': QuizListSerializer(quizzes, many=True).data,
            'attempts': QuizAttemptSerializer(attempts, many=True).data,
            'exam_results': ExamResultSerializer(exam_results, many=True).data,
        })


class BoardDashboardView(APIView):
    def get(self, request):
        user = request.user
        madrasah = user.madrasah

        total_students = User.objects.filter(madrasah=madrasah, role='student').count()
        total_teachers = User.objects.filter(madrasah=madrasah, role='ustaadh').count()
        total_subjects = Subject.objects.filter(madrasah=madrasah).count()

        avg_performance = QuizAttempt.objects.filter(
            quiz__madrasah=madrasah,
            percentage__isnull=False
        ).aggregate(avg=Avg('percentage'))['avg']

        teacher_effectiveness = []
        for teacher in User.objects.filter(madrasah=madrasah, role='ustaadh'):
            teacher_attempts = QuizAttempt.objects.filter(
                quiz__created_by=teacher,
                percentage__isnull=False
            )
            avg = teacher_attempts.aggregate(avg=Avg('percentage'))['avg']
            teacher_effectiveness.append({
                'teacher_id': teacher.id,
                'name': teacher.get_full_name(),
                'quiz_count': Quiz.objects.filter(created_by=teacher).count(),
                'average_student_score': round(avg, 1) if avg else 0,
                'total_attempts': teacher_attempts.count(),
            })

        teacher_effectiveness.sort(key=lambda x: x['average_student_score'], reverse=True)

        top_subjects = Subject.objects.filter(madrasah=madrasah).annotate(
            avg_score=Avg('quizzes__attempts__percentage')
        ).order_by('-avg_score')[:5].values('name_ar', 'avg_score')

        return Response({
            'total_students': total_students,
            'total_teachers': total_teachers,
            'total_subjects': total_subjects,
            'average_performance': round(avg_performance, 1) if avg_performance else 0,
            'teacher_effectiveness': teacher_effectiveness,
            'top_subjects': [
                {'name': s['name_ar'], 'avg_score': round(s['avg_score'], 1) if s['avg_score'] else 0}
                for s in top_subjects
            ],
        })
