import logging

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Avg, Count
from .models import Exam, ExamResult
from .serializers import ExamSerializer, ExamResultSerializer
from users.models import User

logger = logging.getLogger(__name__)


class ExamListView(generics.ListCreateAPIView):
    serializer_class = ExamSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Exam.objects.filter(madrasah=user.madrasah).select_related('created_by', 'subject')
        subject_id = self.request.query_params.get('subject')
        if subject_id:
            qs = qs.filter(subject_id=subject_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(madrasah=self.request.user.madrasah, created_by=self.request.user)


class ExamDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ExamSerializer

    def get_queryset(self):
        return Exam.objects.filter(madrasah=self.request.user.madrasah)


class ExamResultListView(APIView):
    def get(self, request, exam_pk):
        try:
            exam = Exam.objects.get(pk=exam_pk, madrasah=request.user.madrasah)
        except Exam.DoesNotExist:
            return Response({'error': 'Exam not found'}, status=status.HTTP_404_NOT_FOUND)

        results = ExamResult.objects.filter(exam=exam).select_related('student', 'exam')
        serializer = ExamResultSerializer(results, many=True)
        return Response(serializer.data)

    def post(self, request, exam_pk):
        try:
            exam = Exam.objects.get(pk=exam_pk, madrasah=request.user.madrasah)
        except Exam.DoesNotExist:
            return Response({'error': 'Exam not found'}, status=status.HTTP_404_NOT_FOUND)

        student_id = request.data.get('student')
        score = request.data.get('score')

        if score is None or student_id is None:
            return Response({'error': 'student and score required'}, status=status.HTTP_400_BAD_REQUEST)

        if not User.objects.filter(id=student_id, madrasah=request.user.madrasah, role='student').exists():
            return Response({'error': 'Student not found in this madrasah'}, status=status.HTTP_400_BAD_REQUEST)

        grade = ExamResult.calculate_grade(float(score), float(exam.total_marks))

        result, created = ExamResult.objects.update_or_create(
            exam=exam,
            student_id=student_id,
            defaults={
                'score': score,
                'grade': grade,
                'remarks': request.data.get('remarks', ''),
            }
        )

        logger.info("Exam result %s for student %s on exam %s by user %s", "created" if created else "updated", student_id, exam.id, request.user.id)
        return Response(ExamResultSerializer(result).data, status=status.HTTP_201_CREATED)


class StudentExamResultsView(APIView):
    def get(self, request):
        results = ExamResult.objects.filter(student=request.user).select_related('exam')
        serializer = ExamResultSerializer(results, many=True)
        return Response(serializer.data)


class ExamResultsBulkUploadView(APIView):
    def post(self, request, exam_pk):
        try:
            exam = Exam.objects.get(pk=exam_pk, madrasah=request.user.madrasah)
        except Exam.DoesNotExist:
            return Response({'error': 'Exam not found'}, status=status.HTTP_404_NOT_FOUND)

        results_data = request.data.get('results', [])
        created_count = 0
        updated_count = 0

        valid_student_ids = set(
            User.objects.filter(
                id__in=[item.get('student') for item in results_data if item.get('student')],
                madrasah=request.user.madrasah,
                role='student',
            ).values_list('id', flat=True)
        )

        for item in results_data:
            student_id = item.get('student')
            score = item.get('score')
            if student_id is None or score is None:
                continue
            if student_id not in valid_student_ids:
                continue

            grade = ExamResult.calculate_grade(float(score), float(exam.total_marks))
            _, created = ExamResult.objects.update_or_create(
                exam=exam,
                student_id=student_id,
                defaults={
                    'score': score,
                    'grade': grade,
                    'remarks': item.get('remarks', ''),
                }
            )
            if created:
                created_count += 1
            else:
                updated_count += 1

        logger.info(
            "Bulk exam results uploaded for exam %s: created=%s updated=%s by user %s",
            exam.id, created_count, updated_count, request.user.id,
        )
        return Response({
            'created': created_count,
            'updated': updated_count,
        })
