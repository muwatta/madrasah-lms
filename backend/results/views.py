from rest_framework import viewsets, generics, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.shortcuts import get_object_or_404

from config.mixins import TenantAwareMixin
from .models import (
    GradeScale, GradeScaleBand, AssessmentBlueprint, BlueprintComponent,
    Assessment, AssessmentScore, SubjectResult, TermResult, AnnualResult,
    StudentRank, ResultPublication, ResultApproval, ReportCard,
    ResultAuditLog,
)
from .serializers import (
    GradeScaleSerializer, GradeScaleBandSerializer,
    AssessmentBlueprintSerializer, BlueprintComponentSerializer,
    AssessmentSerializer, AssessmentScoreSerializer,
    SubjectResultSerializer, SubjectResultDetailSerializer,
    TermResultSerializer, AnnualResultSerializer,
    StudentRankSerializer, ResultPublicationSerializer,
    ReportCardSerializer, ResultAuditLogSerializer,
    ResultApprovalSerializer,
    BulkScoreUploadSerializer,
    ExamSerializer, ExamResultSerializer,
    ResultTemplateSerializer, ResultTemplateItemSerializer,
    ResultComponentSerializer, StudentResultSerializer,
    BulkScoreInputSerializer,
    SessionSerializer, TermSerializer,
)
from .services import (
    ScoringService, RankingService, ApprovalService,
    TermAggregationService, ReportCardService, AuditService,
)
from .selectors import (
    get_student_subject_results, get_student_term_result,
    get_subject_results_for_term, get_class_results_for_term,
    get_pending_approvals, get_teacher_subjects, get_teacher_classes,
    get_publication_status, get_report_card,
)
from .validators import (
    validate_blueprint_weights_total,
    validate_results_complete_before_publish,
)
from .permissions import (
    IsTeacher, IsAcademicOfficer, IsMudeer, IsStudent, IsParent,
    CanEnterScores, CanApproveResults, CanPublishResults,
    CanViewStudentResult, CanManageGradeScale, CanManageBlueprints,
    CanGenerateReportCard,
)
from academic.models import Session, Term
from curriculum.models import Subject, SchoolClass
from users.models import User


# ── 1. GradeScale ─────────────────────────────────────


