from django.db import models
from django.conf import settings
from users.models import User, Madrasah
from curriculum.models import SchoolClass, Subject


class Session(models.Model):
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='academic_sessions')
    name = models.CharField(max_length=100)
    hijri_year = models.IntegerField(null=True, blank=True, help_text='e.g. 1446')
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-start_date']
        unique_together = ['madrasah', 'name']

    def __str__(self):
        return self.name


class Term(models.Model):
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='terms')
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='terms')
    name = models.CharField(max_length=100)
    term_number = models.IntegerField()
    start_date = models.DateField()
    end_date = models.DateField()
    hijri_start = models.CharField(max_length=50, blank=True, help_text='e.g. 1 Muharram 1446')
    hijri_end = models.CharField(max_length=50, blank=True, help_text='e.g. 29 Rabi al-Thani 1446')
    is_current = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['term_number']
        unique_together = ['madrasah', 'session', 'name']

    def __str__(self):
        hijri = f" ({self.hijri_start} - {self.hijri_end})" if self.hijri_start else ""
        return f"{self.session.name} - {self.name}{hijri}"


class AcademicCalendar(models.Model):
    EVENT_TYPE_CHOICES = [
        ('holiday', 'Holiday'),
        ('exam', 'Exam'),
        ('event', 'Event'),
        ('deadline', 'Deadline'),
        ('other', 'Other'),
    ]

    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='academic_calendar_events')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    event_type = models.CharField(max_length=20, choices=EVENT_TYPE_CHOICES)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    is_recurring = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['start_date']

    def __str__(self):
        return self.title


class ClassArm(models.Model):
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='class_arms')
    school_class = models.ForeignKey(SchoolClass, on_delete=models.CASCADE, related_name='class_arms')
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        unique_together = ['madrasah', 'school_class', 'name']

    def __str__(self):
        return f"{self.school_class} - {self.name}"


class Timetable(models.Model):
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='timetables')
    name = models.CharField(max_length=200, blank=True)
    school_class = models.ForeignKey(SchoolClass, on_delete=models.CASCADE, related_name='timetables')
    class_arm = models.ForeignKey(ClassArm, on_delete=models.SET_NULL, null=True, blank=True, related_name='timetables')
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name='timetables')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.name:
            arm_part = f" - {self.class_arm.name}" if self.class_arm else ""
            self.name = f"{self.school_class.name_ar}{arm_part} ({self.term})"
        super().save(*args, **kwargs)


DAY_OF_WEEK_CHOICES = [
    (0, 'Monday'),
    (1, 'Tuesday'),
    (2, 'Wednesday'),
    (3, 'Thursday'),
    (4, 'Friday'),
    (5, 'Saturday'),
    (6, 'Sunday'),
]


class TimetableSlot(models.Model):
    timetable = models.ForeignKey(Timetable, on_delete=models.CASCADE, related_name='slots')
    day_of_week = models.IntegerField(choices=DAY_OF_WEEK_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='timetable_slots')
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='timetable_slots',
        limit_choices_to={'role': 'ustaadh'},
    )
    room = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['day_of_week', 'start_time']
        unique_together = ['timetable', 'day_of_week', 'start_time', 'room']

    def __str__(self):
        return f"{self.get_day_of_week_display()} {self.start_time} - {self.subject}"
