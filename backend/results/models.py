from __future__ import annotations

import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.utils.timezone import now

from users.models import User, Madrasah

# ──────────────────────────────────────────────────────
#  Choice tuples
# ──────────────────────────────────────────────────────

COMPONENT_TYPES = [
    ('assignment', 'Assignment'),
    ('test', 'Quiz / Test'),
    ('ca', 'Continuous Assessment'),
    ('midterm', 'Midterm Exam'),
    ('exam', 'Final Exam'),
]

WORKFLOW_STATUS = [
    ('draft', 'Draft'),
    ('submitted', 'Submitted'),
    ('under_review', 'Under Review'),
    ('approved', 'Approved'),
    ('published', 'Published'),
    ('locked', 'Locked'),
    ('archived', 'Archived'),
    ('rejected', 'Rejected'),
]

APPROVAL_ACTION = [
    ('submit', 'Submit for Review'),
    ('approve', 'Approve'),
    ('reject', 'Reject'),
    ('publish', 'Publish'),
    ('reopen', 'Reopen'),
    ('lock', 'Lock'),
]

RANK_TYPE = [
    ('subject', 'Subject Rank'),
    ('class', 'Class Rank'),
    ('overall', 'Overall Rank'),
]

AUDIT_MODEL = [
    ('subjectresult', 'SubjectResult'),
    ('termresult', 'TermResult'),
    ('annualresult', 'AnnualResult'),
    ('assessment', 'Assessment'),
    ('assessmentscore', 'AssessmentScore'),
    ('resultpublication', 'ResultPublication'),
    ('reportcard', 'ReportCard'),
]

# ──────────────────────────────────────────────────────
#  1. Grade Scale
# ──────────────────────────────────────────────────────


class GradeScale(models.Model):
    """A school's grading policy.  Each madrasah may have several."""
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='grade_scales')
    name = models.CharField(max_length=100, help_text='e.g. "Standard", "Honours"')
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['madrasah', 'name']
        ordering = ['-is_default', 'name']

    def __str__(self) -> str:
        tag = ' (default)' if self.is_default else ''
        return f"{self.name}{tag}"

    def save(self, *args, **kwargs):
        if self.is_default:
            (GradeScale.objects
             .filter(madrasah=self.madrasah, is_default=True)
             .exclude(pk=self.pk)
             .update(is_default=False))
        super().save(*args, **kwargs)

    # ── helpers ────────────────────────────────────────
    def get_grade(self, score: float, max_score: float = 100) -> tuple[str, str]:
        """Return (grade_letter, remark) for *score*."""
        pct = (score / max_score * 100) if max_score else 0
        for band in self.bands.order_by('-min_score'):
            if pct >= band.min_score:
                return band.grade, band.remark
        return '', ''

    def get_gpa_points(self, score: float, max_score: float = 100) -> float:
        """Return GPA points for *score*."""
        pct = (score / max_score * 100) if max_score else 0
        for band in self.bands.order_by('-min_score'):
            if pct >= band.min_score:
                return float(band.gpa_points)
        return 0.0


class GradeScaleBand(models.Model):
    """A single row inside a GradeScale (e.g. A 70-100 GPA 4.0)."""
    grade_scale = models.ForeignKey(GradeScale, on_delete=models.CASCADE, related_name='bands')
    min_score = models.DecimalField(
        max_digits=5, decimal_places=2, validators=[MinValueValidator(0), MaxValueValidator(100)])
    max_score = models.DecimalField(
        max_digits=5, decimal_places=2, validators=[MinValueValidator(0), MaxValueValidator(100)])
    grade = models.CharField(max_length=5)
    gpa_points = models.DecimalField(max_digits=3, decimal_places=1, default=0)
    remark = models.CharField(max_length=255, blank=True)

    class Meta:
        unique_together = ['grade_scale', 'grade']
        ordering = ['-min_score']

    def __str__(self) -> str:
        return f"{self.grade} ({self.min_score}–{self.max_score})"

    def clean(self):
        if self.min_score > self.max_score:
            raise ValidationError('min_score must be <= max_score')


