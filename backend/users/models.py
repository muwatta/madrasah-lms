from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class Madrasah(models.Model):
    name = models.CharField(max_length=255)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")

        email = self.normalize_email(email)

        madrasah = extra_fields.get("madrasah")
        if isinstance(madrasah, int) or (isinstance(madrasah, str) and madrasah.isdigit()):
            extra_fields["madrasah"] = Madrasah.objects.get(pk=madrasah)

        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'mudeer')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('ustaadh', 'Ustaadh (Teacher)'),
        ('mudeer', 'Mudeer (Administrator)'),
        ('idaarah', 'Idaarah (Board)'),
        ('student', 'Student'),
        ('parent', 'Parent'),
    ]

    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES)
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='users')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    date_of_birth = models.DateField(null=True, blank=True)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'role', 'madrasah']

    def __str__(self):
        return f"{self.get_full_name()} ({self.get_role_display()})"

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    class Meta:
        ordering = ['-date_joined']
        indexes = [
            models.Index(fields=['madrasah', 'role', 'is_active'], name='idx_user_m_role_active'),
        ]


class StudentParent(models.Model):
    RELATIONSHIP_CHOICES = [
        ('father', 'Father'),
        ('mother', 'Mother'),
        ('guardian', 'Guardian'),
    ]

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='parent_links')
    parent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='student_links')
    relationship = models.CharField(max_length=50, choices=RELATIONSHIP_CHOICES)

    class Meta:
        unique_together = ['student', 'parent']

    def __str__(self):
        return f"{self.parent.get_full_name()} - {self.student.get_full_name()} ({self.relationship})"


class Message(models.Model):
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    subject = models.CharField(max_length=255)
    body = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.sender.get_full_name()} → {self.recipient.get_full_name()}: {self.subject}"
