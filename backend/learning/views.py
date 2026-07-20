from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import (
    LearningPath, LearningPathItem,
    FlashCardDeck, FlashCard, FlashCardReview
)
from .serializers import (
    LearningPathSerializer, LearningPathListSerializer,
    LearningPathItemSerializer,
    FlashCardDeckSerializer, FlashCardDeckListSerializer,
    FlashCardSerializer, FlashCardListSerializer,
    FlashCardReviewSerializer, FlashCardReviewResultSerializer
)


LEARNING_PATH_TEMPLATES = {
    'default': [
        ('Introduction & Overview', 'lesson'),
        ('Core Concepts Reading', 'reading'),
        ('Video Explanation', 'video'),
        ('Practice Exercise 1', 'practice'),
        ('Quiz: Fundamentals', 'quiz'),
        ('Advanced Topics', 'lesson'),
        ('Practice Exercise 2', 'practice'),
        ('Applied Project', 'project'),
        ('Comprehensive Quiz', 'quiz'),
        ('Final Assessment', 'quiz'),
    ],
}


class LearningPathViewSet(viewsets.ModelViewSet):
    serializer_class = LearningPathSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        base_qs = LearningPath.objects.annotate(
            _total_items=Count('items', distinct=True),
            _completed_items=Count('items', filter=Q(items__is_completed=True), distinct=True),
        )
        if user.role == 'student':
            return base_qs.filter(
                student=user, is_active=True
            ).select_related('subject', 'student').prefetch_related('items')
        elif user.role == 'ustaadh':
            return base_qs.filter(
                subject__madrasah=user.madrasah,
                student__role='student'
            ).select_related('subject', 'student').prefetch_related('items')
        return LearningPath.objects.none()

    def get_serializer_class(self):
        if self.action == 'list':
            return LearningPathListSerializer
        return LearningPathSerializer

    def perform_create(self, serializer):
        serializer.save(madrasah=self.request.user.madrasah)

    @action(detail=False, methods=['post'])
    def generate(self, request):
        student_id = request.data.get('student')
        subject_id = request.data.get('subject')
        title = request.data.get('title', '')

        if not student_id or not subject_id:
            return Response(
                {'error': 'student and subject are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from users.models import User as LmsUser
        from curriculum.models import Subject as CurSubject
        try:
            student = LmsUser.objects.get(id=student_id, role='student', madrasah=request.user.madrasah)
        except LmsUser.DoesNotExist:
            return Response({'error': 'Student not found in your madrasah'}, status=status.HTTP_404_NOT_FOUND)
        try:
            CurSubject.objects.get(id=subject_id, madrasah=request.user.madrasah)
        except CurSubject.DoesNotExist:
            return Response({'error': 'Subject not found in your madrasah'}, status=status.HTTP_404_NOT_FOUND)

        existing = LearningPath.objects.filter(
            student_id=student_id, subject_id=subject_id
        ).first()
        if existing:
            serializer = LearningPathSerializer(existing, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)

        path = LearningPath.objects.create(
            student_id=student.id,
            subject_id=subject_id,
            title=title or f"Learning Path",
            madrasah=request.user.madrasah
        )

        template = LEARNING_PATH_TEMPLATES['default']
        LearningPathItem.objects.bulk_create([
            LearningPathItem(
                learning_path=path,
                title=item_title,
                item_type=item_type,
                order=i + 1,
                content=f"Complete the {item_type}: {item_title}"
            )
            for i, (item_title, item_type) in enumerate(template)
        ])

        serializer = LearningPathSerializer(path, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'], url_path='items/(?P<item_id>[^/.]+)/complete')
    def complete_item(self, request, pk=None, item_id=None):
        try:
            path = self.get_object()
        except LearningPath.DoesNotExist:
            return Response({'error': 'Path not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            item = path.items.get(pk=item_id)
        except LearningPathItem.DoesNotExist:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)

        score = request.data.get('score')
        item.mark_complete(score=score)

        path.refresh_from_db()
        serializer = LearningPathSerializer(path, context={'request': request})
        return Response(serializer.data)


class FlashCardDeckViewSet(viewsets.ModelViewSet):
    serializer_class = FlashCardDeckSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        base_qs = FlashCardDeck.objects.annotate(card_count=Count('cards', distinct=True))
        if user.role == 'ustaadh':
            return base_qs.filter(
                created_by=user
            ).select_related('created_by').prefetch_related('cards')
        return base_qs.filter(
            madrasah=user.madrasah
        ).filter(
            is_shared=True
        ).select_related('created_by').prefetch_related('cards') | base_qs.filter(
            created_by=user
        ).select_related('created_by').prefetch_related('cards')

    def get_serializer_class(self):
        if self.action == 'list':
            return FlashCardDeckListSerializer
        return FlashCardDeckSerializer

    def perform_create(self, serializer):
        serializer.save(
            madrasah=self.request.user.madrasah,
            created_by=self.request.user
        )

    def perform_update(self, serializer):
        serializer.save(madrasah=self.request.user.madrasah)


class FlashCardViewSet(viewsets.ModelViewSet):
    serializer_class = FlashCardSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        deck_id = self.kwargs.get('deck_pk')
        user = self.request.user
        qs = FlashCard.objects.filter(deck_id=deck_id, deck__madrasah=user.madrasah).prefetch_related('reviews')
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return FlashCardListSerializer
        return FlashCardSerializer

    def perform_create(self, serializer):
        deck_id = self.kwargs.get('deck_pk')
        serializer.save(deck_id=deck_id)

    @action(detail=True, methods=['post'])
    def review(self, request, pk=None, deck_pk=None):
        try:
            card = FlashCard.objects.get(pk=pk, deck_id=deck_pk, deck__madrasah=request.user.madrasah)
        except FlashCard.DoesNotExist:
            return Response({'error': 'Card not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = FlashCardReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        quality = serializer.validated_data['quality']

        last_review = FlashCardReview.objects.filter(
            card=card, student=request.user
        ).order_by('-reviewed_at').first()

        current_ef = float(last_review.easiness_factor) if last_review else 2.5
        current_interval = last_review.interval_days if last_review else 1

        new_ef, new_interval = FlashCardReview.calculate_sm2(quality, current_ef, current_interval)

        next_review = timezone.now() + timezone.timedelta(days=new_interval)

        review = FlashCardReview.objects.create(
            card=card,
            student=request.user,
            quality=quality,
            next_review=next_review,
            interval_days=new_interval,
            easiness_factor=new_ef
        )

        result_serializer = FlashCardReviewResultSerializer(review)
        return Response(result_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='due')
    def due(self, request, deck_pk=None):
        now = timezone.now()
        due_cards = FlashCard.objects.filter(
            deck_id=deck_pk, deck__madrasah=request.user.madrasah
        ).filter(
            reviews__student=request.user,
            reviews__next_review__lte=now
        ).distinct()

        cards_never_reviewed = FlashCard.objects.filter(
            deck_id=deck_pk, deck__madrasah=request.user.madrasah
        ).exclude(
            reviews__student=request.user
        )

        all_due = (due_cards | cards_never_reviewed).distinct()

        serializer = FlashCardSerializer(all_due, many=True, context={'request': request})
        return Response(serializer.data)