# ──────────────────────────────────────────────────────
#  2. Assessment Blueprint (configurable per class)
# ──────────────────────────────────────────────────────


class AssessmentBlueprint(models.Model):
    """Template that defines *what* components a class/subject uses.

    Example: "Quran 5-A" might have Assignment 10%, Test 10%, CA 20%,
    Midterm 20%, Exam 40%.
    """
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='assessment_blueprints')
    school_class = models.ForeignKey('curriculum.SchoolClass', on_delete=models.CASCADE, related_name='assessment_blueprints')
    name = models.CharField(max_length=255, default='Default Blueprint')
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_blueprints')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['madrasah', 'school_class', 'name']
        ordering = ['-is_active', 'name']

    def __str__(self) -> str:
        return f"{self.school_class} – {self.name}"

    @property
    def total_weight(self) -> float:
        return float(self.components.aggregate(t=models.Sum('weight'))['t'] or 0)

    def validate_weights(self):
        tw = self.total_weight
        if abs(tw - 100) > 0.01:
            raise ValidationError(f'Total weight must be 100%, currently {tw:.1f}%')


class BlueprintComponent(models.Model):
    """One weight row in a Blueprint."""
    blueprint = models.ForeignKey(AssessmentBlueprint, on_delete=models.CASCADE, related_name='components')
    name = models.CharField(max_length=255)
    component_type = models.CharField(max_length=20, choices=COMPONENT_TYPES)
    weight = models.DecimalField(max_digits=5, decimal_places=2, help_text='Percentage weight')
    max_score = models.DecimalField(max_digits=5, decimal_places=2, default=100)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['order']
        unique_together = ['blueprint', 'name']

    def __str__(self) -> str:
        return f"{self.name} ({self.weight}%)"


# ──────────────────────────────────────────────────────
#  3. Assessment (concrete instance for a subject+term)
# ──────────────────────────────────────────────────────


class Assessment(models.Model):
    """A single assessment component in a specific subject+term+class.

    Generated from a BlueprintComponent.
    """
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='assessments')
    subject = models.ForeignKey('curriculum.Subject', on_delete=models.CASCADE, related_name='assessments')
    term = models.ForeignKey('academic.Term', on_delete=models.CASCADE, related_name='assessments')
    school_class = models.ForeignKey('curriculum.SchoolClass', on_delete=models.CASCADE, related_name='assessments')
    blueprint_component = models.ForeignKey(
        BlueprintComponent, on_delete=models.SET_NULL, null=True, blank=True, related_name='assessments')
    component_type = models.CharField(max_length=20, choices=COMPONENT_TYPES)
    name = models.CharField(max_length=255)
    max_score = models.DecimalField(max_digits=5, decimal_places=2, default=100)
    weight = models.DecimalField(max_digits=5, decimal_places=2, help_text='Percentage weight of this component')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_assessments')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['subject', 'term', 'component_type', 'order', 'name']
        indexes = [
            models.Index(fields=['subject', 'term', 'school_class'], name='idx_asmt_sub_term_cls'),
        ]

    # helper for ordering inside component_type group
    order = models.PositiveSmallIntegerField(default=0)

    def __str__(self) -> str:
        return f"{self.subject} – {self.term} – {self.name}"


# ──────────────────────────────────────────────────────
#  4. Assessment Score
# ──────────────────────────────────────────────────────


class AssessmentScore(models.Model):
    """Raw score for one student on one Assessment."""
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name='scores')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='assessment_scores')
    score = models.DecimalField(max_digits=7, decimal_places=2)
    remarks = models.TextField(blank=True)
    entered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='entered_assessment_scores')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['assessment', 'student']
        indexes = [
            models.Index(fields=['assessment', 'student'], name='idx_ascore_asmt_stud'),
        ]

    def __str__(self) -> str:
        return f"{self.student} – {self.assessment}: {self.score}"

    def clean(self):
        if self.score > self.assessment.max_score:
            raise ValidationError(f'Score cannot exceed {self.assessment.max_score}')


