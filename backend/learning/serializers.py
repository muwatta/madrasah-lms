from rest_framework import serializers
from django.utils import timezone
from .models import (
    LearningPath, LearningPathItem,
    FlashCardDeck, FlashCard, FlashCardReview
)


class LearningPathItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningPathItem
        fields = [
            'id', 'learning_path', 'title', 'item_type', 'content',
            'order', 'is_completed', 'completed_at', 'score', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'completed_at']


class LearningPathSerializer(serializers.ModelSerializer):
    items = LearningPathItemSerializer(many=True, read_only=True)
    subject_name = serializers.CharField(source='subject.name_ar', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    total_items = serializers.SerializerMethodField()
    completed_items = serializers.SerializerMethodField()

    class Meta:
        model = LearningPath
        fields = [
            'id', 'student', 'student_name', 'subject', 'subject_name',
            'title', 'current_level', 'total_levels', 'progress_percent',
            'is_active', 'items', 'total_items', 'completed_items',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'progress_percent', 'created_at', 'updated_at']

    def get_total_items(self, obj):
        return getattr(obj, '_total_items', None) or obj.items.count()

    def get_completed_items(self, obj):
        return getattr(obj, '_completed_items', None) or obj.items.filter(is_completed=True).count()


class LearningPathListSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name_ar', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    total_items = serializers.SerializerMethodField()
    completed_items = serializers.SerializerMethodField()

    class Meta:
        model = LearningPath
        fields = [
            'id', 'student', 'student_name', 'subject', 'subject_name',
            'title', 'current_level', 'total_levels', 'progress_percent',
            'is_active', 'total_items', 'completed_items',
            'created_at', 'updated_at'
        ]

    def get_total_items(self, obj):
        return getattr(obj, '_total_items', None) or obj.items.count()

    def get_completed_items(self, obj):
        return getattr(obj, '_completed_items', None) or obj.items.filter(is_completed=True).count()


class FlashCardSerializer(serializers.ModelSerializer):
    review_count = serializers.SerializerMethodField()
    next_review = serializers.SerializerMethodField()

    class Meta:
        model = FlashCard
        fields = [
            'id', 'deck', 'front', 'back', 'hint',
            'difficulty', 'order', 'created_at',
            'review_count', 'next_review'
        ]
        read_only_fields = ['id', 'created_at']

    def get_review_count(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            return obj.reviews.filter(student=request.user).count()
        return 0

    def get_next_review(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            last_review = obj.reviews.filter(student=request.user).order_by('-reviewed_at').first()
            if last_review:
                return last_review.next_review
        return None


class FlashCardListSerializer(serializers.ModelSerializer):
    class Meta:
        model = FlashCard
        fields = ['id', 'deck', 'front', 'back', 'hint', 'difficulty', 'order', 'created_at']


class FlashCardDeckSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    subject_name = serializers.SerializerMethodField()
    card_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = FlashCardDeck
        fields = [
            'id', 'madrasah', 'subject', 'subject_name', 'title',
            'description', 'is_shared', 'created_by', 'created_by_name',
            'card_count', 'created_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'madrasah']

    def get_subject_name(self, obj):
        if obj.subject:
            return obj.subject.name_ar
        return None


class FlashCardDeckListSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    card_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = FlashCardDeck
        fields = [
            'id', 'title', 'description', 'is_shared',
            'created_by', 'created_by_name', 'card_count', 'created_at'
        ]


class FlashCardReviewSerializer(serializers.Serializer):
    quality = serializers.IntegerField(min_value=0, max_value=5)

    def validate_quality(self, value):
        if value < 0 or value > 5:
            raise serializers.ValidationError("Quality must be between 0 and 5")
        return value


class FlashCardReviewResultSerializer(serializers.ModelSerializer):
    card_front = serializers.CharField(source='card.front', read_only=True)

    class Meta:
        model = FlashCardReview
        fields = [
            'id', 'card', 'card_front', 'student', 'quality',
            'reviewed_at', 'next_review', 'interval_days', 'easiness_factor'
        ]
        read_only_fields = ['id', 'student', 'reviewed_at', 'next_review', 'interval_days', 'easiness_factor']
