from django.contrib import admin
from .models import Subject, Topic, Enrollment, SchoolClass


@admin.register(SchoolClass)
class SchoolClassAdmin(admin.ModelAdmin):
    list_display = ['name_ar', 'name_en', 'madrasah', 'order']
    list_filter = ['madrasah']
    search_fields = ['name_ar', 'name_en']


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ['name_ar', 'name_en', 'code', 'madrasah', 'created_at']
    list_filter = ['madrasah']
    search_fields = ['name_ar', 'name_en']


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ['name', 'subject', 'surah_number', 'created_at']
    list_filter = ['subject']
    search_fields = ['name']


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ['student', 'subject', 'school_class', 'ustaadh', 'madrasah', 'enrolled_at']
    list_filter = ['subject', 'school_class', 'madrasah']
    search_fields = ['student__first_name', 'student__last_name']
