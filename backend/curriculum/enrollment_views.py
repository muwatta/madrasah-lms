from django.db.models import Q

from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied
from config.permissions import CanManageEnrollments
from .models import Enrollment, SchoolClass
from .enrollment_serializers import EnrollmentSerializer


class EnrollmentListView(generics.ListCreateAPIView):
    serializer_class = EnrollmentSerializer
    permission_classes = [CanManageEnrollments]

    def get_queryset(self):
        user = self.request.user
        qs = Enrollment.objects.filter(madrasah=user.madrasah).select_related('student', 'subject', 'school_class').order_by('id')

        # Teachers see the classes they lead plus the students they teach.
        if user.role not in ('mudeer', 'idaarah'):
            qs = qs.filter(Q(school_class__class_teacher=user) | Q(ustaadh=user))

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
        user = self.request.user
        school_class = serializer.validated_data.get('school_class')
        if user.role not in ('mudeer', 'idaarah'):
            if school_class is None or school_class.class_teacher_id != user.id:
                raise PermissionDenied('Only the class teacher can manage enrollments for this class.')
        serializer.save(madrasah=user.madrasah)


class EnrollmentDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = EnrollmentSerializer
    permission_classes = [CanManageEnrollments]

    def get_queryset(self):
        user = self.request.user
        qs = Enrollment.objects.filter(madrasah=user.madrasah)
        if user.role not in ('mudeer', 'idaarah'):
            qs = qs.filter(Q(school_class__class_teacher=user) | Q(ustaadh=user))
        return qs


class StudentEnrollmentsView(APIView):
    def get(self, request):
        enrollments = Enrollment.objects.filter(student=request.user)
        serializer = EnrollmentSerializer(enrollments, many=True)
        return Response(serializer.data)


class TeacherStudentsView(APIView):
    """Returns unique students for the teacher, grouped by student.

    Each student appears once with aggregated subject info.
    If a teacher teaches 5 subjects and has 20 students, returns 20 rows (not 100).
    """
    def get(self, request):
        enrollments = Enrollment.objects.filter(
            ustaadh=request.user
        ).select_related('student', 'subject', 'school_class')

        # Group by student_id, collect subjects
        students_map = {}
        for enr in enrollments:
            sid = enr.student_id
            if sid not in students_map:
                students_map[sid] = {
                    'student_id': sid,
                    'id': enr.student.pk,
                    'student_name': enr.student.get_full_name(),
                    'student_email': enr.student.email,
                    'school_class': enr.school_class_id,
                    'school_class_name': enr.school_class.name_en if enr.school_class else '',
                    'subjects': [],
                }
            students_map[sid]['subjects'].append({
                'id': enr.subject_id,
                'name': enr.subject.name_ar,
                'name_en': enr.subject.name_en,
            })

        # For backward compat: return first subject as primary, list all subjects
        result = []
        for s in students_map.values():
            s['subject'] = s['subjects'][0]['id'] if s['subjects'] else 0
            s['subject_name'] = s['subjects'][0]['name'] if s['subjects'] else ''
            s['subject_name_en'] = s['subjects'][0]['name_en'] if s['subjects'] else ''
            result.append(s)

        return Response(result)


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


class ClassTeacherClassesView(APIView):
    """Returns the classes where the current user is the class teacher."""
    def get(self, request):
        classes = SchoolClass.objects.filter(
            madrasah=request.user.madrasah,
            class_teacher=request.user,
        ).order_by('order')
        data = [
            {'id': c.id, 'name_ar': c.name_ar, 'name_en': c.name_en, 'order': c.order}
            for c in classes
        ]
        return Response(data)
