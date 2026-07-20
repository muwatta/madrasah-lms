from django.db import models
from users.models import User, Madrasah
from config.validators import validate_audio


class MemorizationTracker(models.Model):
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='memorizations')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='memorizations')
    surah_number = models.IntegerField()
    surah_name = models.CharField(max_length=100)
    ayah_start = models.IntegerField()
    ayah_end = models.IntegerField()
    memorization_date = models.DateField()
    score = models.IntegerField()
    notes = models.TextField(blank=True)
    teacher = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='taught_memorizations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-memorization_date', 'surah_number']
        unique_together = ['student', 'surah_number', 'ayah_start']

    def __str__(self):
        return f"{self.student.get_full_name()} - {self.surah_name} {self.ayah_start}-{self.ayah_end}"


class RevisionSchedule(models.Model):
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='revision_schedules')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='revision_schedules')
    surah_number = models.IntegerField()
    surah_name = models.CharField(max_length=100)
    ayah_start = models.IntegerField()
    ayah_end = models.IntegerField()
    revision_date = models.DateField()
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    score = models.IntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['revision_date', 'surah_number']

    def __str__(self):
        return f"{self.student.get_full_name()} - Revise {self.surah_name} {self.ayah_start}-{self.ayah_end}"


class TajwidAssessment(models.Model):
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='tajwid_assessments')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tajwid_assessments')
    teacher = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='given_tajwid_assessments')
    assessment_date = models.DateField()
    surah_number = models.IntegerField()
    surah_name = models.CharField(max_length=100)
    ayah_range = models.CharField(max_length=100)
    makharij_score = models.IntegerField(null=True, blank=True)
    sifaat_score = models.IntegerField(null=True, blank=True)
    ghunna_score = models.IntegerField(null=True, blank=True)
    madd_score = models.IntegerField(null=True, blank=True)
    waqf_score = models.IntegerField(null=True, blank=True)
    overall_score = models.IntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    audio_submission = models.FileField(upload_to='quran/tajwid/', null=True, blank=True, validators=[validate_audio])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-assessment_date']

    def __str__(self):
        return f"{self.student.get_full_name()} - {self.surah_name} {self.ayah_range}"


class PrayerTimetable(models.Model):
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='prayer_timetables')
    date = models.DateField()
    fajr = models.TimeField()
    sunrise = models.TimeField()
    dhuhr = models.TimeField()
    asr = models.TimeField()
    maghrib = models.TimeField()
    isha = models.TimeField()
    jumuah_khutbah = models.TimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['madrasah', 'date']
        ordering = ['date']

    def __str__(self):
        return f"{self.date} - {self.madrasah}"
