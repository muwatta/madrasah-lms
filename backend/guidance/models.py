import uuid
from django.db import models
from config.validators import validate_tutor_file
from users.models import User, Madrasah
from curriculum.models import Subject


class CareerRecommendation(models.Model):
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='career_recommendations')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='career_recommendations')
    recommendations = models.JSONField(default=list)
    recommended_universities = models.JSONField(default=list)
    recommended_courses = models.JSONField(default=list)
    generated_at = models.DateTimeField(auto_now_add=True)
    is_current = models.BooleanField(default=True)

    def __str__(self):
        return self.student.get_full_name()

    class Meta:
        ordering = ['-generated_at']


class AITutorSession(models.Model):
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='ai_tutor_sessions')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_tutor_sessions')
    subject = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True, blank=True, related_name='ai_tutor_sessions')
    session_id = models.UUIDField(default=uuid.uuid4, editable=False, db_index=True)
    question = models.TextField()
    response = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.question[:50]

    class Meta:
        ordering = ['-created_at']


class SessionAttachment(models.Model):
    session = models.ForeignKey(AITutorSession, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='tutor_attachments/', validators=[validate_tutor_file])
    filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=100)
    file_size = models.PositiveIntegerField()
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.filename
