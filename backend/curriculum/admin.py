from django.contrib import admin
from .models import Subject, Topic, Enrollment


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'level', 'madrasah', 'created_at']
    list_filter = ['level', 'madrasah']
    search_fields = ['name']


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ['name', 'subject', 'surah_number', 'created_at']
    list_filter = ['subject']
    search_fields = ['name']


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ['student', 'subject', 'ustaadh', 'madrasah', 'enrolled_at']
    list_filter = ['subject', 'madrasah']
    search_fields = ['student__first_name', 'student__last_name']
