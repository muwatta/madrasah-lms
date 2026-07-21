from __future__ import annotations

import uuid

from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.utils.timezone import now

from users.models import User, Madrasah
from curriculum.models import Subject, SchoolClass
from academic.models import ClassArm, Term, TimetableSlot
from config.validators import validate_document, validate_generic_file


WORKFLOW_STATUS = [
    ('draft', 'Draft'),
    ('submitted', 'Submitted'),
    ('under_review', 'Under Review'),
    ('approved', 'Approved'),
    ('scheduled', 'Scheduled'),
    ('delivered', 'Delivered'),
    ('completed', 'Completed'),
    ('archived', 'Archived'),
    ('rejected', 'Rejected'),
]

DELIVERY_STATUS = [
    ('not_delivered', 'Not Delivered'),
    ('partially_completed', 'Partially Completed'),
    ('completed', 'Completed'),
]

RESOURCE_TYPE = [
    ('pdf', 'PDF'),
    ('doc', 'Word Document'),
    ('ppt', 'PowerPoint'),
    ('image', 'Image'),
    ('audio', 'Audio'),
    ('video', 'Video'),
    ('link', 'External Link'),
    ('youtube', 'YouTube'),
    ('gdrive', 'Google Drive'),
]

TEACHING_METHODS = [
    ('lecture', 'Lecture'),
    ('discussion', 'Discussion'),
    ('group_work', 'Group Work'),
    ('practical', 'Practical'),
    ('presentation', 'Presentation'),
    ('quiz', 'Quiz'),
    ('recitation', 'Recitation'),
    ('demonstration', 'Demonstration'),
    ('collaborative', 'Collaborative Learning'),
    ('project', 'Project-Based'),
    ('differentiated', 'Differentiated Instruction'),
]

AUDIT_MODEL_CHOICES = [
    ('lessonplan', 'Lesson Plan'),
    ('schemeofwork', 'Scheme of Work'),
    ('lessondelivery', 'Lesson Delivery'),
    ('lessonreflection', 'Lesson Reflection'),
    ('lessonresource', 'Lesson Resource'),
]

# ──────────────────────────────────────────────────────
#  1. Scheme of Work
# ──────────────────────────────────────────────────────


class SchemeOfWork(models.Model):
    """Top-level curriculum plan for a subject+term+class."""
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='schemes_of_work')
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name='schemes_of_work')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='schemes_of_work')
    school_class = models.ForeignKey(SchoolClass, on_delete=models.CASCADE, related_name='schemes_of_work')
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='schemes_of_work',
        limit_choices_to={'role': 'ustaadh'})
    title = models.CharField(max_length=255, help_text='e.g. "Quran Memorisation – Term 1"')
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_schemes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['madrasah', 'term', 'subject', 'school_class']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.school_class})"

    @property
    def total_weeks(self):
        return self.weeks.count()

    @property
    def completion_percentage(self):
        total = self.weeks.count()
        if total == 0:
            return 0
        done = self.weeks.filter(status='completed').count()
        return round(done / total * 100, 1)


class SchemeWeek(models.Model):
    """One week entry in a Scheme of Work."""
    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('skipped', 'Skipped'),
    ]

    scheme = models.ForeignKey(SchemeOfWork, on_delete=models.CASCADE, related_name='weeks')
    week_number = models.PositiveSmallIntegerField()
    topic = models.CharField(max_length=255)
    subtopic = models.CharField(max_length=255, blank=True)
    learning_outcomes = models.TextField(blank=True)
    reference_materials = models.TextField(blank=True)
    lesson_count = models.PositiveSmallIntegerField(default=1)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='not_started')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['scheme', 'week_number']
        ordering = ['week_number']

    def __str__(self):
        return f"Week {self.week_number}: {self.topic}"


# ──────────────────────────────────────────────────────
#  2. Learning Objective
# ──────────────────────────────────────────────────────


class LearningObjective(models.Model):
    """Reusable learning objectives."""
    objective = models.TextField()
    subject = models.ForeignKey(
        Subject, on_delete=models.CASCADE, null=True, blank=True, related_name='learning_objectives')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['objective']

    def __str__(self):
        return self.objective[:80]


# ──────────────────────────────────────────────────────
#  3. Lesson Plan (core model)
# ──────────────────────────────────────────────────────


