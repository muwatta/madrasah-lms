import logging
from django.utils import timezone
from django.db.models import Count, Q

logger = logging.getLogger(__name__)
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from config.permissions import IsMudeer
from .models import LessonPlan, Homework, HomeworkSubmission
from .serializers import (
    LessonPlanSerializer,
    HomeworkSerializer,
    HomeworkSubmissionSerializer,
    HomeworkSubmissionGradeSerializer,
)


def _filter_by_madrasah(qs, user):
    return qs.filter(madrasah=user.madrasah)


class LessonPlanListCreateView(generics.ListCreateAPIView):
    serializer_class = LessonPlanSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = _filter_by_madrasah(LessonPlan.objects.select_related(
            'subject', 'school_class', 'teacher', 'class_arm', 'term', 'approved_by'
        ), user)

        if user.role == 'ustaadh':
            qs = qs.filter(teacher=user)

        teacher_id = self.request.query_params.get('teacher')
        subject_id = self.request.query_params.get('subject')
        status_filter = self.request.query_params.get('status')
        school_class_id = self.request.query_params.get('school_class')

        if teacher_id:
            qs = qs.filter(teacher_id=teacher_id)
        if subject_id:
            qs = qs.filter(subject_id=subject_id)
        if status_filter:
            qs = qs.filter(status=status_filter)
        if school_class_id:
            qs = qs.filter(school_class_id=school_class_id)

        return qs

    def perform_create(self, serializer):
        serializer.save(madrasah=self.request.user.madrasah, teacher=self.request.user)


class LessonPlanDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = LessonPlanSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = _filter_by_madrasah(LessonPlan.objects.select_related(
            'subject', 'school_class', 'teacher', 'class_arm', 'term', 'approved_by'
        ), user)
        if user.role == 'ustaadh':
            qs = qs.filter(teacher=user)
        return qs


class LessonPlanApprovalView(APIView):
    permission_classes = [IsAuthenticated, IsMudeer]

    def patch(self, request, pk):
        user = request.user

        try:
            lesson_plan = LessonPlan.objects.get(pk=pk, madrasah=user.madrasah)
        except LessonPlan.DoesNotExist:
            return Response({'error': 'Lesson plan not found'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        if new_status not in ('approved', 'rejected'):
            return Response({'error': 'Status must be "approved" or "rejected"'},
                            status=status.HTTP_400_BAD_REQUEST)

        lesson_plan.status = new_status
        lesson_plan.approved_by = user
        lesson_plan.approval_notes = request.data.get('approval_notes', '')
        lesson_plan.save()

        logger.info("LessonPlan %s %s by %s (madrasah %s)", pk, new_status, user.id, user.madrasah_id)
        return Response(LessonPlanSerializer(lesson_plan).data)


class HomeworkListCreateView(generics.ListCreateAPIView):
    serializer_class = HomeworkSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = _filter_by_madrasah(Homework.objects.select_related(
            'subject', 'school_class', 'teacher'
        ), user)

        if user.role == 'ustaadh':
            qs = qs.filter(teacher=user)
        elif user.role == 'student':
            qs = qs.filter(is_published=True)

        subject_id = self.request.query_params.get('subject')
        school_class_id = self.request.query_params.get('school_class')
        teacher_id = self.request.query_params.get('teacher')
        overdue = self.request.query_params.get('overdue')

        if subject_id:
            qs = qs.filter(subject_id=subject_id)
        if school_class_id:
            qs = qs.filter(school_class_id=school_class_id)
        if teacher_id:
            qs = qs.filter(teacher_id=teacher_id)
        if overdue == 'true':
            qs = qs.filter(due_date__lt=timezone.now())

        return qs.annotate(submission_count=Count('submissions'))

    def perform_create(self, serializer):
        serializer.save(madrasah=self.request.user.madrasah, teacher=self.request.user)


class HomeworkDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = HomeworkSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = _filter_by_madrasah(Homework.objects.select_related(
            'subject', 'school_class', 'teacher'
        ), user)
        if user.role == 'ustaadh':
            qs = qs.filter(teacher=user)
        elif user.role == 'student':
            qs = qs.filter(is_published=True)
        return qs.annotate(submission_count=Count('submissions'))


class HomeworkSubmissionListCreateView(generics.ListCreateAPIView):
    serializer_class = HomeworkSubmissionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        homework_pk = self.kwargs.get('homework_pk')
        qs = HomeworkSubmission.objects.select_related(
            'student', 'homework', 'graded_by'
        ).filter(
            homework_id=homework_pk,
            madrasah=user.madrasah,
        )

        if user.role == 'student':
            qs = qs.filter(student=user)

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        homework_pk = self.kwargs.get('homework_pk')

        try:
            homework = Homework.objects.get(pk=homework_pk, madrasah=user.madrasah)
        except Homework.DoesNotExist:
            from django.core.exceptions import PermissionDenied
            raise PermissionDenied('Homework not found')

        if not homework.is_published and user.role == 'student':
            from django.core.exceptions import PermissionDenied
            raise PermissionDenied('Homework is not published')

        is_late = timezone.now() > homework.due_date
        if is_late and not homework.late_submission_allowed:
            from django.core.exceptions import PermissionDenied
            raise PermissionDenied('Late submissions are not allowed for this homework')

        serializer.save(
            madrasah=user.madrasah,
            student=user,
            is_late=is_late,
        )


class PendingGradingView(generics.ListAPIView):
    serializer_class = HomeworkSubmissionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = HomeworkSubmission.objects.select_related(
            'student', 'homework', 'graded_by'
        ).filter(
            madrasah=user.madrasah,
            status='submitted',
        )
        if user.role == 'ustaadh':
            qs = qs.filter(homework__teacher=user)
        return qs


class HomeworkSubmissionGradeView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        user = request.user
        if user.role not in ('ustaadh', 'mudeer', 'idaarah'):
            return Response({'error': 'Only teachers or administrators can grade submissions'},
                            status=status.HTTP_403_FORBIDDEN)

        try:
            submission = HomeworkSubmission.objects.get(pk=pk, madrasah=user.madrasah)
        except HomeworkSubmission.DoesNotExist:
            return Response({'error': 'Submission not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = HomeworkSubmissionGradeSerializer(submission, data=request.data, partial=True)
        if serializer.is_valid():
            submission = serializer.save(
                graded_by=user,
                graded_at=timezone.now(),
                status='graded',
            )
            logger.info("Homework submission %s graded by user %s (score: %s)", submission.id, user.id, submission.score)
            return Response(HomeworkSubmissionSerializer(submission).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
