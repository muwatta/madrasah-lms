from __future__ import annotations

import logging
from django.utils.timezone import now

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from config.mixins import TenantAwareMixin
from config.permissions import IsMudeer

from .models import (
    SchemeOfWork, SchemeWeek, LearningObjective, LessonPlan,
    LessonResource, LessonDelivery, LessonReflection,
    Homework, HomeworkSubmission,
)
from .serializers import (
    SchemeOfWorkSerializer, SchemeOfWorkWriteSerializer,
    SchemeWeekSerializer, LearningObjectiveSerializer,
    LessonPlanSerializer, LessonPlanCreateSerializer, LessonPlanApprovalSerializer,
    LessonResourceSerializer, LessonDeliverySerializer,
    LessonReflectionSerializer, LessonAuditLogSerializer,
    HomeworkSerializer, HomeworkSubmissionSerializer,
    HomeworkSubmissionGradeSerializer, LessonAnalyticsSerializer,
)
from .services import (
    SchemeOfWorkService, LessonPlanService, HomeworkService, AnalyticsService,
    AuditService,
)
from .selectors import (
    get_schemes_for_teacher, get_schemes_for_madrasah, get_scheme_by_id,
    get_lesson_plans, get_plan_by_id, get_pending_approvals,
    get_teacher_subjects, get_teacher_classes,
    get_lesson_delivery, get_lesson_reflections,
    get_homework_list, get_homework_by_id,
    get_submissions_for_homework, get_pending_grading,
    get_analytics_snapshot,
)
from .permissions import (
    CanManageLessonPlans, CanApproveLessonPlans, CanDeliverLessons,
    CanManageHomework, CanGradeHomework, CanSubmitHomework,
    CanManageSchemes, CanViewLessonPlans,
)


def _get_client_ip(request):
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    return xff.split(',')[0].strip() if xff else request.META.get('REMOTE_ADDR')


# ──────────────────────────────────────────────────────
#  Scheme of Work
# ──────────────────────────────────────────────────────


class SchemeOfWorkListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, CanManageSchemes]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return SchemeOfWorkWriteSerializer
        return SchemeOfWorkSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role in ('mudeer', 'idaarah'):
            return get_schemes_for_madrasah(madrasah=user.madrasah)
        return get_schemes_for_teacher(teacher=user)

    def perform_create(self, serializer):
        data = serializer.validated_data
        weeks_data = data.pop('weeks', [])
        scheme = SchemeOfWorkService.create_scheme(
            madrasah=self.request.user.madrasah,
            teacher=self.request.user,
            term_id=data['term'],
            subject_id=data['subject'],
            school_class_id=data['school_class'],
            title=data['title'],
            description=data.get('description', ''),
            weeks_data=[dict(w) for w in weeks_data],
        )
        return scheme


class SchemeOfWorkDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SchemeOfWorkSerializer
    permission_classes = [IsAuthenticated, CanManageSchemes]

    def get_queryset(self):
        return get_schemes_for_madrasah(madrasah=self.request.user.madrasah)


class SchemeWeekUpdateView(APIView):
    permission_classes = [IsAuthenticated, CanManageSchemes]

    def patch(self, request, pk):
        try:
            week = SchemeWeek.objects.get(pk=pk, scheme__madrasah=request.user.madrasah)
        except SchemeWeek.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        if new_status:
            SchemeOfWorkService.update_week_status(week=week, status=new_status)
        return Response(SchemeWeekSerializer(week).data)


# ──────────────────────────────────────────────────────
#  Learning Objectives
# ──────────────────────────────────────────────────────


class LearningObjectiveListCreateView(generics.ListCreateAPIView):
    serializer_class = LearningObjectiveSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = LearningObjective.objects.all()
        subject_id = self.request.query_params.get('subject')
        if subject_id:
            qs = qs.filter(subject_id=subject_id)
        return qs


# ──────────────────────────────────────────────────────
#  Lesson Plan
# ──────────────────────────────────────────────────────


class LessonPlanListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return LessonPlanCreateSerializer
        return LessonPlanSerializer

    def get_queryset(self):
        user = self.request.user
        qs = get_lesson_plans(madrasah=user.madrasah)

        # Filter by role
        if user.role == 'ustaadh':
            qs = qs.filter(teacher=user)
        elif user.role in ('student', 'parent'):
            qs = qs.filter(status__in=('approved', 'scheduled', 'delivered', 'completed'))

        # Query params
        teacher_id = self.request.query_params.get('teacher')
        subject_id = self.request.query_params.get('subject')
        school_class_id = self.request.query_params.get('school_class')
        lesson_status = self.request.query_params.get('status')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')

        if teacher_id:
            qs = qs.filter(teacher_id=teacher_id)
        if subject_id:
            qs = qs.filter(subject_id=subject_id)
        if school_class_id:
            qs = qs.filter(school_class_id=school_class_id)
        if lesson_status:
            qs = qs.filter(status=lesson_status)
        if date_from:
            qs = qs.filter(lesson_date__gte=date_from)
        if date_to:
            qs = qs.filter(lesson_date__lte=date_to)

        return qs

    def perform_create(self, serializer):
        data = serializer.validated_data
        user = self.request.user
        plan = LessonPlanService.create_plan(
            madrasah=user.madrasah,
            teacher=user,
            subject_id=data['subject'],
            school_class_id=data['school_class'],
            title=data['title'],
            lesson_date=data['lesson_date'],
            duration_minutes=data.get('duration_minutes', 45),
            start_time=data.get('start_time'),
            end_time=data.get('end_time'),
            room=data.get('room', ''),
            class_arm_id=data.get('class_arm'),
            term_id=data.get('term'),
            scheme_week_id=data.get('scheme_week'),
            timetable_slot_id=data.get('timetable_slot'),
            learning_objectives=data.get('learning_objectives', []),
            success_criteria=data.get('success_criteria', []),
            keywords=data.get('keywords', []),
            prior_knowledge=data.get('prior_knowledge', ''),
            teaching_materials=data.get('teaching_materials', []),
            references=data.get('references', []),
            teaching_methods=data.get('teaching_methods', []),
            introduction=data.get('introduction', ''),
            lesson_development=data.get('lesson_development', ''),
            student_activities=data.get('student_activities', []),
            differentiation=data.get('differentiation', ''),
            assessment=data.get('assessment', ''),
            homework=data.get('homework', ''),
            resources=data.get('resources', ''),
            ai_generated=data.get('ai_generated', False),
            ai_prompt=data.get('ai_prompt', ''),
            attachments=data.get('attachments', []),
        )
        # Serialize the created plan
        self._created_plan = plan

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        output_serializer = LessonPlanSerializer(self._created_plan)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)


class LessonPlanDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = LessonPlanSerializer
    permission_classes = [IsAuthenticated, CanManageLessonPlans]

    def get_queryset(self):
        return get_lesson_plans(madrasah=self.request.user.madrasah)

    def perform_update(self, serializer):
        data = serializer.validated_data
        user = self.request.user
        plan = self.get_object()
        LessonPlanService.update_plan(
            plan=plan, actor=user, **data)


