import json
from django.db import models
from users.models import User, Madrasah
from curriculum.models import Subject, Topic


class Question(models.Model):
    QUESTION_TYPE_CHOICES = [
        ('mcq', 'Multiple Choice'),
        ('fill_blank', 'Fill in the Blank'),
        ('short_answer', 'Short Answer'),
        ('essay', 'Essay'),
    ]

    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]

    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='questions')
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPE_CHOICES)
    options = models.JSONField(null=True, blank=True)
    correct_answer = models.TextField(blank=True)
    explanation = models.TextField(blank=True)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='medium')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_questions')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.question_text[:50]}... ({self.get_question_type_display()})"

    class Meta:
        ordering = ['-created_at']


class Quiz(models.Model):
    QUIZ_TYPE_CHOICES = [
        ('practice', 'Practice'),
        ('assignment', 'Assignment'),
        ('test', 'Test'),
    ]

    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='quizzes')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='quizzes')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_quizzes')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    question_ids = models.JSONField(default=list, help_text='List of question IDs')
    quiz_type = models.CharField(max_length=20, choices=QUIZ_TYPE_CHOICES, default='practice')
    time_limit_minutes = models.IntegerField(null=True, blank=True)
    passing_score = models.DecimalField(max_digits=5, decimal_places=2, default=60.00)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    @property
    def question_count(self):
        return len(self.question_ids)

    @property
    def attempt_count(self):
        return self.attempts.count()

    @property
    def average_score(self):
        attempts = self.attempts.filter(score__isnull=False)
        if not attempts.exists():
            return 0
        return round(attempts.aggregate(models.Avg('percentage'))['percentage__avg'], 1)

    class Meta:
        ordering = ['-created_at']


class QuizAttempt(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quiz_attempts')
    answers = models.JSONField(default=dict)
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    attempt_number = models.IntegerField(default=1)
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.student.get_full_name()} - {self.quiz.title} ({self.percentage}%)"

    class Meta:
        ordering = ['-started_at']
        unique_together = ['quiz', 'student', 'attempt_number']
        indexes = [
            models.Index(fields=['student', 'submitted_at'], name='idx_qa_student_submitted'),
        ]