# ──────────────────────────────────────────────────────
#  5. SubjectResult  (per student, per subject, per term)
# ──────────────────────────────────────────────────────


class SubjectResult(models.Model):
    """Auto-calculated weighted total for one subject+term+student.

    The ``status`` field carries the workflow state (draft → … → published).
    """
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='subject_results')
    subject = models.ForeignKey('curriculum.Subject', on_delete=models.CASCADE, related_name='subject_results')
    term = models.ForeignKey('academic.Term', on_delete=models.CASCADE, related_name='subject_results')
    school_class = models.ForeignKey('curriculum.SchoolClass', on_delete=models.CASCADE, related_name='subject_results')
    total_score = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    grade = models.CharField(max_length=5, blank=True)
    grade_remark = models.CharField(max_length=255, blank=True)
    gpa_points = models.DecimalField(max_digits=3, decimal_places=1, default=0)
    teacher_comment = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=WORKFLOW_STATUS, default='draft')

    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='submitted_subject_results')
    submitted_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'subject', 'term']
        ordering = ['term', 'subject', 'student']
        indexes = [
            models.Index(fields=['subject', 'term', 'school_class'], name='idx_subres_cls'),
            models.Index(fields=['student', 'term'], name='idx_subres_stud'),
        ]

    def __str__(self) -> str:
        return f"{self.student} – {self.subject} T{self.term.term_number}: {self.total_score} ({self.grade})"


# ──────────────────────────────────────────────────────
#  6. TermResult  (per student, per term — aggregated)
# ──────────────────────────────────────────────────────


class TermResult(models.Model):
    """Aggregated term result for a student.  Shows average, GPA, position."""
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='term_results')
    term = models.ForeignKey('academic.Term', on_delete=models.CASCADE, related_name='term_results')
    school_class = models.ForeignKey('curriculum.SchoolClass', on_delete=models.CASCADE, related_name='term_results', null=True, blank=True)
    average_score = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    gpa = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    grade = models.CharField(max_length=5, blank=True)
    grade_remark = models.CharField(max_length=255, blank=True)
    position = models.PositiveIntegerField(null=True, blank=True)
    class_size = models.PositiveIntegerField(default=0)
    total_subjects = models.PositiveIntegerField(default=0)
    subjects_passed = models.PositiveIntegerField(default=0)
    subjects_failed = models.PositiveIntegerField(default=0)
    teacher_comment = models.TextField(blank=True)
    principal_comment = models.TextField(blank=True)
    rank_position = models.CharField(max_length=20, blank=True, help_text='e.g. 1st, 2nd, 3rd')
    status = models.CharField(max_length=20, choices=WORKFLOW_STATUS, default='draft')
    published_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'term']
        ordering = ['term', 'position', 'student']

    def __str__(self) -> str:
        return f"{self.student} – T{self.term.term_number}: avg {self.average_score} ({self.grade})"

    @property
    def pass_rate(self) -> float:
        return (self.subjects_passed / self.total_subjects * 100) if self.total_subjects else 0


# ──────────────────────────────────────────────────────
#  7. AnnualResult  (per student, per session/year)
# ──────────────────────────────────────────────────────


class AnnualResult(models.Model):
    """Aggregated annual result for a student."""
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='annual_results')
    session = models.ForeignKey('academic.Session', on_delete=models.CASCADE, related_name='annual_results')
    school_class = models.ForeignKey('curriculum.SchoolClass', on_delete=models.CASCADE, related_name='annual_results', null=True, blank=True)
    annual_average = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    annual_gpa = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    grade = models.CharField(max_length=5, blank=True)
    grade_remark = models.CharField(max_length=255, blank=True)
    position = models.PositiveIntegerField(null=True, blank=True)
    class_size = models.PositiveIntegerField(default=0)
    total_subjects = models.PositiveIntegerField(default=0)
    subjects_passed = models.PositiveIntegerField(default=0)
    subjects_failed = models.PositiveIntegerField(default=0)
    promoted = models.BooleanField(default=True, help_text='Has the student been promoted to the next class?')
    status = models.CharField(max_length=20, choices=WORKFLOW_STATUS, default='draft')
    published_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'session']
        ordering = ['session', 'position', 'student']

    def __str__(self) -> str:
        return f"{self.student} – {self.session}: avg {self.annual_average} ({self.grade})"


