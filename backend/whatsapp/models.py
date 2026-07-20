from django.db import models
from django.conf import settings


class WhatsAppRecipient(models.Model):
    LANGUAGE_CHOICES = [
        ('ar', 'Arabic'),
        ('en', 'English'),
    ]

    madrasah = models.ForeignKey('users.Madrasah', on_delete=models.CASCADE, related_name='whatsapp_recipients')
    parent = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='whatsapp_recipients')
    phone_number = models.CharField(max_length=20)
    is_opted_in = models.BooleanField(default=False)
    opted_in_at = models.DateTimeField(null=True, blank=True)
    opted_out_at = models.DateTimeField(null=True, blank=True)
    language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, default='ar')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['madrasah', 'parent']

    def __str__(self):
        return f"{self.parent.get_full_name()} ({self.phone_number})"


class WhatsAppMessage(models.Model):
    MESSAGE_TYPE_CHOICES = [
        ('result', 'Result'),
        ('attendance', 'Attendance'),
        ('fee_reminder', 'Fee Reminder'),
        ('announcement', 'Announcement'),
        ('homework', 'Homework'),
        ('general', 'General'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('read', 'Read'),
        ('failed', 'Failed'),
    ]

    madrasah = models.ForeignKey('users.Madrasah', on_delete=models.CASCADE, related_name='whatsapp_messages')
    recipient = models.ForeignKey(WhatsAppRecipient, on_delete=models.CASCADE, related_name='messages')
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPE_CHOICES)
    template_name = models.CharField(max_length=100, blank=True)
    body = models.TextField()
    media_url = models.URLField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    whatsapp_message_id = models.CharField(max_length=100, blank=True)
    error_message = models.TextField(blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.recipient.parent.get_full_name()} - {self.message_type} ({self.status})"


class WhatsAppTemplate(models.Model):
    MESSAGE_TYPE_CHOICES = [
        ('result', 'Result'),
        ('attendance', 'Attendance'),
        ('fee_reminder', 'Fee Reminder'),
        ('announcement', 'Announcement'),
        ('homework', 'Homework'),
        ('general', 'General'),
    ]

    madrasah = models.ForeignKey('users.Madrasah', on_delete=models.CASCADE, related_name='whatsapp_templates')
    name = models.CharField(max_length=100)
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPE_CHOICES)
    body_ar = models.TextField()
    body_en = models.TextField()
    variables = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['madrasah', 'name']

    def __str__(self):
        return self.name
