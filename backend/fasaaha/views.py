"""
Fasaaha API views — thin view layer.

All business logic is delegated to services. Views handle:
- Request parsing
- Permission checks
- Response formatting
"""
from __future__ import annotations

import logging

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from config.mixins import TenantAwareMixin

from .models import (
    SpeakingLevel, MissionCategory, Mission, SpeakingAttempt,
    AIAnalysis, TeacherReview, MissionAssignment,
    StudentLevelProgress, StudentStreak, Badge, StudentBadge,
)
from .serializers import (
    SpeakingLevelSerializer, SpeakingLevelWriteSerializer,
    MissionCategorySerializer, MissionCategoryWriteSerializer,
    MissionSerializer, MissionWriteSerializer,
    SpeakingAttemptSerializer, SpeakingAttemptWriteSerializer, AttemptRetrySerializer,
    AIAnalysisSerializer,
    TeacherReviewSerializer, TeacherReviewWriteSerializer,
    MissionAssignmentSerializer, MissionAssignmentWriteSerializer,
    StudentLevelProgressSerializer, StudentStreakSerializer,
    BadgeSerializer, BadgeWriteSerializer, StudentBadgeSerializer,
    StudentDashboardSerializer, TeacherDashboardSerializer,
)
from .services import (
    MissionService, AttemptService, ReviewService, AssignmentService,
    ProgressService, StreakService, BadgeService,
)
from .selectors import (
    get_levels, get_level_by_id,
    get_categories, get_category_by_id,
    get_missions, get_mission_by_id, get_missions_for_level,
    get_attempts_for_student, get_attempt_by_id, get_pending_review_attempts,
    get_attempt_count_for_mission, get_best_attempt,
    get_analysis_for_attempt, get_reviews_for_attempt,
    get_assignments, get_assignment_by_id,
    get_student_progress, get_progress_for_level,
    get_student_streak, get_badges, get_student_badges,
    get_class_analytics, get_student_analytics, get_school_analytics,
    get_student_dashboard_data, get_teacher_dashboard_data,
)
from .permissions import (
    CanViewMissions, CanManageMissions, CanSubmitAttempt,
    CanViewOwnAttempts, CanReviewAttempts, CanManageAssignments,
    CanViewProgress, CanManageLevels, CanManageCategories,
    CanViewAnalytics, CanViewSchoolAnalytics,
)

logger = logging.getLogger(__name__)


#  Levels


class SpeakingLevelListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return SpeakingLevelWriteSerializer
        return SpeakingLevelSerializer

    def get_queryset(self):
        return get_levels(madrasah=self.request.user.madrasah)  # pyright: ignore[reportAttributeAccessIssue]

    def perform_create(self, serializer):
        data = serializer.validated_data
        SpeakingLevel.objects.create(
            madrasah=self.request.user.madrasah,  # pyright: ignore[reportAttributeAccessIssue]
            **data,
        )


class SpeakingLevelDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SpeakingLevelSerializer
    permission_classes = [IsAuthenticated, CanManageLevels]

    def get_queryset(self):
        return get_levels(madrasah=self.request.user.madrasah, active_only=False)  # pyright: ignore[reportAttributeAccessIssue]

    def perform_update(self, serializer):
        level = self.get_object()
        for field, val in serializer.validated_data.items():
            setattr(level, field, val)
        level.save()

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()


#  Categories


class MissionCategoryListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MissionCategoryWriteSerializer
        return MissionCategorySerializer

    def get_queryset(self):
        return get_categories(madrasah=self.request.user.madrasah)  # pyright: ignore[reportAttributeAccessIssue]

    def perform_create(self, serializer):
        data = serializer.validated_data
        MissionCategory.objects.create(
            madrasah=self.request.user.madrasah,  # pyright: ignore[reportAttributeAccessIssue]
            **data,
        )


class MissionCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MissionCategorySerializer
    permission_classes = [IsAuthenticated, CanManageCategories]

    def get_queryset(self):
        return get_categories(madrasah=self.request.user.madrasah, active_only=False) 


#  Missions


class MissionListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, CanViewMissions]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MissionWriteSerializer
        return MissionSerializer

    def get_queryset(self):
        qs = get_missions(madrasah=self.request.user.madrasah)  # pyright: ignore[reportAttributeAccessIssue]

        level_id = self.request.query_params.get('level')  # pyright: ignore[reportAttributeAccessIssue]
        category_id = self.request.query_params.get('category')  # pyright: ignore[reportAttributeAccessIssue]
        difficulty = self.request.query_params.get('difficulty')  # pyright: ignore[reportAttributeAccessIssue]

        if level_id:
            qs = qs.filter(level_id=level_id)
        if category_id:
            qs = qs.filter(category_id=category_id)
        if difficulty:
            qs = qs.filter(difficulty=difficulty)

        return qs

    def perform_create(self, serializer):
        data = serializer.validated_data
        level_id = data.pop('level')
        category_id = data.pop('category', None)

        from .selectors import get_level_by_id, get_category_by_id
        level = get_level_by_id(level_id=level_id, madrasah=self.request.user.madrasah)  # pyright: ignore[reportAttributeAccessIssue]
        category = None
        if category_id:
            category = get_category_by_id(category_id=category_id, madrasah=self.request.user.madrasah)  # pyright: ignore[reportAttributeAccessIssue]

        MissionService.create_mission(
            madrasah=self.request.user.madrasah,  # pyright: ignore[reportAttributeAccessIssue]
            level=level,
            category=category,
            created_by=self.request.user,
            **data,
        )


class MissionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MissionSerializer
    permission_classes = [IsAuthenticated, CanViewMissions]

    def get_queryset(self):
        return get_missions(madrasah=self.request.user.madrasah, active_only=False)  # pyright: ignore[reportAttributeAccessIssue]

    def perform_update(self, serializer):
        mission = self.get_object()
        data = serializer.validated_data

        if 'level' in data:
            from .selectors import get_level_by_id
            data['level'] = get_level_by_id(level_id=data['level'], madrasah=self.request.user.madrasah)  # pyright: ignore[reportAttributeAccessIssue]
        if 'category' in data:
            from .selectors import get_category_by_id
            if data['category']:
                data['category'] = get_category_by_id(category_id=data['category'], madrasah=self.request.user.madrasah)  # pyright: ignore[reportAttributeAccessIssue]

        MissionService.update_mission(mission=mission, **data)

    def perform_destroy(self, instance):
        MissionService.deactivate_mission(mission=instance)


class LevelMissionsView(generics.ListAPIView):
    """List missions for a specific level."""
    serializer_class = MissionSerializer
    permission_classes = [IsAuthenticated, CanViewMissions]

    def get_queryset(self):
        level_id = self.kwargs['level_id']
        return get_missions_for_level(level_id=level_id, madrasah=self.request.user.madrasah)  # pyright: ignore[reportAttributeAccessIssue]


#  Attempts


class AttemptListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return SpeakingAttemptWriteSerializer
        return SpeakingAttemptSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':  # pyright: ignore[reportAttributeAccessIssue]
            return get_attempts_for_student(student=user, madrasah=user.madrasah)  # pyright: ignore[reportAttributeAccessIssue]
        return SpeakingAttempt.objects.filter(
            madrasah=user.madrasah,  # pyright: ignore[reportAttributeAccessIssue]
        ).select_related('student', 'mission', 'mission__level', 'mission__category')

    def perform_create(self, serializer):
        data = serializer.validated_data
        mission = get_mission_by_id(mission_id=data['mission'], madrasah=self.request.user.madrasah)  # pyright: ignore[reportAttributeAccessIssue]

        attempt = AttemptService.submit_attempt(
            student=self.request.user,
            mission=mission,
            audio_file=data['audio'],
            madrasah=self.request.user.madrasah,  # pyright: ignore[reportAttributeAccessIssue]
            notes=data.get('notes', ''),
        )

        from .tasks import process_speaking_attempt
        process_speaking_attempt.delay(attempt.id)  # pyright: ignore[reportAttributeAccessIssue]

        self._created_attempt = attempt

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        output_serializer = SpeakingAttemptSerializer(
            self._created_attempt, context={'request': request})
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)


class AttemptDetailView(generics.RetrieveAPIView):
    serializer_class = SpeakingAttemptSerializer
    permission_classes = [IsAuthenticated, CanViewOwnAttempts]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':  # pyright: ignore[reportAttributeAccessIssue]
            return get_attempts_for_student(student=user, madrasah=user.madrasah)  # pyright: ignore[reportAttributeAccessIssue]
        return SpeakingAttempt.objects.filter(
            madrasah=user.madrasah,  # pyright: ignore[reportAttributeAccessIssue]
        ).select_related('student', 'mission', 'mission__level', 'mission__category')