# ──────────────────────────────────────────────────────
#  8. Student Rank
# ──────────────────────────────────────────────────────


class StudentRank(models.Model):
    """Ranking record for a student in a specific scope and period."""
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='student_ranks')
    term = models.ForeignKey('academic.Term', on_delete=models.CASCADE, related_name='student_ranks')
    subject = models.ForeignKey(
        'curriculum.Subject', on_delete=models.CASCADE, null=True, blank=True, related_name='student_ranks')
    school_class = models.ForeignKey('curriculum.SchoolClass', on_delete=models.CASCADE, related_name='student_ranks')
    rank_type = models.CharField(max_length=20, choices=RANK_TYPE)
    rank = models.PositiveIntegerField()
    total_students = models.PositiveIntegerField()
    tied_with = models.JSONField(default=list, blank=True, help_text='List of student IDs this rank is shared with')
    score = models.DecimalField(max_digits=6, decimal_places=2, default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['student', 'term', 'subject', 'rank_type']
        indexes = [
            models.Index(fields=['term', 'rank_type', 'rank'], name='idx_rank_type'),
        ]

    def __str__(self) -> str:
        label = self.subject or 'Overall'
        return f"{self.student} – {label}: #{self.rank}/{self.total_students}"


# ──────────────────────────────────────────────────────
#  9. Result Publication
# ──────────────────────────────────────────────────────


class ResultPublication(models.Model):
    """Records a publication event — which term/scope was published."""
    session = models.ForeignKey('academic.Session', on_delete=models.CASCADE, related_name='result_publications')
    term = models.ForeignKey('academic.Term', on_delete=models.CASCADE, related_name='result_publications')
    school_class = models.ForeignKey('curriculum.SchoolClass', on_delete=models.CASCADE, related_name='result_publications')
    published_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='result_publications')
    published_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=[
        ('published', 'Published'),
        ('unpublished', 'Unpublished'),
    ], default='published')
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-published_at']

    def __str__(self) -> str:
        return f"{self.school_class} – {self.term} ({self.status})"


# ──────────────────────────────────────────────────────
#  10. Result Approval  (workflow audit)
# ──────────────────────────────────────────────────────


class ResultApproval(models.Model):
    """One step in the approval workflow for a SubjectResult."""
    subject_result = models.ForeignKey(SubjectResult, on_delete=models.CASCADE, related_name='approval_actions')
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='result_actions')
    action = models.CharField(max_length=20, choices=APPROVAL_ACTION)
    comment = models.TextField(blank=True)
    previous_status = models.CharField(max_length=20)
    new_status = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f"{self.action} by {self.actor} on {self.subject_result}"


# ──────────────────────────────────────────────────────
#  11. Report Card
# ──────────────────────────────────────────────────────


class ReportCard(models.Model):
    """Generated report card for a student+term."""
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='report_cards')
    term = models.ForeignKey('academic.Term', on_delete=models.CASCADE, related_name='report_cards')
    session = models.ForeignKey('academic.Session', on_delete=models.CASCADE, related_name='report_cards')
    school_class = models.ForeignKey('curriculum.SchoolClass', on_delete=models.CASCADE, related_name='report_cards')
    term_result = models.OneToOneField(TermResult, on_delete=models.CASCADE, related_name='report_card')
    generated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='generated_report_cards')
    generated_at = models.DateTimeField(auto_now_add=True)
    pdf_file = models.FileField(upload_to='report_cards/', blank=True)
    qr_code = models.ImageField(upload_to='report_cards/qr/', blank=True)
    teacher_comment = models.TextField(blank=True)
    principal_comment = models.TextField(blank=True)
    attendance_total_days = models.PositiveIntegerField(default=0)
    attendance_present = models.PositiveIntegerField(default=0)
    attendance_absent = models.PositiveIntegerField(default=0)
    attendance_late = models.PositiveIntegerField(default=0)
    attendance_excused = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ['student', 'term']
        ordering = ['-generated_at']

    def __str__(self) -> str:
        return f"Report Card: {self.student} – {self.term}"

    @property
    def attendance_rate(self) -> float:
        if self.attendance_total_days == 0:
            return 0
        return self.attendance_present / self.attendance_total_days * 100


