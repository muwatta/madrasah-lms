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

from .models import (
    SpeakingLevel, MissionCategory, Mission, SpeakingAttempt,
    AIAnalysis, TeacherReview, MissionAssignment,
    StudentLevelProgress, StudentStreak, Badge, StudentBadge,
    DialogueSession, DialogueTurn, DailyGoal, LeaderboardEntry,
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
    DialogueSessionSerializer, DialogueTurnSerializer,
    DialogueStartSerializer, DialogueTurnWriteSerializer,
    DailyGoalSerializer, LeaderboardEntrySerializer,
)
from .services import (
    MissionService, AttemptService, ReviewService, AssignmentService,
    ProgressService, StreakService, BadgeService,
    DialogueService, DailyGoalService, LeaderboardService,
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
    get_dialogue_sessions, get_dialogue_session_by_uuid, get_dialogue_turns,
    get_daily_goal, get_leaderboard, get_score_trends,
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
        return get_levels(madrasah=self.request.user.madrasah)  

    def perform_create(self, serializer):
        data = serializer.validated_data
        SpeakingLevel.objects.create(
            madrasah=self.request.user.madrasah,  
            **data,
        )


class SpeakingLevelDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SpeakingLevelSerializer

    def get_permissions(self):
        if self.request.method in ('PUT', 'PATCH', 'DELETE'):
            return [IsAuthenticated(), CanManageLevels()]
        return [IsAuthenticated()]

    def get_queryset(self):
        return get_levels(madrasah=self.request.user.madrasah, active_only=False)  

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
        return get_categories(madrasah=self.request.user.madrasah)  

    def perform_create(self, serializer):
        data = serializer.validated_data
        MissionCategory.objects.create(
            madrasah=self.request.user.madrasah,  
            **data,
        )


class MissionCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MissionCategorySerializer

    def get_permissions(self):
        if self.request.method in ('PUT', 'PATCH', 'DELETE'):
            return [IsAuthenticated(), CanManageCategories()]
        return [IsAuthenticated()]

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
        qs = get_missions(madrasah=self.request.user.madrasah)  

        level_id = self.request.query_params.get('level')  
        category_id = self.request.query_params.get('category')  
        difficulty = self.request.query_params.get('difficulty')  

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
        level = get_level_by_id(level_id=level_id, madrasah=self.request.user.madrasah)  
        category = None
        if category_id:
            category = get_category_by_id(category_id=category_id, madrasah=self.request.user.madrasah)  

        MissionService.create_mission(
            madrasah=self.request.user.madrasah,  
            level=level,
            category=category,
            created_by=self.request.user,
            **data,
        )


class MissionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MissionSerializer
    permission_classes = [IsAuthenticated, CanViewMissions]

    def get_queryset(self):
        return get_missions(madrasah=self.request.user.madrasah, active_only=False)  

    def perform_update(self, serializer):
        mission = self.get_object()
        data = serializer.validated_data

        if 'level' in data:
            from .selectors import get_level_by_id
            data['level'] = get_level_by_id(level_id=data['level'], madrasah=self.request.user.madrasah)  
        if 'category' in data:
            from .selectors import get_category_by_id
            if data['category']:
                data['category'] = get_category_by_id(category_id=data['category'], madrasah=self.request.user.madrasah)  

        MissionService.update_mission(mission=mission, **data)

    def perform_destroy(self, instance):
        MissionService.deactivate_mission(mission=instance)


class LevelMissionsView(generics.ListAPIView):
    """List missions for a specific level."""
    serializer_class = MissionSerializer
    permission_classes = [IsAuthenticated, CanViewMissions]

    def get_queryset(self):
        level_id = self.kwargs['level_id']
        return get_missions_for_level(level_id=level_id, madrasah=self.request.user.madrasah)  


#  Attempts


class AttemptListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return SpeakingAttemptWriteSerializer
        return SpeakingAttemptSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':  
            return get_attempts_for_student(student=user, madrasah=user.madrasah)  
        return SpeakingAttempt.objects.filter(
            madrasah=user.madrasah,  
        ).select_related('student', 'mission', 'mission__level', 'mission__category')

    def perform_create(self, serializer):
        data = serializer.validated_data
        mission = get_mission_by_id(mission_id=data['mission'], madrasah=self.request.user.madrasah)  

        attempt = AttemptService.submit_attempt(
            student=self.request.user,
            mission=mission,
            audio_file=data['audio'],
            madrasah=self.request.user.madrasah,  
            notes=data.get('notes', ''),
            time_spent_seconds=data.get('time_spent_seconds'),
        )

        try:
            from .tasks import process_speaking_attempt
            process_speaking_attempt.delay(attempt.id)  # pyright: ignore[reportAttributeAccessIssue]
        except Exception:
            logger.warning("Celery unavailable — attempt %s saved but not queued for AI processing", attempt.id)

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
        if user.role == 'student':  
            return get_attempts_for_student(student=user, madrasah=user.madrasah)  
        return SpeakingAttempt.objects.filter(
            madrasah=user.madrasah,  
        ).select_related('student', 'mission', 'mission__level', 'mission__category')


class AttemptRetryView(APIView):
    """Retry a mission (increment attempt number)."""
    permission_classes = [IsAuthenticated, CanSubmitAttempt]

    def post(self, request, pk):
        try:
            original = get_attempt_by_id(attempt_id=pk, madrasah=request.user.madrasah)  
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
            madrasah=request.user.madrasah,  
            notes=serializer.validated_data.get('notes', ''),
        )

        try:
            from .tasks import process_speaking_attempt
            process_speaking_attempt.delay(attempt.id)  # pyright: ignore[reportAttributeAccessIssue]
        except Exception:
            logger.warning("Celery unavailable — attempt %s saved but not queued", attempt.id)

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
            madrasah=self.request.user.madrasah,  
            teacher=self.request.user if self.request.user.role == 'ustaadh' else None,  
        )


class ReviewListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, CanReviewAttempts]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TeacherReviewWriteSerializer
        return TeacherReviewSerializer

    def get_queryset(self):
        attempt_id = self.request.query_params.get('attempt')  
        if attempt_id:
            return get_reviews_for_attempt(attempt_id=attempt_id)
        return TeacherReview.objects.filter(
            madrasah=self.request.user.madrasah,  
        ).select_related('teacher', 'attempt', 'attempt__student', 'attempt__mission')

    def perform_create(self, serializer):
        data = serializer.validated_data
        attempt = get_attempt_by_id(
            attempt_id=data.pop('attempt'), madrasah=self.request.user.madrasah)  

        ReviewService.create_review(
            attempt=attempt,
            teacher=self.request.user,
            madrasah=self.request.user.madrasah,  
            **data,
        )


class ReviewDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = TeacherReviewSerializer
    permission_classes = [IsAuthenticated, CanReviewAttempts]

    def get_queryset(self):
        return TeacherReview.objects.filter(
            madrasah=self.request.user.madrasah,  
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
        if user.role == 'student':  
            return get_assignments(madrasah=user.madrasah, student=user)  
        return get_assignments(madrasah=user.madrasah, teacher=user)  

    def perform_create(self, serializer):
        data = serializer.validated_data
        mission = get_mission_by_id(mission_id=data['mission'], madrasah=self.request.user.madrasah)  

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
            madrasah=self.request.user.madrasah,  
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
        return get_assignments(madrasah=self.request.user.madrasah)  

    def perform_destroy(self, instance):
        AssignmentService.remove_assignment(assignment=instance)


class StudentProgressListView(generics.ListAPIView):
    serializer_class = StudentLevelProgressSerializer
    permission_classes = [IsAuthenticated, CanViewProgress]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':  
            return get_student_progress(student=user, madrasah=user.madrasah)  

        student_id = self.request.query_params.get('student')  
        if student_id:
            from users.models import User
            try:
                student = User.objects.get(pk=student_id, role='student')
                return get_student_progress(student=student, madrasah=user.madrasah)  
            except User.DoesNotExist:
                pass

        return StudentLevelProgress.objects.none()


class LevelProgressView(generics.RetrieveAPIView):
    serializer_class = StudentLevelProgressSerializer
    permission_classes = [IsAuthenticated, CanViewProgress]

    def get_object(self):
        level_id = self.kwargs['level_id']
        user = self.request.user

        if user.role == 'student':  
            progress = get_progress_for_level(student=user, level_id=level_id)
        else:
            student_id = self.request.query_params.get('student')  
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
        if user.role == 'student':  
            streak = get_student_streak(student=user, madrasah=user.madrasah)  
        else:
            student_id = self.request.query_params.get('student')  
            if not student_id:
                from rest_framework.exceptions import NotFound
                raise NotFound("student query parameter required")
            from users.models import User
            student = User.objects.get(pk=student_id, role='student')
            streak = get_student_streak(student=student, madrasah=user.madrasah)  

        if not streak:
            from rest_framework.exceptions import NotFound
            raise NotFound("Streak not found")
        return streak


#  Badges


class BadgeListView(generics.ListAPIView):
    serializer_class = BadgeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return get_badges(madrasah=self.request.user.madrasah)  


class BadgeCreateView(generics.CreateAPIView):
    serializer_class = BadgeWriteSerializer
    permission_classes = [IsAuthenticated, CanManageLevels]

    def perform_create(self, serializer):
        Badge.objects.create(
            madrasah=self.request.user.madrasah,  
            **serializer.validated_data,
        )


class MyBadgesView(generics.ListAPIView):
    serializer_class = StudentBadgeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':  
            return get_student_badges(student=user, madrasah=user.madrasah)  

        student_id = self.request.query_params.get('student')  
        if student_id:
            from users.models import User
            try:
                student = User.objects.get(pk=student_id, role='student')
                return get_student_badges(student=student, madrasah=user.madrasah)  
            except User.DoesNotExist:
                pass

        return StudentBadge.objects.none()


#  Analytics


class ClassAnalyticsView(APIView):
    permission_classes = [IsAuthenticated, CanViewAnalytics]

    def get(self, request):
        school_class_id = request.query_params.get('school_class')  
        level_id = request.query_params.get('level')  

        if not school_class_id:
            return Response(
                {'error': 'school_class query parameter is required'},
                status=status.HTTP_400_BAD_REQUEST)

        data = get_class_analytics(
            madrasah=request.user.madrasah,  
            school_class_id=school_class_id,
            level_id=level_id,
        )
        return Response(data)


class StudentAnalyticsView(APIView):
    permission_classes = [IsAuthenticated, CanViewAnalytics]

    def get(self, request, student_id):
        level_id = request.query_params.get('level')  

        from users.models import User
        try:
            student = User.objects.get(pk=student_id, role='student')
        except User.DoesNotExist:
            return Response(
                {'error': 'Student not found'},
                status=status.HTTP_404_NOT_FOUND)

        data = get_student_analytics(
            student=student,
            madrasah=request.user.madrasah,  
            level_id=level_id,
        )
        return Response(data)


class SchoolAnalyticsView(APIView):
    permission_classes = [IsAuthenticated, CanViewSchoolAnalytics]

    def get(self, request):
        level_id = request.query_params.get('level')  

        data = get_school_analytics(
            madrasah=request.user.madrasah,  
            level_id=level_id,
        )
        return Response(data)


#  Dashboards


class StudentDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != 'student':  
            return Response(
                {'error': 'Student role required'},
                status=status.HTTP_403_FORBIDDEN)

        data = get_student_dashboard_data(student=user, madrasah=user.madrasah)  

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
        if user.role not in ('ustaadh', 'mudeer', 'idaarah'):  
            return Response(
                {'error': 'Teacher or admin role required'},
                status=status.HTTP_403_FORBIDDEN)

        data = get_teacher_dashboard_data(teacher=user, madrasah=user.madrasah)  

        return Response({
            'classes_taught': data['classes_taught'],
            'total_students': data['total_students'],
            'pending_reviews_count': data['pending_reviews_count'],
            'total_attempts': data['total_attempts'],
            'average_class_score': data['average_class_score'],
            'pending_reviews': SpeakingAttemptSerializer(
                data['pending_reviews'], many=True, context={'request': request}).data,
        })


# ═══════════════════════════════════════════════════════════════════════════
#  Phase 3: Dialogue
# ═══════════════════════════════════════════════════════════════════════════


class DialogueStartView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'student':
            return Response({'error': 'Student role required'}, status=403)
        ser = DialogueStartSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        mission = None
        if ser.validated_data.get('mission'):
            mission = Mission.objects.get(pk=ser.validated_data['mission'])

        session = DialogueService.start_session(
            student=request.user,
            madrasah=request.user.madrasah,
            topic=ser.validated_data['topic'],
            level_number=ser.validated_data['level_number'],
            mission=mission,
        )
        turns = DialogueTurnSerializer(session.turns.all(), many=True).data
        return Response(DialogueSessionSerializer(session).data | {'turns': turns}, status=201)


class DialogueSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, uuid):
        session = get_dialogue_session_by_uuid(session_uuid=uuid, student=request.user)
        turns = DialogueTurnSerializer(session.turns.all(), many=True).data
        return Response(DialogueSessionSerializer(session).data | {'turns': turns})


