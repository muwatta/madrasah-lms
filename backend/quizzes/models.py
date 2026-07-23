from __future__ import annotations
import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone
from users.models import User, Madrasah
from curriculum.models import Subject, SchoolClass, Topic
from academic.models import Session, Term


# ─── Choices ────────────────────────────────────────────────────────────────

QUESTION_TYPE_CHOICES = [
    ('mcq', 'Multiple Choice'),
    ('true_false', 'True / False'),
]

DIFFICULTY_CHOICES = [
    (1, 'Easy'),
    (2, 'Medium'),
    (3, 'Hard'),
    (4, 'Expert'),
    (5, 'Master'),
]

QUIZ_STATUS_CHOICES = [
    ('draft', 'Draft'),
    ('published', 'Published'),
    ('archived', 'Archived'),
]

GRADING_MODE_CHOICES = [
    ('auto_immediate', 'Auto Grade + Release Immediately'),
    ('auto_release_later', 'Auto Grade + Teacher Releases Later'),
    ('manual', 'Teacher Grades + Releases'),
]

ATTEMPT_STATUS_CHOICES = [
    ('in_progress', 'In Progress'),
    ('submitted', 'Submitted'),
    ('graded', 'Graded'),
    ('released', 'Released'),
]

VIOLATION_TYPE_CHOICES = [
    ('tab_switch', 'Tab Switch'),
    ('window_blur', 'Window Blur'),
    ('copy_attempt', 'Copy Attempt'),
    ('paste_attempt', 'Paste Attempt'),
    ('fullscreen_exit', 'Fullscreen Exit'),
    ('right_click', 'Right Click'),
    ('keyboard_shortcut', 'Keyboard Shortcut'),
]


# ─── 1. Question (Question Bank) ────────────────────────────────────────────

class Question(models.Model):
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='quiz_assessments')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='quiz_assessments')
    topic = models.ForeignKey(Topic, on_delete=models.SET_NULL, null=True, blank=True, related_name='quiz_assessments')
    school_class = models.ForeignKey(SchoolClass, on_delete=models.SET_NULL, null=True, blank=True, related_name='quiz_assessments')
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPE_CHOICES, default='mcq')
    difficulty = models.PositiveSmallIntegerField(choices=DIFFICULTY_CHOICES, default=2)
    marks = models.DecimalField(max_digits=6, decimal_places=2, default=1.00)
    question_text = models.TextField(help_text='Question text (supports Arabic RTL)')
    question_text_ar = models.TextField(blank=True, default='', help_text='Arabic question text')
    options = models.JSONField(
        default=list, blank=True,
        help_text='MCQ: [{"key":"A","text":"...","text_ar":"..."},...]  T/F: auto-generated')
    correct_answer = models.CharField(max_length=10, help_text='Option key: A, B, C, D or true/false')
    explanation = models.TextField(blank=True, default='', help_text='Explanation shown after submission')
    explanation_ar = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name='created_new_quiz_questions')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['madrasah', 'subject'], name='idx_qzq_m_subject'),
            models.Index(fields=['madrasah', 'question_type'], name='idx_qzq_m_type'),
            models.Index(fields=['is_active'], name='idx_qzq_active'),
        ]

    def __str__(self):
        return f"{self.question_text[:60]}... ({self.get_question_type_display()})"

    @property
    def option_count(self):
        if self.question_type == 'true_false':
            return 2
        return len(self.options)


# ─── 2. Quiz ────────────────────────────────────────────────────────────────

class Quiz(models.Model):
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='new_quizzes')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name='created_new_quizzes')

    # General
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    instructions = models.TextField(blank=True, default='')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='new_quizzes')
    school_class = models.ForeignKey(SchoolClass, on_delete=models.CASCADE, related_name='new_quizzes')
    session = models.ForeignKey(Session, on_delete=models.SET_NULL, null=True, blank=True, related_name='new_quizzes')
    term = models.ForeignKey(Term, on_delete=models.SET_NULL, null=True, blank=True, related_name='new_quizzes')
    difficulty = models.PositiveSmallIntegerField(choices=DIFFICULTY_CHOICES, default=2)
    estimated_duration_minutes = models.PositiveIntegerField(default=30)

    # Scheduling
    available_from = models.DateTimeField(null=True, blank=True)
    available_until = models.DateTimeField(null=True, blank=True)
    time_limit_minutes = models.PositiveIntegerField(default=30)
    grace_period_minutes = models.PositiveIntegerField(default=5, help_text='Extra time after expiry for submission')
    max_attempts = models.PositiveIntegerField(default=1)
    passing_score = models.DecimalField(max_digits=5, decimal_places=2, default=60.00)

    # Question settings
    marks_per_question = models.DecimalField(max_digits=6, decimal_places=2, default=1.00)
    negative_marking = models.BooleanField(default=False)
    negative_mark_fraction = models.DecimalField(
        max_digits=3, decimal_places=2, default=0.25,
        help_text='Fraction of marks deducted for wrong answer')
    randomize_questions = models.BooleanField(default=False)
    randomize_options = models.BooleanField(default=False)
    one_question_per_page = models.BooleanField(default=True)
    allow_review = models.BooleanField(default=True)
    allow_back_navigation = models.BooleanField(default=True)
    show_question_numbers = models.BooleanField(default=True)
    auto_save = models.BooleanField(default=True)

    # Grading
    grading_mode = models.CharField(
        max_length=30, choices=GRADING_MODE_CHOICES, default='auto_release_later')

    # Anti-cheating
    require_fullscreen = models.BooleanField(default=False)
    max_violations = models.PositiveIntegerField(default=5)
    auto_submit_on_violations = models.BooleanField(default=True)

    # Status
    status = models.CharField(max_length=20, choices=QUIZ_STATUS_CHOICES, default='draft')
    is_published = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['madrasah', 'status'], name='idx_qz_m_status'),
            models.Index(fields=['madrasah', 'subject'], name='idx_qz_m_subject'),
            models.Index(fields=['madrasah', 'school_class'], name='idx_qz_m_class'),
            models.Index(fields=['is_published'], name='idx_qz_published'),
        ]

    def __str__(self):
        return self.title

    @property
    def total_marks(self):
        return self.quiz_questions.aggregate(
            total=models.Sum('marks'))['total'] or 0

    @property
    def question_count(self):
        return self.quiz_questions.count()

    @property
    def attempt_count(self):
        return self.attempts.count()

    @property
    def is_available_now(self):
        now = timezone.now()
        if self.available_from and now < self.available_from:
            return False
        if self.available_until and now > self.available_until:
            return False
        return self.is_published

    @property
    def average_score(self):
        agg = self.attempts.filter(
            status__in=('submitted', 'graded', 'released'),
            score__isnull=False,
        ).aggregate(avg=models.Avg('percentage'))
        return round(agg['avg'] or 0, 1)