# ──────────────────────────────────────────────────────
#  12. Result Audit Log
# ──────────────────────────────────────────────────────


class ResultAuditLog(models.Model):
    """Immutable audit trail for any result mutation."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='result_audit_logs')
    action = models.CharField(max_length=50)
    model_name = models.CharField(max_length=50, choices=AUDIT_MODEL)
    object_id = models.CharField(max_length=100)
    previous_data = models.JSONField(default=dict, blank=True)
    new_data = models.JSONField(default=dict, blank=True)
    reason = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['model_name', 'object_id'], name='idx_audit_model_obj'),
            models.Index(fields=['actor'], name='idx_audit_actor'),
        ]

    def __str__(self) -> str:
        return f"{self.actor} – {self.action} – {self.model_name}#{self.object_id}"


# ──────────────────────────────────────────────────────
#  Legacy stubs (Exam, ExamResult, templates, etc.)
#  Kept for backward compat with legacy views/exports.
# ──────────────────────────────────────────────────────


class Exam(models.Model):
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='exams')
    subject = models.ForeignKey('curriculum.Subject', on_delete=models.CASCADE, related_name='exams')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_exams')
    title = models.CharField(max_length=200)
    exam_date = models.DateField()
    description = models.TextField(blank=True)
    total_marks = models.DecimalField(max_digits=6, decimal_places=2, default=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-exam_date']

    def __str__(self):
        return self.title

    @property
    def results(self):
        return ExamResult.objects.filter(exam=self)


class ExamResult(models.Model):
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='exam_results')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='exam_results')
    score = models.DecimalField(max_digits=6, decimal_places=2)
    grade = models.CharField(max_length=5, blank=True)
    remarks = models.TextField(blank=True)
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['exam', 'student']
        ordering = ['-recorded_at']

    def __str__(self):
        return f"{self.student} – {self.exam}"


class ResultTemplate(models.Model):
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='result_templates')
    school_class = models.ForeignKey('curriculum.SchoolClass', on_delete=models.CASCADE, related_name='result_templates')
    name = models.CharField(max_length=200)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_result_templates')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class ResultTemplateItem(models.Model):
    template = models.ForeignKey(ResultTemplate, on_delete=models.CASCADE, related_name='items')
    component_type = models.CharField(max_length=20, choices=COMPONENT_TYPES)
    name = models.CharField(max_length=200)
    weight = models.DecimalField(max_digits=5, decimal_places=2, help_text='Percentage weight')
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.name} ({self.weight}%)"


class ResultComponent(models.Model):
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='result_components')
    subject = models.ForeignKey('curriculum.Subject', on_delete=models.CASCADE, related_name='result_components')
    term = models.ForeignKey('academic.Term', on_delete=models.CASCADE, related_name='result_components')
    school_class = models.ForeignKey('curriculum.SchoolClass', on_delete=models.CASCADE, related_name='result_components')
    template_item = models.ForeignKey(ResultTemplateItem, on_delete=models.SET_NULL, null=True, blank=True, related_name='components')
    component_type = models.CharField(max_length=20, choices=COMPONENT_TYPES)
    name = models.CharField(max_length=200)
    max_score = models.DecimalField(max_digits=6, decimal_places=2, default=100)
    weight = models.DecimalField(max_digits=5, decimal_places=2)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_result_components')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.component_type})"


class StudentResult(models.Model):
    component = models.ForeignKey(ResultComponent, on_delete=models.CASCADE, related_name='scores')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='student_results')
    score = models.DecimalField(max_digits=6, decimal_places=2)
    remarks = models.TextField(blank=True)
    entered_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='entered_student_results')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['component', 'student']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.student} – {self.component}"