class DialogueTurnView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, uuid):
        session = get_dialogue_session_by_uuid(session_uuid=uuid, student=request.user)
        ser = DialogueTurnWriteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        result = DialogueService.submit_student_turn(
            session=session,
            text_ar=ser.validated_data['text_ar'],
        )
        return Response({
            'student_turn': DialogueTurnSerializer(result['student_turn']).data,
            'ai_turn': DialogueTurnSerializer(result['ai_turn']).data,
            'evaluation': {
                'pronunciation_score': result['evaluation'].pronunciation_score,
                'fluency_score': result['evaluation'].fluency_score,
                'vocabulary_score': result['evaluation'].vocabulary_score,
                'turn_score': result['evaluation'].turn_score,
                'feedback': result['evaluation'].feedback,
            },
        })


class DialogueCompleteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, uuid):
        session = get_dialogue_session_by_uuid(session_uuid=uuid, student=request.user)
        session = DialogueService.complete_session(session=session)
        return Response(DialogueSessionSerializer(session).data)


class DialogueListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sessions = get_dialogue_sessions(
            student=request.user, madrasah=request.user.madrasah,
        )
        return Response(DialogueSessionSerializer(sessions, many=True).data)


# ═══════════════════════════════════════════════════════════════════════════
#  Phase 3: Daily Goals
# ═══════════════════════════════════════════════════════════════════════════


