from django.db import models
from users.models import User, Madrasah
from django.conf import settings


class FeeStructure(models.Model):
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='fee_structures')
    name = models.CharField(max_length=255)
    name_ar = models.CharField(max_length=255, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} - {self.amount}"


class Fee(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('partial', 'Partial'),
        ('waived', 'Waived'),
    ]

    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='fees')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='fees')
    fee_structure = models.ForeignKey(FeeStructure, on_delete=models.SET_NULL, null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    due_date = models.DateField()
    description = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-due_date']

    def __str__(self):
        return f"{self.student.get_full_name()} - {self.amount}"

    @property
    def balance(self):
        return self.amount - self.amount_paid


class FeePayment(models.Model):
    METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('bank_transfer', 'Bank Transfer'),
        ('mobile_money', 'Mobile Money'),
        ('card', 'Card'),
        ('check', 'Check'),
        ('online', 'Online'),
        ('other', 'Other'),
    ]

    fee = models.ForeignKey(Fee, on_delete=models.CASCADE, related_name='payments')
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateField(auto_now_add=True)
    payment_method = models.CharField(max_length=20, choices=METHOD_CHOICES, default='cash')
    transaction_id = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='recorded_payments')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-payment_date']

    def __str__(self):
        return f"Payment {self.amount_paid} for {self.fee}"


class Attendance(models.Model):
    STATUS_CHOICES = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('late', 'Late'),
        ('excused', 'Excused'),
    ]

    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='attendances')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attendances')
    date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='present')
    marked_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='marked_attendances')
    notes = models.TextField(blank=True)
    marked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']
        unique_together = ['student', 'date', 'madrasah']

    def __str__(self):
        return f"{self.student.get_full_name()} - {self.date} - {self.status}"


class AttendanceQRScan(models.Model):
    METHOD_CHOICES = [
        ('qr_code', 'QR Code'),
        ('rfid', 'RFID'),
        ('manual', 'Manual'),
    ]

    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='qr_scans')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='qr_scans')
    school_class = models.ForeignKey('curriculum.SchoolClass', on_delete=models.SET_NULL, null=True, blank=True, related_name='qr_scans')
    scanned_at = models.DateTimeField(auto_now_add=True)
    scanner_location = models.CharField(max_length=100, blank=True)
    method = models.CharField(max_length=20, choices=METHOD_CHOICES, default='qr_code')
    qr_data = models.TextField(blank=True)
    attendance = models.ForeignKey(Attendance, on_delete=models.SET_NULL, null=True, blank=True, related_name='qr_scans')

    class Meta:
        ordering = ['-scanned_at']

    def __str__(self):
        return f"{self.student.get_full_name()} - {self.scanned_at} ({self.method})"


class Announcement(models.Model):
    AUDIENCE_CHOICES = [
        ('all', 'All'),
        ('parents', 'Parents'),
        ('teachers', 'Teachers'),
        ('students', 'Students'),
    ]

    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='announcements')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='announcements')
    title = models.CharField(max_length=255)
    title_ar = models.CharField(max_length=255, blank=True)
    message = models.TextField()
    audience = models.CharField(max_length=20, choices=AUDIENCE_CHOICES, default='all')
    is_pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_pinned', '-created_at']

    def __str__(self):
        return self.title


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('attendance_absent', 'Attendance Absent'),
        ('attendance_late', 'Attendance Late'),
        ('announcement', 'Announcement'),
        ('fee_overdue', 'Fee Overdue'),
        ('quiz_graded', 'Quiz Graded'),
        ('exam_result', 'Exam Result'),
        ('new_message', 'New Message'),
    ]

    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='notifications')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField(blank=True)
    link = models.CharField(max_length=255, blank=True, help_text='Frontend URL to navigate to')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} -> {self.recipient}"