class LessonPlan(models.Model):
    """Full lesson plan with all instructional components."""
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='lesson_plans')
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='lesson_plans',
        limit_choices_to={'role': 'ustaadh'})
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='lesson_plans')
    school_class = models.ForeignKey(SchoolClass, on_delete=models.CASCADE, related_name='lesson_plans')
    class_arm = models.ForeignKey(ClassArm, on_delete=models.SET_NULL, null=True, blank=True, related_name='lesson_plans')
    term = models.ForeignKey(Term, on_delete=models.SET_NULL, null=True, blank=True, related_name='lesson_plans')
    scheme_week = models.ForeignKey(
        SchemeWeek, on_delete=models.SET_NULL, null=True, blank=True, related_name='lesson_plans')
    timetable_slot = models.ForeignKey(
        TimetableSlot, on_delete=models.SET_NULL, null=True, blank=True, related_name='lesson_plans')

    # ── Content fields ──
    title = models.CharField(max_length=300)
    learning_objectives = models.JSONField(default=list, blank=True, help_text='List of learning objectives')
    success_criteria = models.JSONField(default=list, blank=True, help_text='How students know they succeeded')
    keywords = models.JSONField(default=list, blank=True, help_text='Key vocabulary')
    prior_knowledge = models.TextField(blank=True, help_text='What students should already know')

    teaching_materials = models.JSONField(default=list, blank=True, help_text='Materials needed')
    references = models.JSONField(default=list, blank=True, help_text='Textbook references, pages, etc.')
    teaching_methods = models.JSONField(default=list, blank=True, help_text='Teaching methods used')

    duration_minutes = models.PositiveSmallIntegerField(default=45)
    lesson_date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    room = models.CharField(max_length=100, blank=True)

    # ── Lesson phases ──
    introduction = models.TextField(blank=True, help_text='Opening / hook / review')
    lesson_development = models.TextField(blank=True, help_text='Main teaching content')
    student_activities = models.JSONField(default=list, blank=True, help_text='Student activity descriptions')
    differentiation = models.TextField(blank=True, help_text='How to differentiate for varying abilities')
    assessment = models.TextField(blank=True, help_text='Formative assessment strategy')
    homework = models.TextField(blank=True, help_text='Homework assigned from this lesson')
    resources = models.TextField(blank=True, help_text='Additional resources')

    # ── Workflow ──
    status = models.CharField(max_length=20, choices=WORKFLOW_STATUS, default='draft')
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='approved_lessons')
    approval_notes = models.TextField(blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    # ── AI ──
    ai_generated = models.BooleanField(default=False, help_text='Was any content AI-generated?')
    ai_prompt = models.TextField(blank=True, help_text='The prompt used for AI generation')

    # ── Attachments ──
    attachments = models.JSONField(default=list, blank=True)

    # ── Meta ──
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-lesson_date', 'start_time']
        indexes = [
            models.Index(fields=['madrasah', 'teacher', 'status'], name='idx_lp_m_teacher'),
            models.Index(fields=['madrasah', 'subject', 'school_class'], name='idx_lp_m_sub_cls'),
            models.Index(fields=['lesson_date'], name='idx_lp_date'),
            models.Index(fields=['status'], name='idx_lp_status'),
        ]

    def __str__(self):
        return f"{self.title} – {self.lesson_date}"

    @property
    def is_editable(self):
        return self.status in ('draft', 'rejected')

    @property
    def is_published(self):
        return self.status in ('approved', 'scheduled', 'delivered', 'completed')


# ──────────────────────────────────────────────────────
#  4. Lesson Attachment
# ──────────────────────────────────────────────────────


class LessonResource(models.Model):
    """File/resource attached to a lesson plan."""
    lesson = models.ForeignKey(LessonPlan, on_delete=models.CASCADE, related_name='resources_list')
    resource_type = models.CharField(max_length=20, choices=RESOURCE_TYPE)
    title = models.CharField(max_length=255)
    url = models.URLField(blank=True, help_text='For external links, YouTube, GDrive')
    file = models.FileField(upload_to='lesson_resources/', blank=True, validators=[validate_document])
    description = models.TextField(blank=True)
    order = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'title']

    def __str__(self):
        return f"{self.title} ({self.resource_type})"


# ──────────────────────────────────────────────────────
#  5. Lesson Delivery
# ──────────────────────────────────────────────────────


class LessonDelivery(models.Model):
    """Tracks actual delivery of a lesson plan."""
    lesson = models.OneToOneField(LessonPlan, on_delete=models.CASCADE, related_name='delivery')
    delivered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='lesson_deliveries')
    delivery_date = models.DateField()
    delivery_status = models.CharField(max_length=20, choices=DELIVERY_STATUS, default='not_delivered')
    students_present = models.PositiveIntegerField(default=0)
    students_absent = models.PositiveIntegerField(default=0)
    total_students = models.PositiveIntegerField(default=0)
    homework_given = models.BooleanField(default=False)
    assessment_conducted = models.BooleanField(default=False)
    actual_duration_minutes = models.PositiveSmallIntegerField(null=True, blank=True)
    challenges = models.TextField(blank=True, help_text='Challenges encountered during delivery')
    recommendations = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Lesson deliveries'

    def __str__(self):
        return f"Delivery: {self.lesson.title} ({self.delivery_status})"

    @property
    def attendance_rate(self):
        if self.total_students == 0:
            return 0
        return round(self.students_present / self.total_students * 100, 1)


