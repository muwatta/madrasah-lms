import uuid
from django.db import models
from django.conf import settings


class AuditLog(models.Model):
    """Immutable, centralized audit trail for all model mutations across the system."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    madrasah = models.ForeignKey(
        'users.Madrasah', on_delete=models.SET_NULL, null=True, related_name='audit_logs')

    # Who
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='audit_logs')

    # What
    action = models.CharField(max_length=50, choices=[
        ('created', 'Created'),
        ('updated', 'Updated'),
        ('deleted', 'Deleted'),
        ('status_changed', 'Status Changed'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('published', 'Published'),
        ('submitted', 'Submitted'),
        ('graded', 'Graded'),
        ('enrolled', 'Enrolled'),
        ('payment_made', 'Payment Made'),
        ('login', 'Login'),
        ('password_change', 'Password Change'),
        ('other', 'Other'),
    ])
    model_name = models.CharField(max_length=100, help_text='app_label.ModelName, e.g. results.SubjectResult')
    object_id = models.CharField(max_length=255)
    object_repr = models.CharField(max_length=300, blank=True, help_text='str() of the object')

    # State change
    previous_data = models.JSONField(default=dict, blank=True)
    new_data = models.JSONField(default=dict, blank=True)

    # Context
    reason = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=300, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['model_name', 'object_id'], name='idx_cal_model_obj'),
            models.Index(fields=['actor'], name='idx_cal_actor'),
            models.Index(fields=['madrasah', 'created_at'], name='idx_cal_m_date'),
            models.Index(fields=['action'], name='idx_cal_action'),
        ]

    def __str__(self):
        return f"[{self.action}] {self.model_name}#{self.object_id} by {self.actor}"
