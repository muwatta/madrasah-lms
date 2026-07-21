from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils.timezone import now

from config.mixins import TenantAwareMixin
from .models import (
    ResultTemplate, ResultTemplateItem, ResultComponent,
    StudentResult, TermResult, ExamResult
)
from .serializers import (
    ResultTemplateSerializer, ResultTemplateItemSerializer,
    ResultComponentSerializer, StudentResultSerializer,
    BulkScoreInputSerializer, TermResultSerializer,
    SessionSerializer, TermSerializer,
)
from academic.models import Session, Term
from curriculum.models import Subject, SchoolClass
from users.models import User


class TeacherSubjectsView(TenantAwareMixin, generics.ListAPIView):
    """Subjects the logged-in teacher teaches."""
    serializer_class = None

    def list(self, request, *args, **kwargs):
        subject_ids = (
            request.user.teaching_enrollments
            .values_list('subject_id', flat=True)
            .distinct()
        )
        subjects = Subject.objects.filter(id__in=subject_ids)
        data = [{'id': s.id, 'name_ar': s.name_ar, 'name_en': s.name_en, 'code': s.code} for s in subjects]
        return Response(data)


class TeacherTermsView(TenantAwareMixin, generics.ListAPIView):
    """Active session terms for the teacher's madrasah."""
    serializer_class = TermSerializer

    def get_queryset(self):
        return Term.objects.filter(
            madrasah=self.request.user.madrasah,
            session__is_current=True
        ).select_related('session').order_by('term_number')


class ResultComponentListCreateView(TenantAwareMixin, generics.ListCreateAPIView):
    serializer_class = ResultComponentSerializer

    def get_queryset(self):
        qs = ResultComponent.objects.filter(madrasah=self.request.user.madrasah)
        subject_id = self.request.query_params.get('subject')
        term_id = self.request.query_params.get('term')
        if subject_id:
            qs = qs.filter(subject_id=subject_id)
        if term_id:
            qs = qs.filter(term_id=term_id)
        return qs.select_related('subject', 'term', 'school_class')

    def perform_create(self, serializer):
        serializer.save(madrasah=self.request.user.madrasah, created_by=self.request.user)


class ResultComponentGenerateView(TenantAwareMixin, APIView):
    """Auto-create ResultComponents from the class template for a subject+term."""

    def post(self, request):
        subject_id = request.data.get('subject')
        term_id = request.data.get('term')
        school_class_id = request.data.get('school_class')

        if not all([subject_id, term_id, school_class_id]):
            return Response({'error': 'subject, term, and school_class required'}, status=400)

        template = ResultTemplate.objects.filter(
            madrasah=request.user.madrasah,
            school_class_id=school_class_id
        ).first()
        if not template:
            return Response({'error': 'No template found for this class'}, status=404)

        items = template.items.all()
        if not items.exists():
            return Response({'error': 'Template has no items'}, status=400)

        created = []
        for item in items:
            _, was_created = ResultComponent.objects.get_or_create(
                madrasah=request.user.madrasah,
                subject_id=subject_id,
                term_id=term_id,
                template_item=item,
                defaults={
                    'school_class_id': school_class_id,
                    'component_type': item.component_type,
                    'name': item.name,
                    'weight': item.weight,
                    'created_by': request.user,
                }
            )
            if was_created:
                created.append(item.name)

        return Response({'created': created})