# ─── 3. Quiz Question (M2M through) ────────────────────────────────────────

class QuizQuestion(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='quiz_questions')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='quiz_links')
    sort_order = models.PositiveIntegerField(default=0)
    marks = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True,
        help_text='Override marks for this quiz (null = use question default)')

    class Meta:
        ordering = ['sort_order']
        unique_together = ['quiz', 'question']

    def __str__(self):
        return f"{self.quiz.title} - Q{self.sort_order + 1}"

    @property
    def effective_marks(self):
        return self.marks if self.marks is not None else self.question.marks


# ─── 4. Quiz Assignment ─────────────────────────────────────────────────────

class QuizAssignment(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='assignments')
    school_class = models.ForeignKey(SchoolClass, on_delete=models.CASCADE, related_name='quiz_assignments')
    assigned_to_all = models.BooleanField(default=True, help_text='Assign to all students in class')
    student_ids = models.JSONField(default=list, blank=True, help_text='Specific student IDs if not all')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['quiz', 'school_class']

    def __str__(self):
        return f"{self.quiz.title} → {self.school_class.name}"


# ─── 5. Quiz Attempt ────────────────────────────────────────────────────────

class QuizAttempt(models.Model):
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='quiz_attempts')
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='new_quiz_attempts', limit_choices_to={'role': 'student'})
    attempt_number = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=20, choices=ATTEMPT_STATUS_CHOICES, default='in_progress')

    # Scores
    score = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    total_marks = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    is_pass = models.BooleanField(null=True, blank=True)

    # Timing
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    time_spent_seconds = models.PositiveIntegerField(null=True, blank=True)

    # Proctoring snapshot
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-started_at']
        unique_together = ['quiz', 'student', 'attempt_number']
        indexes = [
            models.Index(fields=['student', 'quiz'], name='idx_qza_student_quiz'),
            models.Index(fields=['quiz', 'status'], name='idx_qza_quiz_status'),
            models.Index(fields=['madrasah', 'status'], name='idx_qza_m_status'),
        ]

    def __str__(self):
        return f"{self.student.get_full_name()} - {self.quiz.title} ({self.attempt_number})"

    @property
    def time_remaining_seconds(self):
        if self.submitted_at:
            return 0
        elapsed = (timezone.now() - self.started_at).total_seconds()
        limit = (self.quiz.time_limit_minutes + self.quiz.grace_period_minutes) * 60
        return max(0, int(limit - elapsed))

    @property
    def is_expired(self):
        return self.time_remaining_seconds <= 0 and not self.submitted_at


# ─── 6. Quiz Answer ─────────────────────────────────────────────────────────

class QuizAnswer(models.Model):
    attempt = models.ForeignKey(QuizAttempt, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='quiz_answers')
    selected_answer = models.CharField(max_length=10, blank=True, default='')
    is_correct = models.BooleanField(null=True, blank=True)
    marks_awarded = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    is_flagged = models.BooleanField(default=False)
    time_spent_seconds = models.PositiveIntegerField(null=True, blank=True)
    answered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['id']
        unique_together = ['attempt', 'question']

    def __str__(self):
        return f"Q{self.question_id} → {self.selected_answer}"


# ─── 7. Violation Log ───────────────────────────────────────────────────────

class ViolationLog(models.Model):
    attempt = models.ForeignKey(QuizAttempt, on_delete=models.CASCADE, related_name='violations')
    violation_type = models.CharField(max_length=30, choices=VIOLATION_TYPE_CHOICES)
    details = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['attempt', 'violation_type'], name='idx_vl_attempt_type'),
        ]

    def __str__(self):
        return f"{self.get_violation_type_display()} - {self.attempt}"
