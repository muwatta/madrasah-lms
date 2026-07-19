from django.contrib import admin
from .models import Question, Quiz, QuizAttempt


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['question_text', 'question_type', 'difficulty', 'topic', 'created_at']
    list_filter = ['question_type', 'difficulty', 'topic']
    search_fields = ['question_text']


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ['title', 'subject', 'quiz_type', 'is_published', 'created_at']
    list_filter = ['quiz_type', 'is_published', 'subject']
    search_fields = ['title']


@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ['student', 'quiz', 'score', 'percentage', 'submitted_at']
    list_filter = ['quiz']
    search_fields = ['student__first_name', 'student__last_name']