class AttemptRetryView(APIView):
    """Retry a mission (increment attempt number)."""
    permission_classes = [IsAuthenticated, CanSubmitAttempt]

    def post(self, request, pk):
        try:
            original = get_attempt_by_id(attempt_id=pk, madrasah=request.user.madrasah)  # pyright: ignore[reportAttributeAccessIssue]
        except SpeakingAttempt.DoesNotExist:
            return Response(
                {'error': 'Attempt not found'},
                status=status.HTTP_404_NOT_FOUND)

        serializer = AttemptRetrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        attempt = AttemptService.submit_attempt(
            student=request.user,
            mission=original.mission,
            audio_file=serializer.validated_data['audio'],
            madrasah=request.user.madrasah,  # pyright: ignore[reportAttributeAccessIssue]
            notes=serializer.validated_data.get('notes', ''),
        )

        from .tasks import process_speaking_attempt
        process_speaking_attempt.delay(attempt.id)  # pyright: ignore[reportAttributeAccessIssue]

        return Response(
            SpeakingAttemptSerializer(attempt, context={'request': request}).data,
            status=status.HTTP_201_CREATED)


#  AI Analysis


class AIAnalysisView(generics.RetrieveAPIView):
    serializer_class = AIAnalysisSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        attempt_id = self.kwargs['attempt_pk']
        analysis = get_analysis_for_attempt(attempt_id=attempt_id)
        if not analysis:
            from rest_framework.exceptions import NotFound
            raise NotFound("AI analysis not found")
        return analysis


#  Teacher Reviews


class PendingReviewListView(generics.ListAPIView):
    """List attempts pending teacher review."""
    serializer_class = SpeakingAttemptSerializer
    permission_classes = [IsAuthenticated, CanReviewAttempts]

    def get_queryset(self):
        return get_pending_review_attempts(
            madrasah=self.request.user.madrasah,  # pyright: ignore[reportAttributeAccessIssue]
            teacher=self.request.user if self.request.user.role == 'ustaadh' else None,  # pyright: ignore[reportAttributeAccessIssue]
        )


class ReviewListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, CanReviewAttempts]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TeacherReviewWriteSerializer
        return TeacherReviewSerializer

    def get_queryset(self):
        attempt_id = self.request.query_params.get('attempt')  # pyright: ignore[reportAttributeAccessIssue]
        if attempt_id:
            return get_reviews_for_attempt(attempt_id=attempt_id)
        return TeacherReview.objects.filter(
            madrasah=self.request.user.madrasah,  # pyright: ignore[reportAttributeAccessIssue]
        ).select_related('teacher', 'attempt', 'attempt__student', 'attempt__mission')

    def perform_create(self, serializer):
        data = serializer.validated_data
        attempt = get_attempt_by_id(
            attempt_id=data.pop('attempt'), madrasah=self.request.user.madrasah)  # pyright: ignore[reportAttributeAccessIssue]

        ReviewService.create_review(
            attempt=attempt,
            teacher=self.request.user,
            madrasah=self.request.user.madrasah,  # pyright: ignore[reportAttributeAccessIssue]
            **data,
        )


class ReviewDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = TeacherReviewSerializer
    permission_classes = [IsAuthenticated, CanReviewAttempts]

    def get_queryset(self):
        return TeacherReview.objects.filter(
            madrasah=self.request.user.madrasah,  # pyright: ignore[reportAttributeAccessIssue]
        ).select_related('teacher', 'attempt')

    def perform_update(self, serializer):
        review = self.get_object()
        ReviewService.update_review(review=review, **serializer.validated_data)


#  Assignments


class AssignmentListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, CanManageAssignments]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MissionAssignmentWriteSerializer
        return MissionAssignmentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':  # pyright: ignore[reportAttributeAccessIssue]
            return get_assignments(madrasah=user.madrasah, student=user)  # pyright: ignore[reportAttributeAccessIssue]
        return get_assignments(madrasah=user.madrasah, teacher=user)  # pyright: ignore[reportAttributeAccessIssue]

    def perform_create(self, serializer):
        data = serializer.validated_data
        mission = get_mission_by_id(mission_id=data['mission'], madrasah=self.request.user.madrasah)  # pyright: ignore[reportAttributeAccessIssue]

        target_student = None
        target_class = None

        if data.get('target_student'):
            from users.models import User
            try:
                target_student = User.objects.get(pk=data['target_student'], role='student')
            except User.DoesNotExist:
                pass

        if data.get('target_class'):
            from curriculum.models import SchoolClass
            try:
                target_class = SchoolClass.objects.get(pk=data['target_class'])
            except SchoolClass.DoesNotExist:
                pass

        AssignmentService.assign_mission(
            mission=mission,
            assigned_by=self.request.user,
            madrasah=self.request.user.madrasah,  # pyright: ignore[reportAttributeAccessIssue]
            target_student=target_student,
            target_class=target_class,
            due_date=data.get('due_date'),
            is_required=data.get('is_required', False),
            notes=data.get('notes', ''),
        )


class AssignmentDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = MissionAssignmentSerializer
    permission_classes = [IsAuthenticated, CanManageAssignments]

    def get_queryset(self):
        return get_assignments(madrasah=self.request.user.madrasah)  # pyright: ignore[reportAttributeAccessIssue]

    def perform_destroy(self, instance):
        AssignmentService.remove_assignment(assignment=instance)


class StudentProgressListView(generics.ListAPIView):
    serializer_class = StudentLevelProgressSerializer
    permission_classes = [IsAuthenticated, CanViewProgress]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':  # pyright: ignore[reportAttributeAccessIssue]
            return get_student_progress(student=user, madrasah=user.madrasah)  # pyright: ignore[reportAttributeAccessIssue]

        student_id = self.request.query_params.get('student')  # pyright: ignore[reportAttributeAccessIssue]
        if student_id:
            from users.models import User
            try:
                student = User.objects.get(pk=student_id, role='student')
                return get_student_progress(student=student, madrasah=user.madrasah)  # pyright: ignore[reportAttributeAccessIssue]
            except User.DoesNotExist:
                pass

        return StudentLevelProgress.objects.none()


class LevelProgressView(generics.RetrieveAPIView):
    serializer_class = StudentLevelProgressSerializer
    permission_classes = [IsAuthenticated, CanViewProgress]

    def get_object(self):
        level_id = self.kwargs['level_id']
        user = self.request.user

        if user.role == 'student':  # pyright: ignore[reportAttributeAccessIssue]
            progress = get_progress_for_level(student=user, level_id=level_id)
        else:
            student_id = self.request.query_params.get('student')  # pyright: ignore[reportAttributeAccessIssue]
            if not student_id:
                from rest_framework.exceptions import NotFound
                raise NotFound("student query parameter required")
            from users.models import User
            student = User.objects.get(pk=student_id, role='student')
            progress = get_progress_for_level(student=student, level_id=level_id)

        if not progress:
            from rest_framework.exceptions import NotFound
            raise NotFound("Progress not found")
        return progress


class StudentStreakView(generics.RetrieveAPIView):
    serializer_class = StudentStreakSerializer
    permission_classes = [IsAuthenticated, CanViewProgress]

    def get_object(self):
        user = self.request.user
        if user.role == 'student':  # pyright: ignore[reportAttributeAccessIssue]
            streak = get_student_streak(student=user, madrasah=user.madrasah)  # pyright: ignore[reportAttributeAccessIssue]
        else:
            student_id = self.request.query_params.get('student')  # pyright: ignore[reportAttributeAccessIssue]
            if not student_id:
                from rest_framework.exceptions import NotFound
                raise NotFound("student query parameter required")
            from users.models import User
            student = User.objects.get(pk=student_id, role='student')
            streak = get_student_streak(student=student, madrasah=user.madrasah)  # pyright: ignore[reportAttributeAccessIssue]

        if not streak:
            from rest_framework.exceptions import NotFound
            raise NotFound("Streak not found")
        return streak


#  Badges


class BadgeListView(generics.ListAPIView):
    serializer_class = BadgeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return get_badges(madrasah=self.request.user.madrasah)  # pyright: ignore[reportAttributeAccessIssue]


class BadgeCreateView(generics.CreateAPIView):
    serializer_class = BadgeWriteSerializer
    permission_classes = [IsAuthenticated, CanManageLevels]

    def perform_create(self, serializer):
        Badge.objects.create(
            madrasah=self.request.user.madrasah,  # pyright: ignore[reportAttributeAccessIssue]
            **serializer.validated_data,
        )


