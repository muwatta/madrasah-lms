"""
Fasaaha DRF serializers.

Separate read and write serializers where needed.
Nested serializers for related objects.
"""
from __future__ import annotations

from rest_framework import serializers

from .models import (
    SpeakingLevel, MissionCategory, Mission, SpeakingAttempt,
    AIAnalysis, TeacherReview, MissionAssignment,
    StudentLevelProgress, StudentStreak, Badge, StudentBadge,
)


#  Levels


class SpeakingLevelSerializer(serializers.ModelSerializer):
    total_missions = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = SpeakingLevel
        fields = [
            'id', 'madrasah', 'number', 'name', 'name_ar', 'description',
            'target_vocabulary_count', 'difficulty', 'is_active', 'sort_order',
            'total_missions', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'madrasah', 'created_at', 'updated_at']


class SpeakingLevelWriteSerializer(serializers.Serializer):
    number = serializers.IntegerField(min_value=1, max_value=10)
    name = serializers.CharField(max_length=100)
    name_ar = serializers.CharField(max_length=100)
    description = serializers.CharField(required=False, default='')
    target_vocabulary_count = serializers.IntegerField(default=50, min_value=1)
    difficulty = serializers.IntegerField(default=1, min_value=1, max_value=5)
    is_active = serializers.BooleanField(default=True)
    sort_order = serializers.IntegerField(default=0)


#  Categories


class MissionCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MissionCategory
        fields = [
            'id', 'madrasah', 'name', 'name_ar', 'icon', 'description',
            'sort_order', 'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'madrasah', 'created_at']


class MissionCategoryWriteSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    name_ar = serializers.CharField(max_length=100)
    icon = serializers.CharField(required=False, default='', max_length=50)
    description = serializers.CharField(required=False, default='')
    sort_order = serializers.IntegerField(default=0)
    is_active = serializers.BooleanField(default=True)


#  Missions


class MissionSerializer(serializers.ModelSerializer):
    level_number = serializers.IntegerField(source='level.number', read_only=True)
    level_name = serializers.CharField(source='level.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True, default=None)
    attempt_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Mission
        fields = [
            'id', 'madrasah', 'level', 'level_number', 'level_name',
            'category', 'category_name',
            'title', 'title_ar', 'prompt_ar', 'prompt_transliteration',
            'prompt_translation', 'expected_phrases', 'hints',
            'difficulty', 'mission_type', 'max_time_seconds', 'example_audio',
            'is_active', 'sort_order',
            'created_by', 'created_by_name', 'attempt_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'madrasah', 'created_by', 'created_at', 'updated_at']


class MissionWriteSerializer(serializers.Serializer):
    level = serializers.IntegerField(help_text="SpeakingLevel ID")
    category = serializers.IntegerField(required=False, allow_null=True, help_text="MissionCategory ID")
    title = serializers.CharField(max_length=200)
    title_ar = serializers.CharField(max_length=200)
    prompt_ar = serializers.CharField()
    prompt_transliteration = serializers.CharField(required=False, default='')
    prompt_translation = serializers.CharField()
    expected_phrases = serializers.ListField(child=serializers.CharField(), required=False, default=[])
    hints = serializers.ListField(child=serializers.CharField(), required=False, default=[])
    difficulty = serializers.IntegerField(default=2, min_value=1, max_value=5)
    mission_type = serializers.ChoiceField(choices=Mission.MISSION_TYPE_CHOICES, default='pronunciation')
    max_time_seconds = serializers.IntegerField(default=60, min_value=10, max_value=300)
    sort_order = serializers.IntegerField(default=0)
    is_active = serializers.BooleanField(default=True)


#  Attempts


class SpeakingAttemptSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    mission_title = serializers.CharField(source='mission.title', read_only=True)
    mission_title_ar = serializers.CharField(source='mission.title_ar', read_only=True)
    level_number = serializers.IntegerField(source='mission.level.number', read_only=True)
    audio_url = serializers.SerializerMethodField()
    ai_analysis = serializers.SerializerMethodField()
    teacher_review = serializers.SerializerMethodField()
    final_score = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)

    class Meta:
        model = SpeakingAttempt
        fields = [
            'id', 'uuid', 'madrasah', 'student', 'student_name',
            'mission', 'mission_title', 'mission_title_ar', 'level_number',
            'audio_file', 'audio_url',
            'audio_duration_ms', 'audio_size_bytes', 'notes',
            'status', 'attempt_number', 'is_best_attempt',
            'activity_type', 'ai_analysis', 'teacher_review', 'final_score',
            'created_at', 'completed_at',
        ]
        read_only_fields = [
            'id', 'uuid', 'madrasah', 'student', 'status',
            'attempt_number', 'is_best_attempt', 'created_at', 'completed_at',
        ]

    def get_audio_url(self, obj):
        if obj.audio_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.audio_file.url)
            return obj.audio_file.url
        return None

    def get_ai_analysis(self, obj):
        analysis = getattr(obj, 'ai_analysis', None)
        if analysis:
            return AIAnalysisSerializer(analysis).data
        return None

    def get_teacher_review(self, obj):
        review = obj.teacher_reviews.order_by('-created_at').first()
        if review:
            return TeacherReviewSerializer(review).data
        return None


class SpeakingAttemptWriteSerializer(serializers.Serializer):
    mission = serializers.IntegerField(help_text="Mission ID")
    audio = serializers.FileField(help_text="Audio recording (mp3, wav, ogg, m4a)")
    notes = serializers.CharField(required=False, default='', allow_blank=True)


class AttemptRetrySerializer(serializers.Serializer):
    audio = serializers.FileField(help_text="Audio recording for retry")
    notes = serializers.CharField(required=False, default='', allow_blank=True)


#  AI Analysis


class AIAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIAnalysis
        fields = [
            'id', 'attempt', 'madrasah',
            'transcribed_text', 'transcription_provider', 'transcription_confidence',
            'pronunciation_score', 'grammar_score', 'fluency_score',
            'vocabulary_score', 'overall_score',
            'pronunciation_feedback', 'grammar_feedback', 'fluency_feedback',
            'word_scores', 'scoring_provider', 'processing_time_ms',
            'confidence_score', 'topic_relevance_score',
            'fluency_words_per_minute', 'fluency_pause_ratio',
            'created_at',
        ]
        read_only_fields = fields


#  Teacher Reviews


class TeacherReviewSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    student_name = serializers.CharField(source='attempt.student.get_full_name', read_only=True)
    mission_title = serializers.CharField(source='attempt.mission.title', read_only=True)

    class Meta:
        model = TeacherReview
        fields = [
            'id', 'attempt', 'madrasah', 'teacher', 'teacher_name',
            'student_name', 'mission_title',
            'overall_score', 'feedback',
            'pronunciation_notes', 'grammar_notes',
            'is_approved', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'madrasah', 'teacher', 'created_at', 'updated_at']


class TeacherReviewWriteSerializer(serializers.Serializer):
    overall_score = serializers.DecimalField(
        max_digits=5, decimal_places=2, required=False, allow_null=True,
        help_text='Override score (null = use AI score)')
    feedback = serializers.CharField(required=False, default='')
    pronunciation_notes = serializers.CharField(required=False, default='')
    grammar_notes = serializers.CharField(required=False, default='')
    is_approved = serializers.BooleanField(required=False, allow_null=True, default=None)


#  Assignments


class MissionAssignmentSerializer(serializers.ModelSerializer):
    mission_title = serializers.CharField(source='mission.title', read_only=True)
    mission_title_ar = serializers.CharField(source='mission.title_ar', read_only=True)
    assigned_by_name = serializers.CharField(source='assigned_by.get_full_name', read_only=True)
    target_student_name = serializers.CharField(
        source='target_student.get_full_name', read_only=True, default=None)
    target_class_name = serializers.CharField(
        source='target_class.name_en', read_only=True, default=None)

    class Meta:
        model = MissionAssignment
        fields = [
            'id', 'madrasah', 'mission', 'mission_title', 'mission_title_ar',
            'assigned_by', 'assigned_by_name',
            'target_student', 'target_student_name',
            'target_class', 'target_class_name',
            'due_date', 'is_required', 'notes', 'created_at',
        ]
        read_only_fields = ['id', 'madrasah', 'assigned_by', 'created_at']


class MissionAssignmentWriteSerializer(serializers.Serializer):
    mission = serializers.IntegerField(help_text="Mission ID")
    target_student = serializers.IntegerField(required=False, allow_null=True, help_text="Student user ID")
    target_class = serializers.IntegerField(required=False, allow_null=True, help_text="SchoolClass ID")
    due_date = serializers.DateTimeField(required=False, allow_null=True)
    is_required = serializers.BooleanField(default=False)
    notes = serializers.CharField(required=False, default='')


#  Progress


class StudentLevelProgressSerializer(serializers.ModelSerializer):
    level_number = serializers.IntegerField(source='level.number', read_only=True)
    level_name = serializers.CharField(source='level.name', read_only=True)
    level_name_ar = serializers.CharField(source='level.name_ar', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)

    class Meta:
        model = StudentLevelProgress
        fields = [
            'id', 'madrasah', 'student', 'student_name',
            'level', 'level_number', 'level_name', 'level_name_ar',
            'status', 'missions_attempted', 'missions_completed',
            'average_score', 'best_score', 'total_time_seconds',
            'started_at', 'completed_at', 'updated_at',
        ]
        read_only_fields = fields


#  Streaks


class StudentStreakSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)

    class Meta:
        model = StudentStreak
        fields = [
            'id', 'madrasah', 'student', 'student_name',
            'current_streak', 'longest_streak',
            'last_practice_date', 'total_practice_days',
            'total_points', 'updated_at',
        ]
        read_only_fields = fields


