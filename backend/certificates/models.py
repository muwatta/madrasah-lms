import uuid
from django.db import models
from django.conf import settings


class Certificate(models.Model):
    class CertificateType(models.TextChoices):
        SUBJECT_COMPLETION = 'subject_completion', 'Subject Completion'
        ACADEMIC_EXCELLENCE = 'academic_excellence', 'Academic Excellence'
        QURAN_MEMORIZATION = 'quran_memorization', 'Quran Memorization'
        LEARNING_PATH = 'learning_path', 'Learning Path'
        ACHIEVEMENT = 'achievement', 'Achievement'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    madrasah = models.ForeignKey('users.Madrasah', on_delete=models.CASCADE, related_name='certificates')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='certificates')
    certificate_type = models.CharField(max_length=30, choices=CertificateType.choices)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    file = models.FileField(upload_to='certificates/', blank=True)
    certificate_number = models.CharField(max_length=50, unique=True, blank=True)
    issued_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-issued_at']

    def save(self, *args, **kwargs):
        if not self.certificate_number:
            short_id = str(self.id)[:8].upper()
            self.certificate_number = f'CERT-{short_id}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.certificate_number} - {self.title}'
