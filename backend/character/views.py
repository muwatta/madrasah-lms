from datetime import timedelta

from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from users.models import User
from .models import CharacterTrait, CharacterEvaluation, CharacterScore
from .serializers import (
    CharacterTraitSerializer,
    CharacterEvaluationSerializer,
    CharacterEvaluationListSerializer,
    CharacterScoreSerializer,
)
from .services import CharacterService


class IsMudeerOrReadOnly(IsAuthenticated):
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return request.user.role in ('mudeer', 'idaarah')


class CharacterTraitViewSet(viewsets.ModelViewSet):
    serializer_class = CharacterTraitSerializer
    permission_classes = [IsMudeerOrReadOnly]

    def get_queryset(self):
        qs = CharacterTrait.objects.filter(madrasah=self.request.user.madrasah)
        if self.request.user.role == 'student':
            qs = qs.filter(is_active=True)
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)
        return qs

    def perform_create(self, serializer):
        serializer.save(madrasah=self.request.user.madrasah)


class CharacterEvaluationViewSet(viewsets.ModelViewSet):
    serializer_class = CharacterEvaluationSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return CharacterEvaluationListSerializer
        return CharacterEvaluationSerializer

    def get_queryset(self):
        qs = CharacterEvaluation.objects.filter(
            madrasah=self.request.user.madrasah
        ).select_related('student', 'teacher', 'term').prefetch_related('scores__trait')

        user = self.request.user
        if user.role == 'student':
            qs = qs.filter(student=user)
        elif user.role == 'ustaadh':
            student_ids = User.objects.filter(
                role='student', madrasah=user.madrasah
            ).values_list('id', flat=True)
            qs = qs.filter(student_id__in=student_ids)

        student_id = self.request.query_params.get('student')
        if student_id:
            qs = qs.filter(student_id=student_id)

        teacher_id = self.request.query_params.get('teacher')
        if teacher_id:
            qs = qs.filter(teacher_id=teacher_id)

        term_id = self.request.query_params.get('term')
        if term_id:
            qs = qs.filter(term_id=term_id)

        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            qs = qs.filter(evaluation_date__gte=date_from)
        if date_to:
            qs = qs.filter(evaluation_date__lte=date_to)

        return qs

    def perform_create(self, serializer):
        serializer.save(
            madrasah=self.request.user.madrasah,
            teacher=self.request.user,
        )

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        time_since_creation = timezone.now() - instance.created_at
        if time_since_creation > timedelta(hours=24):
            return Response(
                {'detail': 'Evaluations can only be updated within 24 hours of creation.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        time_since_creation = timezone.now() - instance.created_at
        if time_since_creation > timedelta(hours=24):
            return Response(
                {'detail': 'Evaluations can only be updated within 24 hours of creation.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().partial_update(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        student_id = request.query_params.get('student')
        term_id = request.query_params.get('term')

        if not student_id:
            return Response(
                {'detail': 'student query parameter is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            student = User.objects.get(pk=student_id, role='student', madrasah=request.user.madrasah)
        except User.DoesNotExist:
            return Response(
                {'detail': 'Student not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if request.user.role == 'student' and request.user.pk != student.pk:
            return Response(
                {'detail': 'Not authorized.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        from academic.models import Term
        term = None
        if term_id:
            try:
                term = Term.objects.get(pk=term_id, madrasah=request.user.madrasah)
            except Term.DoesNotExist:
                pass

        service = CharacterService()
        summary = service.get_student_summary(student, term=term)
        return Response(summary)
