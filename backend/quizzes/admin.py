from django.contrib import admin
from .models import Question, Quiz, QuizQuestion, QuizAssignment, QuizAttempt, QuizAnswer, ViolationLog


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['id', 'question_type', 'difficulty', 'marks', 'subject', 'created_by', 'is_active']
    list_filter = ['question_type', 'difficulty', 'is_active', 'subject']
    search_fields = ['question_text', 'question_text_ar']
    raw_id_fields = ['subject', 'topic', 'school_class', 'created_by']


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'subject', 'school_class', 'status', 'is_published', 'grading_mode', 'created_by']
    list_filter = ['status', 'is_published', 'grading_mode', 'subject', 'school_class']
    search_fields = ['title', 'description']
    raw_id_fields = ['subject', 'school_class', 'session', 'term', 'created_by']


@admin.register(QuizQuestion)
class QuizQuestionAdmin(admin.ModelAdmin):
    list_display = ['id', 'quiz', 'question', 'sort_order', 'marks']
    raw_id_fields = ['quiz', 'question']


@admin.register(QuizAssignment)
class QuizAssignmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'quiz', 'school_class', 'assigned_to_all']
    raw_id_fields = ['quiz', 'school_class']


@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ['id', 'quiz', 'student', 'attempt_number', 'status', 'percentage', 'is_pass', 'started_at']
    list_filter = ['status', 'is_pass']
    search_fields = ['student__first_name', 'student__last_name', 'quiz__title']
    raw_id_fields = ['quiz', 'student']


@admin.register(QuizAnswer)
class QuizAnswerAdmin(admin.ModelAdmin):
    list_display = ['id', 'attempt', 'question', 'selected_answer', 'is_correct', 'marks_awarded']
    list_filter = ['is_correct']
    raw_id_fields = ['attempt', 'question']


@admin.register(ViolationLog)
class ViolationLogAdmin(admin.ModelAdmin):
    list_display = ['id', 'attempt', 'violation_type', 'timestamp']
    list_filter = ['violation_type']
    raw_id_fields = ['attempt']