class LessonPlanApprovalView(APIView):
    permission_classes = [IsAuthenticated, CanApproveLessonPlans]

    def patch(self, request, pk):
        try:
            plan = LessonPlan.objects.get(pk=pk, madrasah=request.user.madrasah)
        except LessonPlan.DoesNotExist:
            return Response(
                {'error': 'Lesson plan not found'},
                status=status.HTTP_404_NOT_FOUND)

        serializer = LessonPlanApprovalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        target_status = serializer.validated_data['status']
        notes = serializer.validated_data.get('notes', '')

        try:
            LessonPlanService.transition_status(
                plan=plan,
                target_status=target_status,
                actor=request.user,
                reason=notes,
                ip_address=_get_client_ip(request),
            )
            return Response(LessonPlanSerializer(plan).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class LessonPlanSubmitView(APIView):
    permission_classes = [IsAuthenticated, CanManageLessonPlans]

    def post(self, request, pk):
        try:
            plan = LessonPlan.objects.get(pk=pk, madrasah=request.user.madrasah)
        except LessonPlan.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        if plan.teacher != request.user:
            return Response(
                {'error': 'Only the assigned teacher can submit.'},
                status=status.HTTP_403_FORBIDDEN)

        try:
            LessonPlanService.transition_status(
                plan=plan,
                target_status='submitted',
                actor=request.user,
                ip_address=_get_client_ip(request),
            )
            return Response(LessonPlanSerializer(plan).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ──────────────────────────────────────────────────────
#  Lesson Delivery
# ──────────────────────────────────────────────────────


class LessonDeliveryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, lesson_pk):
        try:
            plan = LessonPlan.objects.get(pk=lesson_pk, madrasah=request.user.madrasah)
        except LessonPlan.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        delivery = get_lesson_delivery(plan_id=lesson_pk)
        if not delivery:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(LessonDeliverySerializer(delivery).data)

    def post(self, request, lesson_pk):
        try:
            plan = LessonPlan.objects.get(pk=lesson_pk, madrasah=request.user.madrasah)
        except LessonPlan.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        serializer = LessonDeliverySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        delivery = LessonPlanService.record_delivery(
            lesson=plan,
            delivered_by=request.user,
            delivery_date=data['delivery_date'],
            delivery_status=data.get('delivery_status', 'completed'),
            students_present=data.get('students_present', 0),
            students_absent=data.get('students_absent', 0),
            total_students=data.get('total_students', 0),
            homework_given=data.get('homework_given', False),
            assessment_conducted=data.get('assessment_conducted', False),
            actual_duration_minutes=data.get('actual_duration_minutes'),
            challenges=data.get('challenges', ''),
            recommendations=data.get('recommendations', ''),
        )
        return Response(LessonDeliverySerializer(delivery).data, status=status.HTTP_201_CREATED)


# ──────────────────────────────────────────────────────
#  Lesson Reflection
# ──────────────────────────────────────────────────────


class LessonReflectionListCreateView(generics.ListCreateAPIView):
    serializer_class = LessonReflectionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        lesson_pk = self.kwargs.get('lesson_pk')
        if lesson_pk:
            return get_lesson_reflections(plan_id=lesson_pk)
        return LessonReflection.objects.filter(
            teacher=self.request.user
        ).select_related('lesson', 'teacher')

    def perform_create(self, serializer):
        lesson_pk = self.kwargs.get('lesson_pk')
        plan = LessonPlan.objects.get(pk=lesson_pk, madrasah=self.request.user.madrasah)
        LessonPlanService.add_reflection(
            lesson=plan,
            teacher=self.request.user,
            what_went_well=serializer.validated_data.get('what_went_well', ''),
            what_to_improve=serializer.validated_data.get('what_to_improve', ''),
            student_understanding=serializer.validated_data.get('student_understanding', ''),
            next_steps=serializer.validated_data.get('next_steps', ''),
            self_rating=serializer.validated_data.get('self_rating', 3),
        )


# ──────────────────────────────────────────────────────
#  Lesson Resource
# ──────────────────────────────────────────────────────


class LessonResourceListCreateView(generics.ListCreateAPIView):
    serializer_class = LessonResourceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        lesson_pk = self.kwargs.get('lesson_pk')
        return LessonResource.objects.filter(lesson_id=lesson_pk)

    def perform_create(self, serializer):
        lesson_pk = self.kwargs.get('lesson_pk')
        plan = LessonPlan.objects.get(pk=lesson_pk, madrasah=self.request.user.madrasah)
        LessonPlanService.add_resource(
            lesson=plan,
            resource_type=serializer.validated_data['resource_type'],
            title=serializer.validated_data['title'],
            url=serializer.validated_data.get('url', ''),
            file=serializer.validated_data.get('file'),
            description=serializer.validated_data.get('description', ''),
            order=serializer.validated_data.get('order', 0),
        )


# ──────────────────────────────────────────────────────
#  Homework (backward compatible)
# ──────────────────────────────────────────────────────


class HomeworkListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, CanManageHomework]

    def get_serializer_class(self):
        return HomeworkSerializer

    def get_queryset(self):
        user = self.request.user
        qs = get_homework_list(madrasah=user.madrasah)

        if user.role == 'ustaadh':
            qs = qs.filter(teacher=user)

        subject_id = self.request.query_params.get('subject')
        school_class_id = self.request.query_params.get('school_class')
        is_published = self.request.query_params.get('is_published')
        overdue_only = self.request.query_params.get('overdue') == 'true'

        if subject_id:
            qs = qs.filter(subject_id=subject_id)
        if school_class_id:
            qs = qs.filter(school_class_id=school_class_id)
        if is_published is not None:
            qs = qs.filter(is_published=is_published.lower() == 'true')
        if overdue_only:
            qs = qs.filter(due_date__lt=now(), is_published=True)

        return qs

    def perform_create(self, serializer):
        serializer.save(madrasah=self.request.user.madrasah, teacher=self.request.user)


class HomeworkDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = HomeworkSerializer
    permission_classes = [IsAuthenticated, CanManageHomework]

    def get_queryset(self):
        return get_homework_list(madrasah=self.request.user.madrasah)


class HomeworkSubmissionListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return HomeworkSubmissionSerializer

    def get_queryset(self):
        homework_pk = self.kwargs.get('homework_pk')
        return get_submissions_for_homework(
            homework_id=homework_pk, madrasah=self.request.user.madrasah)

    def perform_create(self, serializer):
        homework_pk = self.kwargs.get('homework_pk')
        hw = Homework.objects.get(pk=homework_pk, madrasah=self.request.user.madrasah)

        HomeworkService.submit_homework(
            homework=hw,
            student=self.request.user,
            madrasah=self.request.user.madrasah,
            content=serializer.validated_data.get('content', ''),
            file=serializer.validated_data.get('file'),
            attachments=serializer.validated_data.get('attachments', []),
        )


class PendingGradingView(generics.ListAPIView):
    serializer_class = HomeworkSubmissionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return get_pending_grading(madrasah=self.request.user.madrasah)


class HomeworkSubmissionGradeView(APIView):
    permission_classes = [IsAuthenticated, CanGradeHomework]

    def patch(self, request, pk):
        try:
            submission = HomeworkSubmission.objects.get(pk=pk, madrasah=request.user.madrasah)
        except HomeworkSubmission.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        serializer = HomeworkSubmissionGradeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            HomeworkService.grade_submission(
                submission=submission,
                score=serializer.validated_data['score'],
                feedback=serializer.validated_data.get('feedback', ''),
                graded_by=request.user,
            )
            return Response(HomeworkSubmissionSerializer(submission).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ──────────────────────────────────────────────────────
#  Analytics
# ──────────────────────────────────────────────────────


class LessonAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        subject_id = request.query_params.get('subject')
        school_class_id = request.query_params.get('school_class')
        term_id = request.query_params.get('term')

        if not all([subject_id, school_class_id, term_id]):
            return Response(
                {'error': 'subject, school_class, and term are required.'},
                status=status.HTTP_400_BAD_REQUEST)

        snapshot = AnalyticsService.compute_analytics(
            teacher=user,
            subject_id=subject_id,
            school_class_id=school_class_id,
            term_id=term_id,
        )
        return Response(LessonAnalyticsSerializer(snapshot).data)


# ──────────────────────────────────────────────────────
#  Audit Log
# ──────────────────────────────────────────────────────


class LessonAuditLogView(generics.ListAPIView):
    serializer_class = LessonAuditLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        from .selectors import get_audit_logs
        model_name = self.request.query_params.get('model_name')
        object_id = self.request.query_params.get('object_id')
        return get_audit_logs(
            madrasah=self.request.user.madrasah,
            model_name=model_name,
            object_id=object_id,
        )


# ──────────────────────────────────────────────────────
#  Teacher Classes (backward compatible)
# ──────────────────────────────────────────────────────


class TeacherClassesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != 'ustaadh':
            return Response(
                {'error': 'Only teachers can use this endpoint'},
                status=status.HTTP_403_FORBIDDEN)

        classes = get_teacher_classes(teacher=user)
        result = [
            {
                'school_class__id': c[0],
                'school_class__name_ar': c[1],
                'school_class__name_en': c[2],
            }
            for c in classes
        ]
        return Response(result)


class TeacherSubjectsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != 'ustaadh':
            return Response(
                {'error': 'Only teachers can use this endpoint'},
                status=status.HTTP_403_FORBIDDEN)

        subjects = get_teacher_subjects(teacher=user)
        result = [
            {
                'subject__id': s[0],
                'subject__name_ar': s[1],
                'subject__name_en': s[2],
            }
            for s in subjects
        ]
        return Response(result)
