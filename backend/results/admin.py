from django.contrib import admin
from .models import Exam, ExamResult


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ['title', 'subject', 'exam_date', 'total_marks', 'created_at']
    list_filter = ['subject', 'exam_date']
    search_fields = ['title']


@admin.register(ExamResult)
class ExamResultAdmin(admin.ModelAdmin):
    list_display = ['student', 'exam', 'score', 'grade', 'recorded_at']
    list_filter = ['grade', 'exam']
    search_fields = ['student__first_name', 'student__last_name']
