from django.db import models
from users.models import User, Madrasah


class Exam(models.Model):
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='exams')
    subject = models.ForeignKey('curriculum.Subject', on_delete=models.CASCADE, related_name='exams')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_exams')
    title = models.CharField(max_length=255)
    exam_date = models.DateField()
    description = models.TextField(blank=True)
    total_marks = models.DecimalField(max_digits=5, decimal_places=2, default=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-exam_date']


class ExamResult(models.Model):
    GRADE_CHOICES = [
        ('A', 'A'),
        ('B', 'B'),
        ('C', 'C'),
        ('D', 'D'),
        ('F', 'F'),
    ]

    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='results')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='exam_results')
    score = models.DecimalField(max_digits=5, decimal_places=2)
    grade = models.CharField(max_length=5, choices=GRADE_CHOICES)
    remarks = models.TextField(blank=True)
    recorded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.get_full_name()} - {self.exam.title}: {self.grade}"

    class Meta:
        ordering = ['-recorded_at']
        unique_together = ['exam', 'student']

    @staticmethod
    def calculate_grade(score, total_marks=100):
        percentage = (score / total_marks) * 100
        if percentage >= 90:
            return 'A'
        elif percentage >= 80:
            return 'B'
        elif percentage >= 70:
            return 'C'
        elif percentage >= 60:
            return 'D'
        else:
            return 'F'