class DailyGoalView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'student':
            return Response({'error': 'Student role required'}, status=403)
        goal = DailyGoalService.get_or_create_today(
            student=request.user, madrasah=request.user.madrasah,
        )
        return Response(DailyGoalSerializer(goal).data)

    def get_weekly(self, request):
        goals = DailyGoalService.get_weekly_goals(
            student=request.user, madrasah=request.user.madrasah,
        )
        return Response(DailyGoalSerializer(goals, many=True).data)


class DailyGoalWeeklyView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        goals = DailyGoalService.get_weekly_goals(
            student=request.user, madrasah=request.user.madrasah,
        )
        return Response(DailyGoalSerializer(goals, many=True).data)


# ═══════════════════════════════════════════════════════════════════════════
#  Phase 3: Leaderboard
# ═══════════════════════════════════════════════════════════════════════════


class LeaderboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        period = request.query_params.get('period', 'weekly')
        entries = get_leaderboard(madrasah=request.user.madrasah, period=period)
        return Response(LeaderboardEntrySerializer(entries, many=True).data)


class LeaderboardRefreshView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role not in ('ustaadh', 'mudeer', 'idaarah'):
            return Response({'error': 'Admin/teacher role required'}, status=403)
        period = request.data.get('period', 'weekly')
        LeaderboardService.update_leaderboard(madrasah=request.user.madrasah, period=period)
        return Response({'status': 'ok'})


# ═══════════════════════════════════════════════════════════════════════════
#  Phase 3: Score Trends
# ═══════════════════════════════════════════════════════════════════════════


class ScoreTrendsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id=None):
        from users.models import User
        sid = student_id or request.user.id
        student = User.objects.get(pk=sid)
        days = int(request.query_params.get('days', 30))
        trends = get_score_trends(student=student, madrasah=request.user.madrasah, days=days)
        data = list(trends)
        for d in data:
            d['date'] = str(d['date'])
            for k in ('avg_score', 'avg_pronunciation', 'avg_grammar', 'avg_fluency'):
                d[k] = round(float(d[k] or 0), 1)
        return Response(data)