# ──────────────────────────────────────────────────────
#  6. Lesson Reflection
# ──────────────────────────────────────────────────────


class LessonReflection(models.Model):
    """Post-delivery reflection by the teacher."""
    lesson = models.ForeignKey(LessonPlan, on_delete=models.CASCADE, related_name='reflections')
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='lesson_reflections')
    what_went_well = models.TextField(blank=True)
    what_to_improve = models.TextField(blank=True)
    student_understanding = models.TextField(blank=True)
    next_steps = models.TextField(blank=True)
    self_rating = models.PositiveSmallIntegerField(
        default=3, validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text='Teacher self-rating 1-5')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Reflection: {self.lesson.title} (rating {self.self_rating}/5)"


# ──────────────────────────────────────────────────────
#  7. Lesson Audit Log
# ──────────────────────────────────────────────────────


class LessonAuditLog(models.Model):
    """Immutable audit trail for lesson plan mutations."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='lesson_audit_logs')
    action = models.CharField(max_length=50)
    model_name = models.CharField(max_length=50, choices=AUDIT_MODEL_CHOICES)
    object_id = models.CharField(max_length=100)
    previous_data = models.JSONField(default=dict, blank=True)
    new_data = models.JSONField(default=dict, blank=True)
    reason = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['model_name', 'object_id'], name='idx_laudit_model'),
            models.Index(fields=['actor'], name='idx_laudit_actor'),
        ]

    def __str__(self):
        return f"{self.actor} – {self.action} – {self.model_name}#{self.object_id}"


# ──────────────────────────────────────────────────────
#  8. Homework (preserved for backward compat)
# ──────────────────────────────────────────────────────


class Homework(models.Model):
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='homeworks')
    lesson_plan = models.ForeignKey(LessonPlan, on_delete=models.SET_NULL, null=True, blank=True, related_name='homeworks')
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='homeworks')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='homeworks')
    school_class = models.ForeignKey(SchoolClass, on_delete=models.CASCADE, related_name='homeworks')
    title = models.CharField(max_length=200)
    description = models.TextField()
    due_date = models.DateTimeField()
    total_marks = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    attachments = models.JSONField(default=list, blank=True)
    file = models.FileField(upload_to='homework/', blank=True, null=True, validators=[validate_document])
    is_published = models.BooleanField(default=False)
    late_submission_allowed = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-due_date']
        indexes = [
            models.Index(fields=['madrasah', 'teacher'], name='idx_hw_m_teacher'),
            models.Index(fields=['madrasah', 'is_published'], name='idx_hw_m_published'),
        ]

    def __str__(self):
        return self.title


class HomeworkSubmission(models.Model):
    STATUS_CHOICES = [
        ('submitted', 'Submitted'),
        ('graded', 'Graded'),
        ('returned', 'Returned'),
    ]

    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='homework_submissions')
    homework = models.ForeignKey(Homework, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='homework_submissions',
        limit_choices_to={'role': 'student'})
    submitted_at = models.DateTimeField(auto_now_add=True)
    content = models.TextField(blank=True)
    file = models.FileField(upload_to='submissions/', blank=True, null=True, validators=[validate_generic_file])
    attachments = models.JSONField(default=list, blank=True)
    is_late = models.BooleanField(default=False)
    score = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    feedback = models.TextField(blank=True)
    graded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='graded_submissions')
    graded_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='submitted')

    class Meta:
        unique_together = ['homework', 'student']
        ordering = ['-submitted_at']
        indexes = [
            models.Index(fields=['madrasah', 'status'], name='idx_sub_m_status'),
        ]

    def __str__(self):
        return f"{self.student.get_full_name()} - {self.homework}"


# ──────────────────────────────────────────────────────
#  9. Lesson Analytics Snapshot
# ──────────────────────────────────────────────────────


class LessonAnalyticsSnapshot(models.Model):
    """Periodically computed analytics for a teacher/class/term."""
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='lesson_analytics')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='lesson_analytics')
    school_class = models.ForeignKey(SchoolClass, on_delete=models.CASCADE, related_name='lesson_analytics')
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name='lesson_analytics')
    total_planned = models.PositiveIntegerField(default=0)
    total_delivered = models.PositiveIntegerField(default=0)
    total_missed = models.PositiveIntegerField(default=0)
    completion_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    avg_delivery_duration = models.DecimalField(max_digits=6, decimal_places=1, default=0)
    avg_self_rating = models.DecimalField(max_digits=3, decimal_places=1, default=0)
    computed_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['teacher', 'subject', 'school_class', 'term']

    def __str__(self):
        return f"Analytics: {self.teacher} – {self.subject} – {self.term}"
