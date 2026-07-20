from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Enrollment
from .enrollment_serializers import EnrollmentSerializer


class EnrollmentListView(generics.ListCreateAPIView):
    serializer_class = EnrollmentSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Enrollment.objects.filter(madrasah=user.madrasah)

        student_id = self.request.query_params.get('student')
        subject_id = self.request.query_params.get('subject')
        teacher_id = self.request.query_params.get('ustaadh')

        if student_id:
            qs = qs.filter(student_id=student_id)
        if subject_id:
            qs = qs.filter(subject_id=subject_id)
        if teacher_id:
            qs = qs.filter(ustaadh_id=teacher_id)

        return qs

    def perform_create(self, serializer):
        serializer.save(madrasah=self.request.user.madrasah)


class StudentEnrollmentsView(APIView):
    def get(self, request):
        enrollments = Enrollment.objects.filter(student=request.user)
        serializer = EnrollmentSerializer(enrollments, many=True)
        return Response(serializer.data)


class TeacherStudentsView(APIView):
    def get(self, request):
        enrollments = Enrollment.objects.filter(
            ustaadh=request.user
        ).select_related('student', 'subject')
        serializer = EnrollmentSerializer(enrollments, many=True)
        return Response(serializer.data)
