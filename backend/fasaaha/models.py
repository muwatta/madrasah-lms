from __future__ import annotations

import uuid

from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models

from users.models import User, Madrasah
from curriculum.models import SchoolClass
from config.validators import validate_audio


#  1. Speaking Level


class SpeakingLevel(models.Model):
    """Hierarchical speaking levels (1-10). Phase 1 uses levels 1-3."""
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='fasaaha_levels')
    number = models.PositiveSmallIntegerField(
        help_text='Level number (1-10)')
    name = models.CharField(max_length=100, help_text='English name')
    name_ar = models.CharField(max_length=100, help_text='Arabic name')
    description = models.TextField(blank=True)
    target_vocabulary_count = models.PositiveIntegerField(default=50)
    difficulty = models.PositiveSmallIntegerField(
        default=1, validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text='Overall difficulty 1-5')
    is_active = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['madrasah', 'number']
        ordering = ['sort_order', 'number']

    def __str__(self):
        return f"Level {self.number}: {self.name}"

    @property
    def total_missions(self):
        return self.missions.filter(is_active=True).count()


#  2. Mission Category


class MissionCategory(models.Model):
    """Categories for grouping missions (greetings, food, family, etc.)."""
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='fasaaha_categories')
    name = models.CharField(max_length=100, help_text='English name')
    name_ar = models.CharField(max_length=100, help_text='Arabic name')
    icon = models.CharField(max_length=50, blank=True, help_text='Emoji or icon class')
    description = models.TextField(blank=True)
    sort_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['madrasah', 'name']
        ordering = ['sort_order', 'name']
        verbose_name_plural = 'Mission categories'

    def __str__(self):
        return self.name


#  3. Mission


class Mission(models.Model):
    """Speaking missions assigned to levels. Each mission has a prompt and expected phrases."""
    DIFFICULTY_CHOICES = [
        (1, 'Easy'),
        (2, 'Medium'),
        (3, 'Hard'),
        (4, 'Expert'),
        (5, 'Master'),
    ]

    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='fasaaha_missions')
    level = models.ForeignKey(SpeakingLevel, on_delete=models.CASCADE, related_name='missions')
    category = models.ForeignKey(
        MissionCategory, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='missions')
    title = models.CharField(max_length=200, help_text='English title')
    title_ar = models.CharField(max_length=200, help_text='Arabic title')
    prompt_ar = models.TextField(help_text='Arabic prompt text')
    prompt_transliteration = models.TextField(blank=True, help_text='Latin script transliteration')
    prompt_translation = models.TextField(help_text='English translation of the prompt')
    expected_phrases = models.JSONField(default=list, blank=True, help_text='Expected vocabulary/phrases')
    hints = models.JSONField(default=list, blank=True)
    difficulty = models.PositiveSmallIntegerField(
        choices=DIFFICULTY_CHOICES, default=2)
    max_time_seconds = models.PositiveIntegerField(default=60, help_text='Max recording time in seconds')
    example_audio = models.FileField(
        upload_to='fasaaha/examples/', null=True, blank=True,
        validators=[validate_audio])
    is_active = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name='created_fasaaha_missions')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['madrasah', 'title']
        ordering = ['level__number', 'sort_order']
        indexes = [
            models.Index(fields=['madrasah', 'level'], name='idx_fm_m_level'),
            models.Index(fields=['madrasah', 'category'], name='idx_fm_m_cat'),
            models.Index(fields=['is_active'], name='idx_fm_active'),
        ]

    def __str__(self):
        return f"{self.title} (Level {self.level.number})"

    @property
    def attempt_count(self):
        return self.attempts.count()


#  4. Speaking Attempt


