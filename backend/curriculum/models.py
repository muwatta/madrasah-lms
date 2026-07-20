from django.db import models
from users.models import User, Madrasah


class SchoolClass(models.Model):
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='school_classes')
    name_ar = models.CharField(max_length=100)
    name_en = models.CharField(max_length=100)
    order = models.PositiveSmallIntegerField()

    class Meta:
        ordering = ['order']
        unique_together = ['madrasah', 'name_ar']

    def __str__(self):
        return self.name_ar


class Subject(models.Model):
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='subjects')
    name_ar = models.CharField(max_length=100)
    name_en = models.CharField(max_length=100)
    code = models.CharField(max_length=20, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name_ar

    class Meta:
        ordering = ['name_ar']
        unique_together = ['madrasah', 'name_ar']


class Topic(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='topics')
    name = models.CharField(max_length=255)
    surah_number = models.IntegerField(null=True, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


class Enrollment(models.Model):
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='enrollments')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollments')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='enrollments')
    school_class = models.ForeignKey(SchoolClass, on_delete=models.SET_NULL, null=True, blank=True, related_name='enrollments')
    ustaadh = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='teaching_enrollments')
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['student', 'subject']
        indexes = [
            models.Index(fields=['madrasah', 'student'], name='idx_enr_m_student'),
        ]

    def __str__(self):
        return f"{self.student.get_full_name()} - {self.subject.name_ar}"
