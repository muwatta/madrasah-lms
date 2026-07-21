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
        class_id = self.request.query_params.get('school_class')

        if student_id:
            qs = qs.filter(student_id=student_id)
        if subject_id:
            qs = qs.filter(subject_id=subject_id)
        if teacher_id:
            qs = qs.filter(ustaadh_id=teacher_id)
        if class_id:
            qs = qs.filter(school_class_id=class_id)

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


class TeacherClassesView(APIView):
    def get(self, request):
        class_ids = (
            Enrollment.objects.filter(
                madrasah=request.user.madrasah,
                ustaadh=request.user,
            )
            .values_list('school_class_id', flat=True)
            .distinct()
        )
        from .models import SchoolClass
        classes = SchoolClass.objects.filter(id__in=class_ids).order_by('order')
        data = [
            {'id': c.id, 'name_ar': c.name_ar, 'name_en': c.name_en, 'order': c.order}
            for c in classes
        ]
        return Response(data)
