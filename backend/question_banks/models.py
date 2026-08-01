from django.db import models
from django.conf import settings
from users.models import User, Madrasah
from curriculum.models import Subject, SchoolClass
from academic.models import Session, Term


class QuestionBank(models.Model):
    STATUS_CHOICES = [
        ('processing', 'Processing'),
        ('ready', 'Ready'),
        ('failed', 'Failed'),
    ]

    FILE_TYPE_CHOICES = [
        ('docx', 'Word Document'),
        ('pdf', 'PDF'),
    ]

    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='question_banks')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name='created_question_banks')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='question_banks')
    school_class = models.ForeignKey(SchoolClass, on_delete=models.CASCADE, related_name='question_banks')
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='question_banks')
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name='question_banks')

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')

    file = models.FileField(upload_to='question_banks/%Y/%m/')
    file_type = models.CharField(max_length=10, choices=FILE_TYPE_CHOICES)
    original_size = models.PositiveBigIntegerField(default=0, help_text='Size of the original uploaded file in bytes')
    stored_size = models.PositiveBigIntegerField(default=0, help_text='Size of the archived file in bytes')

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='processing')
    error_message = models.TextField(blank=True, default='')

    converted_quiz = models.ForeignKey(
        'quizzes.Quiz', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='source_banks')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['madrasah', 'subject', 'school_class', 'term'],
                name='unique_bank_per_term'),
        ]

    def __str__(self):
        return f"{self.title} ({self.session.name} - {self.term.name})"

    @property
    def questions(self):
        return self.bank_questions.all()

    @property
    def question_count(self):
        return self.bank_questions.count()


class GapAnalysis(models.Model):
    bank = models.ForeignKey(QuestionBank, on_delete=models.CASCADE, related_name='gap_analyses')
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='gap_analyses')
    attempt = models.ForeignKey(
        'quizzes.QuizAttempt', on_delete=models.CASCADE, null=True, blank=True,
        related_name='gap_analyses')
    content = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['bank', 'student', 'attempt']

    def __str__(self):
        return f"Gap analysis {self.bank_id} - {self.student_id}"