class ResultComponentDetailView(TenantAwareMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ResultComponentSerializer
    queryset = ResultComponent.objects.all()


class ScoreBulkUpdateView(TenantAwareMixin, APIView):
    """Bulk create/update scores for all students in a component."""

    def post(self, request, component_id):
        component = get_object_or_404(ResultComponent, id=component_id, madrasah=request.user.madrasah)
        serializer = BulkScoreInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        results = []
        with transaction.atomic():
            for entry in serializer.validated_data['scores']:
                student_id = int(entry['student'])
                score = float(entry['score'])
                remarks = entry.get('remarks', '')

                if score > float(component.max_score):
                    return Response(
                        {'error': f"Score {score} exceeds max {component.max_score} for student {student_id}"},
                        status=400
                    )

                sr, created = StudentResult.objects.update_or_create(
                    component=component,
                    student_id=student_id,
                    defaults={
                        'score': score,
                        'remarks': remarks,
                        'entered_by': request.user,
                    }
                )
                results.append({'student': student_id, 'score': score, 'created': created})

            self._recalculate_term_results(component, request.user.madrasah)

        return Response({'updated': len(results), 'results': results})

    def _recalculate_term_results(self, component, madrasah):
        students = User.objects.filter(
            role='student',
            madrasah=madrasah,
            enrollments__subject=component.subject
        ).distinct()
        for student in students:
            tr, _ = TermResult.objects.get_or_create(
                student=student,
                subject=component.subject,
                term=component.term,
                defaults={'status': 'draft'}
            )
            if tr.status == 'draft':
                tr.calculate_total()
                tr.save(update_fields=['total_score', 'grade'])


class ScoreListView(TenantAwareMixin, generics.ListAPIView):
    serializer_class = StudentResultSerializer

    def get_queryset(self):
        component_id = self.request.query_params.get('component')
        qs = StudentResult.objects.filter(
            component__madrasah=self.request.user.madrasah
        )
        if component_id:
            qs = qs.filter(component_id=component_id)
        return qs.select_related('component', 'student')


class TeacherTermSubmitView(TenantAwareMixin, APIView):
    """Teacher submits term results for admin review."""

    def post(self, request):
        subject_id = request.data.get('subject')
        term_id = request.data.get('term')

        if not subject_id or not term_id:
            return Response({'error': 'subject and term required'}, status=400)

        updated = TermResult.objects.filter(
            subject_id=subject_id,
            term_id=term_id,
            status='draft'
        ).update(status='submitted')

        return Response({'submitted': updated})


class PendingResultsView(TenantAwareMixin, generics.ListAPIView):
    """Admin view: list term results pending publication."""
    serializer_class = TermResultSerializer

    def get_queryset(self):
        return TermResult.objects.filter(
            subject__madrasah=self.request.user.madrasah,
            status='submitted'
        ).select_related('student', 'subject', 'term').distinct('student', 'subject', 'term')


class PublishResultsView(TenantAwareMixin, APIView):
    """Admin publishes all term results for a subject+term."""

    def post(self, request):
        subject_id = request.data.get('subject')
        term_id = request.data.get('term')
        action = request.data.get('action', 'publish')

        if not subject_id or not term_id:
            return Response({'error': 'subject and term required'}, status=400)

        if action == 'publish':
            queryset = TermResult.objects.filter(
                subject_id=subject_id,
                term_id=term_id,
                status='submitted'
            )
            count = queryset.update(
                status='published',
                published_by=request.user,
                published_at=now()
            )
            return Response({'published': count})
        elif action == 'unpublish':
            queryset = TermResult.objects.filter(
                subject_id=subject_id,
                term_id=term_id,
                status='published'
            )
            count = queryset.update(status='submitted', published_by=None, published_at=None)
            return Response({'unpublished': count})
        else:
            return Response({'error': 'action must be publish or unpublish'}, status=400)


class ResultTemplateView(TenantAwareMixin, generics.ListCreateAPIView):
    serializer_class = ResultTemplateSerializer

    def get_queryset(self):
        qs = ResultTemplate.objects.filter(madrasah=self.request.user.madrasah)
        class_id = self.request.query_params.get('school_class')
        if class_id:
            qs = qs.filter(school_class_id=class_id)
        return qs.select_related('school_class').prefetch_related('items')

    def perform_create(self, serializer):
        serializer.save(madrasah=self.request.user.madrasah, created_by=self.request.user)


class ResultTemplateDetailView(TenantAwareMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ResultTemplateSerializer
    queryset = ResultTemplate.objects.all()


class ResultTemplateItemBulkView(TenantAwareMixin, APIView):
    """Bulk create/update template items for a template."""

    def post(self, request, template_id):
        template = get_object_or_404(ResultTemplate, id=template_id, madrasah=request.user.madrasah)
        items_data = request.data.get('items', [])
        if not items_data:
            return Response({'error': 'items required'}, status=400)

        with transaction.atomic():
            template.items.all().delete()
            for i, item_data in enumerate(items_data):
                ResultTemplateItem.objects.create(
                    template=template,
                    component_type=item_data['component_type'],
                    name=item_data['name'],
                    weight=item_data['weight'],
                    order=i,
                )

        serializer = ResultTemplateSerializer(template)
        return Response(serializer.data)


class MyTermResultsView(TenantAwareMixin, generics.ListAPIView):
    """Student views their own published results."""
    serializer_class = TermResultSerializer

    def get_queryset(self):
        return TermResult.objects.filter(
            student=self.request.user,
            status='published'
        ).select_related('subject', 'term').order_by('term__term_number', 'subject__name_ar')


class ChildTermResultsView(TenantAwareMixin, generics.ListAPIView):
    """Parent views their child's published results."""
    serializer_class = TermResultSerializer

    def get_queryset(self):
        child_id = self.request.query_params.get('student')
        if not child_id:
            return TermResult.objects.none()
        return TermResult.objects.filter(
            student_id=child_id,
            student__student_parents__parent=self.request.user,
            status='published'
        ).select_related('subject', 'term').order_by('term__term_number', 'subject__name_ar')