#  Badges


class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = [
            'id', 'madrasah', 'name', 'name_ar', 'description',
            'icon', 'category', 'criteria', 'points', 'is_active',
            'created_at',
        ]
        read_only_fields = ['id', 'madrasah', 'created_at']


class StudentBadgeSerializer(serializers.ModelSerializer):
    badge_name = serializers.CharField(source='badge.name', read_only=True)
    badge_name_ar = serializers.CharField(source='badge.name_ar', read_only=True)
    badge_icon = serializers.CharField(source='badge.icon', read_only=True)
    badge_category = serializers.CharField(source='badge.category', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    awarded_by_name = serializers.CharField(
        source='awarded_by.get_full_name', read_only=True, default=None)

    class Meta:
        model = StudentBadge
        fields = [
            'id', 'madrasah', 'student', 'student_name',
            'badge', 'badge_name', 'badge_name_ar', 'badge_icon', 'badge_category',
            'awarded_at', 'awarded_by', 'awarded_by_name',
        ]
        read_only_fields = ['id', 'madrasah', 'awarded_at']


class BadgeWriteSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    name_ar = serializers.CharField(max_length=100)
    description = serializers.CharField()
    icon = serializers.CharField(max_length=50)
    category = serializers.ChoiceField(choices=Badge.CATEGORY_CHOICES)
    criteria = serializers.DictField()
    points = serializers.IntegerField(default=10, min_value=1)
    is_active = serializers.BooleanField(default=True)


#  Dashboard


class StudentDashboardSerializer(serializers.Serializer):
    current_level = SpeakingLevelSerializer(read_only=True, allow_null=True)
    total_attempts = serializers.IntegerField()
    completed_missions = serializers.IntegerField()
    current_streak = serializers.IntegerField()
    longest_streak = serializers.IntegerField()
    total_points = serializers.IntegerField()
    badge_count = serializers.IntegerField()


class TeacherDashboardSerializer(serializers.Serializer):
    classes_taught = serializers.ListField(child=serializers.IntegerField())
    total_students = serializers.IntegerField()
    pending_reviews_count = serializers.IntegerField()
    total_attempts = serializers.IntegerField()
    average_class_score = serializers.FloatField()
    pending_reviews = SpeakingAttemptSerializer(many=True, read_only=True)