class SpeakingAttempt(models.Model):
    """A student's audio submission for a mission."""
    STATUS_CHOICES = [
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('reviewed', 'Reviewed'),
    ]

    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True)
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='fasaaha_attempts')
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='fasaaha_attempts',
        limit_choices_to={'role': 'student'})
    mission = models.ForeignKey(Mission, on_delete=models.CASCADE, related_name='attempts')
    audio_file = models.FileField(upload_to='fasaaha/recordings/%Y/%m/', validators=[validate_audio])
    audio_duration_ms = models.PositiveIntegerField(null=True, blank=True)
    audio_size_bytes = models.PositiveIntegerField(null=True, blank=True)
    notes = models.TextField(blank=True, help_text='Optional student notes')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='processing')
    attempt_number = models.PositiveSmallIntegerField(default=1)
    is_best_attempt = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['student', 'mission', 'attempt_number']
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['madrasah', 'student', 'mission'], name='idx_sa_m_s_m'),
            models.Index(fields=['madrasah', 'status'], name='idx_sa_m_status'),
            models.Index(fields=['student', 'mission', 'is_best_attempt'], name='idx_sa_best'),
        ]

    def __str__(self):
        return f"{self.student.get_full_name()} - {self.mission.title} (#{self.attempt_number})"

    @property
    def final_score(self):
        """Return teacher override score if present, else AI overall score."""
        review = self.teacher_reviews.order_by('-created_at').first()
        if review and review.overall_score is not None:
            return review.overall_score
        analysis = getattr(self, 'ai_analysis', None)
        if analysis and analysis.overall_score is not None:
            return analysis.overall_score
        return None


#  5. AI Analysis


class AIAnalysis(models.Model):
    """Stores AI-generated analysis of a speaking attempt."""
    PROVIDER_CHOICES = [
        ('whisper', 'Whisper'),
        ('azure_speech', 'Azure Speech'),
        ('google_speech', 'Google Speech'),
        ('local_whisper', 'Local Whisper'),
    ]

    attempt = models.OneToOneField(
        SpeakingAttempt, on_delete=models.CASCADE, related_name='ai_analysis')
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='fasaaha_analyses')

    # Transcription
    transcribed_text = models.TextField(blank=True, help_text='STT output')
    transcription_provider = models.CharField(
        max_length=30, choices=PROVIDER_CHOICES, blank=True)
    transcription_confidence = models.DecimalField(
        max_digits=5, decimal_places=4, null=True, blank=True)
    transcription_raw = models.JSONField(default=dict, blank=True, help_text='Full provider response')

    # Scores (0-100)
    pronunciation_score = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True)
    grammar_score = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True)
    fluency_score = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True)
    vocabulary_score = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True)
    overall_score = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True)

    # Detailed feedback
    pronunciation_feedback = models.JSONField(default=dict, blank=True)
    grammar_feedback = models.JSONField(default=dict, blank=True)
    fluency_feedback = models.JSONField(default=dict, blank=True)

    # Word-level analysis
    word_scores = models.JSONField(default=list, blank=True, help_text='[{word, score, issues}]')

    # Provider metadata
    scoring_provider = models.CharField(max_length=30, blank=True)
    processing_time_ms = models.PositiveIntegerField(null=True, blank=True)
    raw_response = models.JSONField(default=dict, blank=True, help_text='Full AI response')

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['attempt', 'created_at'], name='idx_aa_attempt'),
        ]

    def __str__(self):
        return f"Analysis for {self.attempt} (overall: {self.overall_score})"


#  6. Teacher Review


class TeacherReview(models.Model):
    """Teacher's review and optional score override for a speaking attempt."""
    attempt = models.ForeignKey(
        SpeakingAttempt, on_delete=models.CASCADE, related_name='teacher_reviews')
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='fasaaha_reviews')
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='fasaaha_reviews',
        limit_choices_to={'role': 'ustaadh'})
    overall_score = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
        help_text='Override score (null = use AI score)')
    feedback = models.TextField(blank=True)
    pronunciation_notes = models.TextField(blank=True)
    grammar_notes = models.TextField(blank=True)
    is_approved = models.BooleanField(null=True, blank=True, help_text='null=pending, true=approved, false=needs_work')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['attempt', 'teacher']
        ordering = ['-created_at']

    def __str__(self):
        return f"Review by {self.teacher.get_full_name()} for {self.attempt}"


