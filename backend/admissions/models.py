from django.db import models, transaction
from django.utils import timezone
from users.models import Madrasah
from curriculum.models import SchoolClass
from config.validators import validate_document


class Application(models.Model):
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('reviewed', 'Reviewed'),
        ('interview_scheduled', 'Interview Scheduled'),
        ('interviewed', 'Interviewed'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('enrolled', 'Enrolled'),
    ]

    id = models.AutoField(primary_key=True)
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='applications')
    application_number = models.CharField(max_length=20, unique=True, editable=False)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    address = models.TextField()
    previous_school = models.CharField(max_length=200, blank=True)
    applying_for_class = models.ForeignKey(
        SchoolClass, on_delete=models.SET_NULL, null=True, blank=True, related_name='applications'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    interview_date = models.DateTimeField(null=True, blank=True)
    interview_notes = models.TextField(blank=True)
    entrance_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    entrance_result = models.JSONField(default=dict, blank=True)
    accepted_at = models.DateTimeField(null=True)
    enrolled_at = models.DateTimeField(null=True)
    rejected_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['madrasah', 'status'], name='idx_app_m_status'),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    def save(self, *args, **kwargs):
        if not self.application_number:
            with transaction.atomic():
                year = timezone.now().year
                last = Application.objects.select_for_update().filter(
                    application_number__startswith=f'APP-{year}-'
                ).order_by('-application_number').first()
                if last:
                    num = int(last.application_number.split('-')[-1]) + 1
                else:
                    num = 1
                self.application_number = f'APP-{year}-{num:04d}'
        super().save(*args, **kwargs)


class ApplicationDocument(models.Model):
    DOCUMENT_TYPE_CHOICES = [
        ('birth_certificate', 'Birth Certificate'),
        ('passport_photo', 'Passport Photo'),
        ('previous_report', 'Previous Report'),
        ('transfer_letter', 'Transfer Letter'),
        ('medical_record', 'Medical Record'),
        ('other', 'Other'),
    ]

    id = models.AutoField(primary_key=True)
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPE_CHOICES)
    file = models.FileField(upload_to='applications/documents/', validators=[validate_document])
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.get_document_type_display()