class GradeScaleViewSet(TenantAwareMixin, viewsets.ModelViewSet):
    serializer_class = GradeScaleSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), CanManageGradeScale()]

    def get_queryset(self):
        return (
            GradeScale.objects
            .filter(madrasah=self.request.user.madrasah)
            .prefetch_related('bands')
            .order_by('-is_default', 'name')
        )

    def perform_create(self, serializer):
        serializer.save(madrasah=self.request.user.madrasah)

    @action(detail=False, methods=['get'], url_path='default')
    def default(self, request):
        gs = self.get_queryset().filter(is_default=True).first()
        if gs is None:
            return Response(
                {'detail': 'No default grade scale configured.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(GradeScaleSerializer(gs).data)


# ── 2. AssessmentBlueprint ────────────────────────────


class AssessmentBlueprintViewSet(TenantAwareMixin, viewsets.ModelViewSet):
    serializer_class = AssessmentBlueprintSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), CanManageBlueprints()]

    def get_queryset(self):
        return (
            AssessmentBlueprint.objects
            .filter(madrasah=self.request.user.madrasah)
            .prefetch_related('components')
            .select_related('school_class', 'created_by')
            .order_by('-is_active', 'name')
        )

    def perform_create(self, serializer):
        serializer.save(
            madrasah=self.request.user.madrasah,
            created_by=self.request.user,
        )

    @action(detail=True, methods=['post'], url_path='validate-weights')
    def validate_weights(self, request, pk=None):
        blueprint = self.get_object()
        try:
            validate_blueprint_weights_total(blueprint)
        except ValueError as exc:
            return Response(
                {'detail': str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({'detail': 'Weights are valid.', 'total': blueprint.total_weight})


class BlueprintComponentViewSet(TenantAwareMixin, viewsets.ModelViewSet):
    serializer_class = BlueprintComponentSerializer

    def get_permissions(self):
        return [permissions.IsAuthenticated(), CanManageBlueprints()]

    def get_queryset(self):
        qs = BlueprintComponent.objects.filter(
            blueprint__madrasah=self.request.user.madrasah,
        )
        blueprint_id = self.request.query_params.get('blueprint')
        if blueprint_id:
            qs = qs.filter(blueprint_id=blueprint_id)
        return qs.select_related('blueprint').order_by('order', 'name')

    def perform_create(self, serializer):
        serializer.save()


# ── 3. Assessment ─────────────────────────────────────


class AssessmentViewSet(TenantAwareMixin, viewsets.ModelViewSet):
    serializer_class = AssessmentSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve', 'scores'):
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsMudeer()]

    def get_queryset(self):
        qs = (
            Assessment.objects
            .filter(madrasah=self.request.user.madrasah)
            .select_related('subject', 'term', 'school_class', 'blueprint_component', 'created_by')
        )
        subject_id = self.request.query_params.get('subject')
        term_id = self.request.query_params.get('term')
        school_class_id = self.request.query_params.get('school_class')
        if subject_id:
            qs = qs.filter(subject_id=subject_id)
        if term_id:
            qs = qs.filter(term_id=term_id)
        if school_class_id:
            qs = qs.filter(school_class_id=school_class_id)
        return qs.order_by('subject', 'term', 'order', 'name')

    def perform_create(self, serializer):
        serializer.save(
            madrasah=self.request.user.madrasah,
            created_by=self.request.user,
        )

    @action(detail=True, methods=['get'], url_path='scores')
    def scores(self, request, pk=None):
        assessment = self.get_object()
        scores = (
            assessment.scores
            .select_related('student', 'entered_by')
            .order_by('student__last_name', 'student__first_name')
        )
        serializer = AssessmentScoreSerializer(scores, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='generate')
    def generate(self, request):
        blueprint_id = request.data.get('blueprint')
        subject_id = request.data.get('subject')
        term_id = request.data.get('term')

        if not all([blueprint_id, subject_id, term_id]):
            return Response(
                {'detail': 'blueprint, subject, and term are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        blueprint = get_object_or_404(
            AssessmentBlueprint,
            pk=blueprint_id,
            madrasah=request.user.madrasah,
        )
        subject = get_object_or_404(Subject, pk=subject_id, madrasah=request.user.madrasah)
        term = get_object_or_404(Term, pk=term_id, madrasah=request.user.madrasah)

        try:
            created = ScoringService.generate_assessments_from_blueprint(
                blueprint=blueprint,
                subject=subject,
                term=term,
                actor=request.user,
            )
        except ValueError as exc:
            return Response(
                {'detail': str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            AssessmentSerializer(created, many=True).data,
            status=status.HTTP_201_CREATED,
        )


# ── 4. AssessmentScore ────────────────────────────────


class AssessmentScoreViewSet(TenantAwareMixin, viewsets.ModelViewSet):
    serializer_class = AssessmentScoreSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), CanEnterScores()]

    def get_queryset(self):
        qs = (
            AssessmentScore.objects
            .filter(assessment__madrasah=self.request.user.madrasah)
            .select_related('assessment', 'student', 'entered_by')
        )
        assessment_id = self.request.query_params.get('assessment')
        student_id = self.request.query_params.get('student')
        if assessment_id:
            qs = qs.filter(assessment_id=assessment_id)
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs.order_by('assessment', 'student__last_name')

    def perform_create(self, serializer):
        score_obj = serializer.save(entered_by=self.request.user)
        assessment = score_obj.assessment
        ScoringService.recalculate_subject_result(
            student=score_obj.student,
            subject=assessment.subject,
            term=assessment.term,
            school_class=assessment.school_class,
            actor=self.request.user,
        )

    def perform_update(self, serializer):
        score_obj = serializer.save(entered_by=self.request.user)
        assessment = score_obj.assessment
        ScoringService.recalculate_subject_result(
            student=score_obj.student,
            subject=assessment.subject,
            term=assessment.term,
            school_class=assessment.school_class,
            actor=self.request.user,
        )


# ── 5. SubjectResult ──────────────────────────────────


class SubjectResultViewSet(TenantAwareMixin, viewsets.ModelViewSet):
    serializer_class = SubjectResultSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [CanViewStudentResult()]
        return [CanApproveResults()]

    def get_queryset(self):
        qs = (
            SubjectResult.objects
            .filter(school_class__madrasah=self.request.user.madrasah)
            .select_related('student', 'subject', 'term', 'school_class', 'submitted_by')
        )
        user = self.request.user
        role = getattr(user, 'role', None)

        if role == 'student':
            qs = qs.filter(student=user, status='published')
        elif role == 'parent':
            from users.models import StudentParent
            child_ids = StudentParent.objects.filter(
                parent=user,
            ).values_list('student_id', flat=True)
            qs = qs.filter(student_id__in=child_ids, status='published')
        elif role == 'ustaadh':
            from curriculum.models import Enrollment
            subject_class_pairs = Enrollment.objects.filter(
                ustaadh=user,
            ).values_list('subject_id', 'school_class_id').distinct()
            from django.db.models import Q
            q = Q()
            for sid, cid in subject_class_pairs:
                q |= Q(subject_id=sid, school_class_id=cid)
            if q:
                qs = qs.filter(q)
            else:
                qs = qs.none()

        term_id = self.request.query_params.get('term')
        subject_id = self.request.query_params.get('subject')
        school_class_id = self.request.query_params.get('school_class')
        result_status = self.request.query_params.get('status')
        student_id = self.request.query_params.get('student')
        if term_id:
            qs = qs.filter(term_id=term_id)
        if subject_id:
            qs = qs.filter(subject_id=subject_id)
        if school_class_id:
            qs = qs.filter(school_class_id=school_class_id)
        if result_status:
            qs = qs.filter(status=result_status)
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs.order_by('term', 'subject', 'student')

    def _transition_action(self, request, pk, new_status, comment=''):
        sr = self.get_object()
        try:
            ApprovalService.transition_status(
                subject_result=sr,
                new_status=new_status,
                actor=request.user,
                comment=comment,
            )
        except ValueError as exc:
            return Response(
                {'detail': str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(SubjectResultDetailSerializer(sr).data)

    @action(detail=True, methods=['post'], url_path='submit')
    def submit(self, request, pk=None):
        return self._transition_action(request, pk, 'submitted')

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        comment = request.data.get('comment', '')
        return self._transition_action(request, pk, 'approved', comment=comment)

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        comment = request.data.get('comment', '')
        return self._transition_action(request, pk, 'rejected', comment=comment)

    @action(detail=True, methods=['post'], url_path='publish')
    def publish(self, request, pk=None):
        return self._transition_action(request, pk, 'published')

    @action(detail=True, methods=['post'], url_path='reopen')
    def reopen(self, request, pk=None):
        comment = request.data.get('comment', '')
        return self._transition_action(request, pk, 'submitted', comment=comment)


# ── 6. TermResult ─────────────────────────────────────


class TermResultViewSet(TenantAwareMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = TermResultSerializer
    permission_classes = [CanViewStudentResult]

    def get_queryset(self):
        qs = (
            TermResult.objects
            .filter(school_class__madrasah=self.request.user.madrasah)
            .select_related('student', 'term', 'school_class')
        )
        user = self.request.user
        role = getattr(user, 'role', None)

        if role == 'student':
            qs = qs.filter(student=user)
        elif role == 'parent':
            from users.models import StudentParent
            child_ids = StudentParent.objects.filter(
                parent=user,
            ).values_list('student_id', flat=True)
            qs = qs.filter(student_id__in=child_ids)

        term_id = self.request.query_params.get('term')
        school_class_id = self.request.query_params.get('school_class')
        student_id = self.request.query_params.get('student')
        if term_id:
            qs = qs.filter(term_id=term_id)
        if school_class_id:
            qs = qs.filter(school_class_id=school_class_id)
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs.order_by('term', 'position', 'student')

    @action(detail=False, methods=['post'], url_path='recalculate')
    def recalculate(self, request):
        if getattr(request.user, 'role', None) != 'mudeer':
            return Response(
                {'detail': 'Only mudeer may recalculate term results.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        term_id = request.data.get('term')
        school_class_id = request.data.get('school_class')
        if not all([term_id, school_class_id]):
            return Response(
                {'detail': 'term and school_class are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        count = TermAggregationService.aggregate_all_terms(
            term_id=int(term_id),
            school_class_id=int(school_class_id),
        )
        return Response({'detail': f'Recalculated {count} term result(s).', 'count': count})

    @action(detail=True, methods=['get'], url_path='report-card')
    def report_card(self, request, pk=None):
        term_result = self.get_object()
        rc = get_report_card(
            student_id=term_result.student_id,
            term_id=term_result.term_id,
        )
        if rc is None:
            return Response(
                {'detail': 'No report card generated for this term.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(ReportCardSerializer(rc).data)


# ── 7. AnnualResult ───────────────────────────────────


class AnnualResultViewSet(TenantAwareMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = AnnualResultSerializer
    permission_classes = [CanViewStudentResult]

    def get_queryset(self):
        qs = (
            AnnualResult.objects
            .filter(school_class__madrasah=self.request.user.madrasah)
            .select_related('student', 'session', 'school_class')
        )
        user = self.request.user
        role = getattr(user, 'role', None)

        if role == 'student':
            qs = qs.filter(student=user)
        elif role == 'parent':
            from users.models import StudentParent
            child_ids = StudentParent.objects.filter(
                parent=user,
            ).values_list('student_id', flat=True)
            qs = qs.filter(student_id__in=child_ids)

        session_id = self.request.query_params.get('session')
        school_class_id = self.request.query_params.get('school_class')
        student_id = self.request.query_params.get('student')
        if session_id:
            qs = qs.filter(session_id=session_id)
        if school_class_id:
            qs = qs.filter(school_class_id=school_class_id)
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs.order_by('session', 'position', 'student')

    @action(detail=False, methods=['post'], url_path='recalculate')
    def recalculate(self, request):
        if getattr(request.user, 'role', None) != 'mudeer':
            return Response(
                {'detail': 'Only mudeer may recalculate annual results.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        session_id = request.data.get('session')
        school_class_id = request.data.get('school_class')
        if not all([session_id, school_class_id]):
            return Response(
                {'detail': 'session and school_class are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        session = get_object_or_404(Session, pk=session_id, madrasah=request.user.madrasah)
        school_class = get_object_or_404(SchoolClass, pk=school_class_id, madrasah=request.user.madrasah)

        student_ids = (
            TermResult.objects
            .filter(term__session=session, school_class=school_class)
            .values_list('student_id', flat=True)
            .distinct()
        )
        count = 0
        for student_id in student_ids:
            student = User.objects.get(pk=student_id)
            TermAggregationService.aggregate_annual(student, session, school_class)
            count += 1
        return Response({'detail': f'Recalculated {count} annual result(s).', 'count': count})


# ── 8. StudentRank ────────────────────────────────────


class StudentRankViewSet(TenantAwareMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = StudentRankSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = (
            StudentRank.objects
            .filter(school_class__madrasah=self.request.user.madrasah)
            .select_related('student', 'term', 'subject', 'school_class')
        )
        term_id = self.request.query_params.get('term')
        school_class_id = self.request.query_params.get('school_class')
        rank_type = self.request.query_params.get('rank_type')
        subject_id = self.request.query_params.get('subject')
        student_id = self.request.query_params.get('student')
        if term_id:
            qs = qs.filter(term_id=term_id)
        if school_class_id:
            qs = qs.filter(school_class_id=school_class_id)
        if rank_type:
            qs = qs.filter(rank_type=rank_type)
        if subject_id:
            qs = qs.filter(subject_id=subject_id)
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs.order_by('rank_type', 'rank', 'student')

    @action(detail=False, methods=['post'], url_path='recalculate')
    def recalculate(self, request):
        if getattr(request.user, 'role', None) != 'mudeer':
            return Response(
                {'detail': 'Only mudeer may recalculate ranks.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        term_id = request.data.get('term')
        school_class_id = request.data.get('school_class')
        if not all([term_id, school_class_id]):
            return Response(
                {'detail': 'term and school_class are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        term = get_object_or_404(Term, pk=term_id, madrasah=request.user.madrasah)
        school_class = get_object_or_404(SchoolClass, pk=school_class_id, madrasah=request.user.madrasah)

        subject_count = RankingService.calculate_subject_ranks(term, school_class)
        class_count = RankingService.calculate_class_ranks(term, school_class)

        return Response({
            'detail': f'Recalculated {subject_count} subject rank(s) and {class_count} class rank(s).',
            'subject_ranks': subject_count,
            'class_ranks': class_count,
        })


# ── 9. ResultPublication ──────────────────────────────


class ResultPublicationViewSet(TenantAwareMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = ResultPublicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = (
            ResultPublication.objects
            .filter(school_class__madrasah=self.request.user.madrasah)
            .select_related('session', 'term', 'school_class', 'published_by')
        )
        term_id = self.request.query_params.get('term')
        school_class_id = self.request.query_params.get('school_class')
        if term_id:
            qs = qs.filter(term_id=term_id)
        if school_class_id:
            qs = qs.filter(school_class_id=school_class_id)
        return qs.order_by('-published_at')

    @action(detail=False, methods=['post'], url_path='publish')
    def publish(self, request):
        if getattr(request.user, 'role', None) != 'mudeer':
            return Response(
                {'detail': 'Only mudeer may publish results.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        term_id = request.data.get('term')
        school_class_id = request.data.get('school_class')
        if not all([term_id, school_class_id]):
            return Response(
                {'detail': 'term and school_class are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            validate_results_complete_before_publish(
                int(term_id), int(school_class_id),
            )
        except ValueError as exc:
            return Response(
                {'detail': str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        count = ApprovalService.bulk_publish(
            term_id=int(term_id),
            school_class_id=int(school_class_id),
            actor=request.user,
        )
        return Response({'detail': f'Published {count} result(s).', 'count': count})

    @action(detail=False, methods=['post'], url_path='unpublish')
    def unpublish(self, request):
        if getattr(request.user, 'role', None) != 'mudeer':
            return Response(
                {'detail': 'Only mudeer may unpublish results.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        term_id = request.data.get('term')
        school_class_id = request.data.get('school_class')
        if not all([term_id, school_class_id]):
            return Response(
                {'detail': 'term and school_class are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        published_ids = list(
            SubjectResult.objects
            .filter(
                term_id=int(term_id),
                school_class_id=int(school_class_id),
                status='published',
            )
            .values_list('id', flat=True)
        )
        count = ApprovalService.bulk_reopen(
            subject_result_ids=published_ids,
            actor=request.user,
            reason='Unpublished by administrator.',
        )
        if count > 0:
            ResultPublication.objects.create(
                session=Term.objects.get(pk=term_id).session,
                term_id=int(term_id),
                school_class_id=int(school_class_id),
                published_by=request.user,
                status='unpublished',
            )
        return Response({'detail': f'Unpublished {count} result(s).', 'count': count})


# ── 10. ReportCard ────────────────────────────────────


class ReportCardViewSet(TenantAwareMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = ReportCardSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [CanViewStudentResult()]
        return [CanGenerateReportCard()]

    def get_queryset(self):
        qs = (
            ReportCard.objects
            .filter(school_class__madrasah=self.request.user.madrasah)
            .select_related('student', 'term', 'session', 'school_class', 'term_result', 'generated_by')
        )
        user = self.request.user
        role = getattr(user, 'role', None)

        if role == 'student':
            qs = qs.filter(student=user)
        elif role == 'parent':
            from users.models import StudentParent
            child_ids = StudentParent.objects.filter(
                parent=user,
            ).values_list('student_id', flat=True)
            qs = qs.filter(student_id__in=child_ids)

        term_id = self.request.query_params.get('term')
        school_class_id = self.request.query_params.get('school_class')
        student_id = self.request.query_params.get('student')
        if term_id:
            qs = qs.filter(term_id=term_id)
        if school_class_id:
            qs = qs.filter(school_class_id=school_class_id)
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs.order_by('-generated_at')

    @action(detail=False, methods=['post'], url_path='generate')
    def generate(self, request):
        student_id = request.data.get('student')
        term_id = request.data.get('term')
        if not all([student_id, term_id]):
            return Response(
                {'detail': 'student and term are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        student = get_object_or_404(User, pk=student_id, madrasah=request.user.madrasah)
        term = get_object_or_404(Term, pk=term_id, madrasah=request.user.madrasah)
        try:
            rc = ReportCardService.generate_report_card(
                student=student,
                term=term,
                actor=request.user,
            )
        except ValueError as exc:
            return Response(
                {'detail': str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(ReportCardSerializer(rc).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='bulk-generate')
    def bulk_generate(self, request):
        term_id = request.data.get('term')
        school_class_id = request.data.get('school_class')
        if not all([term_id, school_class_id]):
            return Response(
                {'detail': 'term and school_class are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            count = ReportCardService.generate_bulk_report_cards(
                term_id=int(term_id),
                school_class_id=int(school_class_id),
                actor=request.user,
            )
        except ValueError as exc:
            return Response(
                {'detail': str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({'detail': f'Generated {count} report card(s).', 'count': count})


# ── 11. ResultAuditLog ────────────────────────────────


class ResultAuditLogViewSet(TenantAwareMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = ResultAuditLogSerializer
    permission_classes = [IsMudeer]

    def get_queryset(self):
        qs = ResultAuditLog.objects.filter(
            actor__madrasah=self.request.user.madrasah,
        ).select_related('actor')
        model_name = self.request.query_params.get('model_name')
        object_id = self.request.query_params.get('object_id')
        actor_id = self.request.query_params.get('actor')
        if model_name:
            qs = qs.filter(model_name=model_name)
        if object_id:
            qs = qs.filter(object_id=str(object_id))
        if actor_id:
            qs = qs.filter(actor_id=actor_id)
        return qs.order_by('-created_at')


# ── 12. BulkScoreUpload ───────────────────────────────


class BulkScoreUploadView(TenantAwareMixin, APIView):
    permission_classes = [permissions.IsAuthenticated, CanEnterScores]

    def post(self, request):
        serializer = BulkScoreUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        assessment_id = serializer.validated_data['assessment']
        scores_data = serializer.validated_data['scores']

        assessment = get_object_or_404(
            Assessment,
            pk=assessment_id,
            madrasah=request.user.madrasah,
        )

        try:
            created = ScoringService.bulk_save_scores(
                assessment=assessment,
                scores_data=scores_data,
                actor=request.user,
            )
        except ValueError as exc:
            return Response(
                {'detail': str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                'detail': f'Saved {len(created)} score(s).',
                'count': len(created),
            },
            status=status.HTTP_201_CREATED,
        )


# ──────────────────────────────────────────────────────
#  Legacy backward-compatible views
#  Kept for existing frontend imports from result_views.
# ──────────────────────────────────────────────────────


class TeacherSubjectsView(TenantAwareMixin, generics.ListAPIView):
    serializer_class = None

    def list(self, request, *args, **kwargs):
        data = get_teacher_subjects(request.user.pk)
        remapped = [
            {
                'id': item['subject_id'],
                'name_ar': item['subject__name_ar'],
                'name_en': item['subject__name_en'],
                'code': item['subject__code'],
            }
            for item in data
        ]
        return Response(remapped)


class TeacherTermsView(TenantAwareMixin, generics.ListAPIView):
    serializer_class = TermSerializer

    def get_queryset(self):
        return Term.objects.filter(
            madrasah=self.request.user.madrasah,
            session__is_current=True,
        ).select_related('session').order_by('term_number')


class MyTermResultsView(TenantAwareMixin, generics.ListAPIView):
    serializer_class = SubjectResultSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SubjectResult.objects.filter(
            student=self.request.user,
            status='published',
        ).select_related(
            'subject', 'term', 'school_class',
        ).order_by('term__term_number', 'subject__name_ar')


class ChildTermResultsView(TenantAwareMixin, generics.ListAPIView):
    serializer_class = SubjectResultSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        child_id = self.request.query_params.get('student')
        if not child_id:
            return SubjectResult.objects.none()
        from users.models import StudentParent
        if not StudentParent.objects.filter(
            parent=self.request.user,
            student_id=child_id,
        ).exists():
            return SubjectResult.objects.none()
        return SubjectResult.objects.filter(
            student_id=child_id,
            status='published',
        ).select_related(
            'subject', 'term', 'school_class',
        ).order_by('term__term_number', 'subject__name_ar')