#  7. Mission Assignment


class MissionAssignment(models.Model):
    """Teacher assigns a mission to a student or class."""
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='fasaaha_assignments')
    mission = models.ForeignKey(Mission, on_delete=models.CASCADE, related_name='assignments')
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='fasaaha_assignments_created')
    target_student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True,
        related_name='fasaaha_assignments',
        limit_choices_to={'role': 'student'})
    target_class = models.ForeignKey(
        SchoolClass, on_delete=models.CASCADE, null=True, blank=True,
        related_name='fasaaha_assignments')
    due_date = models.DateTimeField(null=True, blank=True)
    is_required = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['madrasah', 'mission'], name='idx_fma_m_m'),
            models.Index(fields=['target_student'], name='idx_fma_student'),
            models.Index(fields=['target_class'], name='idx_fma_class'),
        ]

    def __str__(self):
        target = self.target_student or self.target_class
        return f"{self.mission.title} → {target}"


#  8. Student Level Progress


class StudentLevelProgress(models.Model):
    """Tracks a student's progress through each speaking level."""
    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('mastered', 'Mastered'),
    ]

    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='fasaaha_level_progress')
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='fasaaha_level_progress',
        limit_choices_to={'role': 'student'})
    level = models.ForeignKey(
        SpeakingLevel, on_delete=models.CASCADE, related_name='student_progress')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='not_started')
    missions_attempted = models.PositiveIntegerField(default=0)
    missions_completed = models.PositiveIntegerField(default=0, help_text='Missions with score >= 70')
    average_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    best_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    total_time_seconds = models.PositiveIntegerField(default=0)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'level']
        ordering = ['level__number']

    def __str__(self):
        return f"{self.student.get_full_name()} - Level {self.level.number} ({self.status})"


#  9. Student Streak


class StudentStreak(models.Model):
    """Tracks daily practice streaks for gamification."""
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='fasaaha_streaks')
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='fasaaha_streaks',
        limit_choices_to={'role': 'student'})
    current_streak = models.PositiveIntegerField(default=0)
    longest_streak = models.PositiveIntegerField(default=0)
    last_practice_date = models.DateField(null=True, blank=True)
    total_practice_days = models.PositiveIntegerField(default=0)
    total_points = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'madrasah']

    def __str__(self):
        return f"{self.student.get_full_name()} - Streak: {self.current_streak}"


#  10. Badge


class Badge(models.Model):
    """Achievement badges for gamification."""
    CATEGORY_CHOICES = [
        ('milestone', 'Milestone'),
        ('streak', 'Streak'),
        ('level', 'Level'),
        ('special', 'Special'),
    ]

    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='fasaaha_badges')
    name = models.CharField(max_length=100)
    name_ar = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=50, help_text='Emoji or icon identifier')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    criteria = models.JSONField(default=dict, help_text='Award criteria, e.g. {"type": "streak", "value": 7}')
    points = models.PositiveIntegerField(default=10)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['madrasah', 'name']
        ordering = ['category', 'name']

    def __str__(self):
        return f"{self.icon} {self.name}"


#  11. Student Badge


class StudentBadge(models.Model):
    """Records badges earned by students."""
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='fasaaha_student_badges')
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='fasaaha_badges',
        limit_choices_to={'role': 'student'})
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE, related_name='awarded_to')
    awarded_at = models.DateTimeField(auto_now_add=True)
    awarded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='fasaaha_badges_awarded')

    class Meta:
        unique_together = ['student', 'badge']
        ordering = ['-awarded_at']

    def __str__(self):
        return f"{self.student.get_full_name()} earned {self.badge.name}"