class MyBadgesView(generics.ListAPIView):
    serializer_class = StudentBadgeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':  # pyright: ignore[reportAttributeAccessIssue]
            return get_student_badges(student=user, madrasah=user.madrasah)  # pyright: ignore[reportAttributeAccessIssue]

        student_id = self.request.query_params.get('student')  # pyright: ignore[reportAttributeAccessIssue]
        if student_id:
            from users.models import User
            try:
                student = User.objects.get(pk=student_id, role='student')
                return get_student_badges(student=student, madrasah=user.madrasah)  # pyright: ignore[reportAttributeAccessIssue]
            except User.DoesNotExist:
                pass

        return StudentBadge.objects.none()


#  Analytics


class ClassAnalyticsView(APIView):
    permission_classes = [IsAuthenticated, CanViewAnalytics]

    def get(self, request):
        school_class_id = request.query_params.get('school_class')  # pyright: ignore[reportAttributeAccessIssue]
        level_id = request.query_params.get('level')  # pyright: ignore[reportAttributeAccessIssue]

        if not school_class_id:
            return Response(
                {'error': 'school_class query parameter is required'},
                status=status.HTTP_400_BAD_REQUEST)

        data = get_class_analytics(
            madrasah=request.user.madrasah,  # pyright: ignore[reportAttributeAccessIssue]
            school_class_id=school_class_id,
            level_id=level_id,
        )
        return Response(data)


class StudentAnalyticsView(APIView):
    permission_classes = [IsAuthenticated, CanViewAnalytics]

    def get(self, request, student_id):
        level_id = request.query_params.get('level')  # pyright: ignore[reportAttributeAccessIssue]

        from users.models import User
        try:
            student = User.objects.get(pk=student_id, role='student')
        except User.DoesNotExist:
            return Response(
                {'error': 'Student not found'},
                status=status.HTTP_404_NOT_FOUND)

        data = get_student_analytics(
            student=student,
            madrasah=request.user.madrasah,  # pyright: ignore[reportAttributeAccessIssue]
            level_id=level_id,
        )
        return Response(data)


class SchoolAnalyticsView(APIView):
    permission_classes = [IsAuthenticated, CanViewSchoolAnalytics]

    def get(self, request):
        level_id = request.query_params.get('level')  # pyright: ignore[reportAttributeAccessIssue]

        data = get_school_analytics(
            madrasah=request.user.madrasah,  # pyright: ignore[reportAttributeAccessIssue]
            level_id=level_id,
        )
        return Response(data)


#  Dashboards


class StudentDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != 'student':  # pyright: ignore[reportAttributeAccessIssue]
            return Response(
                {'error': 'Student role required'},
                status=status.HTTP_403_FORBIDDEN)

        data = get_student_dashboard_data(student=user, madrasah=user.madrasah)  # pyright: ignore[reportAttributeAccessIssue]

        progress_data = StudentLevelProgressSerializer(data['progress'], many=True).data
        level_data = SpeakingLevelSerializer(data['current_level']).data if data['current_level'] else None

        return Response({
            'current_level': level_data,
            'total_attempts': data['total_attempts'],
            'completed_missions': data['completed_missions'],
            'current_streak': data['current_streak'],
            'longest_streak': data['longest_streak'],
            'total_points': data['total_points'],
            'badge_count': data['badge_count'],
            'progress': progress_data,
        })


class TeacherDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role not in ('ustaadh', 'mudeer', 'idaarah'):  # pyright: ignore[reportAttributeAccessIssue]
            return Response(
                {'error': 'Teacher or admin role required'},
                status=status.HTTP_403_FORBIDDEN)

        data = get_teacher_dashboard_data(teacher=user, madrasah=user.madrasah)  # pyright: ignore[reportAttributeAccessIssue]

        return Response({
            'classes_taught': data['classes_taught'],
            'total_students': data['total_students'],
            'pending_reviews_count': data['pending_reviews_count'],
            'total_attempts': data['total_attempts'],
            'average_class_score': data['average_class_score'],
            'pending_reviews': SpeakingAttemptSerializer(
                data['pending_reviews'], many=True, context={'request': request}).data,
        })
