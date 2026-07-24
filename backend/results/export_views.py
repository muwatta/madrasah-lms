import csv
import json
from django.db.models import Avg
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from users.models import User
from assessments.models import QuizAttempt
from results.models import ExamResult, SubjectResult, TermResult


class ExportStudentPerformanceView(APIView):
    def get(self, request):
        fmt = request.query_params.get('format', 'csv')
        students = User.objects.filter(madrasah=request.user.madrasah, role='student')

        data = []
        for student in students:
            attempts = QuizAttempt.objects.filter(student=student, submitted_at__isnull=False)
            avg = attempts.aggregate(avg=Avg('percentage'))['avg']

            data.append({
                'student_id': student.id,
                'name': student.get_full_name(),
                'email': student.email,
                'total_quizzes': attempts.count(),
                'average_score': round(float(avg), 1) if avg else 0,
            })

        if fmt == 'json':
            return Response(data)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="student_performance.csv"'

        if data:
            writer = csv.DictWriter(response, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)
        return response


class ExportQuizResultsView(APIView):
    def get(self, request, quiz_id):
        from assessments.models import Quiz
        try:
            quiz = Quiz.objects.get(pk=quiz_id, madrasah=request.user.madrasah)
        except Quiz.DoesNotExist:
            return Response({'error': 'Quiz not found'}, status=404)

        attempts = QuizAttempt.objects.filter(quiz=quiz, submitted_at__isnull=False).select_related('student')
        fmt = request.query_params.get('format', 'csv')

        data = []
        for attempt in attempts:
            data.append({
                'student': attempt.student.get_full_name(),
                'score': float(attempt.score) if attempt.score is not None else '',
                'percentage': float(attempt.percentage) if attempt.percentage is not None else '',
                'attempt_number': attempt.attempt_number,
                'submitted_at': attempt.submitted_at.isoformat() if attempt.submitted_at else '',
            })

        if fmt == 'json':
            return Response(data)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="quiz_{quiz_id}_results.csv"'
        if data:
            writer = csv.DictWriter(response, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)
        return response


class ExportExamResultsView(APIView):
    def get(self, request, exam_id):
        from results.models import Exam
        try:
            exam = Exam.objects.get(pk=exam_id, madrasah=request.user.madrasah)
        except Exam.DoesNotExist:
            return Response({'error': 'Exam not found'}, status=404)

        results = ExamResult.objects.filter(exam=exam).select_related('student')
        fmt = request.query_params.get('format', 'csv')

        data = []
        for r in results:
            data.append({
                'student': r.student.get_full_name(),
                'score': float(r.score),
                'grade': r.grade,
                'remarks': r.remarks,
                'recorded_at': r.recorded_at.isoformat(),
            })

        if fmt == 'json':
            return Response(data)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="exam_{exam_id}_results.csv"'
        if data:
            writer = csv.DictWriter(response, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)
        return response


class ExportSubjectResultsView(APIView):
    def get(self, request):
        fmt = request.query_params.get('format', 'csv')
        term_id = request.query_params.get('term_id')
        class_id = request.query_params.get('class_id')

        qs = SubjectResult.objects.filter(
            subject__madrasah=request.user.madrasah
        ).select_related('student', 'subject', 'term', 'school_class')

        if term_id:
            qs = qs.filter(term_id=term_id)
        if class_id:
            qs = qs.filter(school_class_id=class_id)

        data = []
        for r in qs:
            data.append({
                'student': r.student.get_full_name(),
                'student_email': r.student.email,
                'subject': r.subject.name_en or r.subject.name_ar,
                'term': f"Term {r.term.term_number}",
                'class': r.school_class.name_en if r.school_class else '',
                'total_score': float(r.total_score),
                'grade': r.grade,
                'grade_remark': r.grade_remark,
                'gpa_points': float(r.gpa_points),
                'teacher_comment': r.teacher_comment,
                'status': r.status,
            })

        if fmt == 'json':
            return Response(data)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="subject_results_export.csv"'
        if data:
            writer = csv.DictWriter(response, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)
        return response


class ExportTermResultsView(APIView):
    def get(self, request):
        fmt = request.query_params.get('format', 'csv')
        term_id = request.query_params.get('term_id')
        class_id = request.query_params.get('class_id')

        qs = TermResult.objects.filter(
            term__madrasah=request.user.madrasah
        ).select_related('student', 'term', 'school_class')

        if term_id:
            qs = qs.filter(term_id=term_id)
        if class_id:
            qs = qs.filter(school_class_id=class_id)

        data = []
        for r in qs:
            data.append({
                'student': r.student.get_full_name(),
                'student_email': r.student.email,
                'term': f"Term {r.term.term_number}",
                'class': r.school_class.name_en if r.school_class else '',
                'average_score': float(r.average_score),
                'gpa': float(r.gpa),
                'grade': r.grade,
                'grade_remark': r.grade_remark,
                'position': r.position or '',
                'class_size': r.class_size,
                'total_subjects': r.total_subjects,
                'subjects_passed': r.subjects_passed,
                'subjects_failed': r.subjects_failed,
                'teacher_comment': r.teacher_comment,
                'principal_comment': r.principal_comment,
                'status': r.status,
            })

        if fmt == 'json':
            return Response(data)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="term_results_export.csv"'
        if data:
            writer = csv.DictWriter(response, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)
        return response
