from collections import defaultdict

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


class AvailableSubjectsView(APIView):
    """Returns subjects that have at least one teacher assigned via enrollment."""
    def get(self, request):
        from curriculum.models import Subject
        madrasah = request.user.madrasah

        # Get subjects that have at least one teacher enrolled
        subject_ids = (
            Enrollment.objects.filter(
                madrasah=madrasah,
                ustaadh__isnull=False,
            )
            .values_list('subject_id', flat=True)
            .distinct()
        )
        subjects = Subject.objects.filter(id__in=subject_ids, madrasah=madrasah)
        data = [
            {'id': s.id, 'name_ar': s.name_ar, 'name_en': s.name_en, 'code': s.code}
            for s in subjects
        ]
        return Response(data)


class SubjectTeachersView(APIView):
    """Returns teachers for a given subject."""
    def get(self, request):
        subject_id = request.query_params.get('subject')
        if not subject_id:
            return Response([])

        madrasah = request.user.madrasah
        teachers = (
            Enrollment.objects.filter(
                madrasah=madrasah,
                subject_id=subject_id,
                ustaadh__isnull=False,
            )
            .select_related('ustaadh')
            .values_list('ustaadh_id', 'ustaadh__first_name', 'ustaadh__last_name')
            .distinct()
        )
        data = [
            {
                'id': t[0],
                'name': f'{t[1]} {t[2]}'.strip(),
            }
            for t in teachers
        ]
        return Response(data)


class StudentSelfEnrollView(APIView):
    """Lets a student enroll themselves in a subject (requires a teacher to be assigned)."""
    def post(self, request):
        user = request.user
        if user.role != 'student':
            return Response(
                {'error': 'Only students can self-enroll'},
                status=403)

        subject_id = request.data.get('subject')
        teacher_id = request.data.get('ustaadh')

        if not subject_id:
            return Response(
                {'error': 'subject is required'},
                status=400)

        # Check if already enrolled
        if Enrollment.objects.filter(
            student=user, subject_id=subject_id, madrasah=user.madrasah
        ).exists():
            return Response(
                {'error': 'Already enrolled in this subject'},
                status=400)

        # Find the teacher's school_class if not provided
        school_class = request.data.get('school_class')
        if not school_class and teacher_id:
            existing = Enrollment.objects.filter(
                ustaadh_id=teacher_id, subject_id=subject_id, madrasah=user.madrasah
            ).first()
            if existing:
                school_class = existing.school_class_id

        enrollment = Enrollment.objects.create(
            madrasah=user.madrasah,
            student=user,
            subject_id=subject_id,
            ustaadh_id=teacher_id,
            school_class_id=school_class,
        )
        return Response({
            'id': enrollment.id,
            'subject': enrollment.subject_id,
            'ustaadh': enrollment.ustaadh_id,
            'school_class': enrollment.school_class_id,
        }, status=201)
