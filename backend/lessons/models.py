from django.db import models
from users.models import User, Madrasah
from curriculum.models import Subject, SchoolClass
from academic.models import ClassArm, Term


class LessonPlan(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='lesson_plans')
    teacher = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='lesson_plans',
        limit_choices_to={'role': 'ustaadh'},
    )
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='lesson_plans')
    school_class = models.ForeignKey(SchoolClass, on_delete=models.CASCADE, related_name='lesson_plans')
    class_arm = models.ForeignKey(ClassArm, on_delete=models.SET_NULL, null=True, blank=True, related_name='lesson_plans')
    term = models.ForeignKey(Term, on_delete=models.SET_NULL, null=True, blank=True, related_name='lesson_plans')
    title = models.CharField(max_length=200)
    lesson_date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    objectives = models.TextField()
    resources = models.TextField(blank=True)
    homework = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    attachments = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    approved_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='approved_lesson_plans',
        limit_choices_to={'role': 'mudeer'},
    )
    approval_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-lesson_date', 'start_time']
        unique_together = ['madrasah', 'teacher', 'lesson_date', 'start_time']

    def __str__(self):
        return self.title


class Homework(models.Model):
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='homeworks')
    lesson_plan = models.ForeignKey(LessonPlan, on_delete=models.SET_NULL, null=True, blank=True, related_name='homeworks')
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='homeworks')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='homeworks')
    school_class = models.ForeignKey(SchoolClass, on_delete=models.CASCADE, related_name='homeworks')
    title = models.CharField(max_length=200)
    description = models.TextField()
    due_date = models.DateTimeField()
    total_marks = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    attachments = models.JSONField(default=list, blank=True)
    is_published = models.BooleanField(default=False)
    late_submission_allowed = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-due_date']

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
        User, on_delete=models.CASCADE, related_name='homework_submissions',
        limit_choices_to={'role': 'student'},
    )
    submitted_at = models.DateTimeField(auto_now_add=True)
    content = models.TextField(blank=True)
    attachments = models.JSONField(default=list, blank=True)
    is_late = models.BooleanField(default=False)
    score = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    feedback = models.TextField(blank=True)
    graded_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='graded_submissions',
    )
    graded_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='submitted')

    class Meta:
        unique_together = ['homework', 'student']
        ordering = ['-submitted_at']

    def __str__(self):
        return f"{self.student.get_full_name()} - {self.homework}"
