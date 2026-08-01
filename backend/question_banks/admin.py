from django.contrib import admin
from .models import QuestionBank, GapAnalysis


@admin.register(QuestionBank)
class QuestionBankAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'subject', 'school_class', 'session', 'term', 'status', 'question_count', 'created_by']
    list_filter = ['status', 'session', 'term']
    raw_id_fields = ['madrasah', 'created_by', 'subject', 'school_class', 'session', 'term', 'converted_quiz']


@admin.register(GapAnalysis)
class GapAnalysisAdmin(admin.ModelAdmin):
    list_display = ['id', 'bank', 'student', 'attempt', 'created_at']
    raw_id_fields = ['bank', 'student', 'attempt']
