from django.contrib import admin
from .models import (
    SchemeOfWork, SchemeWeek, LearningObjective, LessonPlan,
    LessonResource, LessonDelivery, LessonReflection, LessonAuditLog,
    Homework, HomeworkSubmission, LessonAnalyticsSnapshot,
)


class SchemeWeekInline(admin.TabularInline):
    model = SchemeWeek
    extra = 0


@admin.register(SchemeOfWork)
class SchemeOfWorkAdmin(admin.ModelAdmin):
    list_display = ('title', 'teacher', 'subject', 'school_class', 'term', 'is_active', 'created_at')
    list_filter = ('is_active', 'term', 'subject')
    search_fields = ('title', 'teacher__first_name', 'teacher__last_name')
    inlines = [SchemeWeekInline]


@admin.register(LessonPlan)
class LessonPlanAdmin(admin.ModelAdmin):
    list_display = ('title', 'teacher', 'subject', 'school_class', 'lesson_date', 'status', 'ai_generated')
    list_filter = ('status', 'subject', 'ai_generated')
    search_fields = ('title', 'teacher__first_name', 'teacher__last_name')
    readonly_fields = ('uuid', 'created_at', 'updated_at')


@admin.register(LessonResource)
class LessonResourceAdmin(admin.ModelAdmin):
    list_display = ('title', 'lesson', 'resource_type', 'order')
    list_filter = ('resource_type',)


@admin.register(LessonDelivery)
class LessonDeliveryAdmin(admin.ModelAdmin):
    list_display = ('lesson', 'delivery_date', 'delivery_status', 'students_present', 'total_students')
    list_filter = ('delivery_status',)


@admin.register(LessonReflection)
class LessonReflectionAdmin(admin.ModelAdmin):
    list_display = ('lesson', 'teacher', 'self_rating', 'created_at')
    list_filter = ('self_rating',)


@admin.register(LessonAuditLog)
class LessonAuditLogAdmin(admin.ModelAdmin):
    list_display = ('actor', 'action', 'model_name', 'object_id', 'created_at')
    list_filter = ('action', 'model_name')
    readonly_fields = ('id', 'actor', 'action', 'model_name', 'object_id',
                       'previous_data', 'new_data', 'reason', 'ip_address', 'created_at')


@admin.register(Homework)
class HomeworkAdmin(admin.ModelAdmin):
    list_display = ('title', 'teacher', 'subject', 'school_class', 'due_date', 'is_published')
    list_filter = ('is_published', 'subject')


@admin.register(HomeworkSubmission)
class HomeworkSubmissionAdmin(admin.ModelAdmin):
    list_display = ('homework', 'student', 'score', 'status', 'submitted_at')
    list_filter = ('status',)


@admin.register(LearningObjective)
class LearningObjectiveAdmin(admin.ModelAdmin):
    list_display = ('objective', 'subject')
    search_fields = ('objective',)


@admin.register(LessonAnalyticsSnapshot)
class LessonAnalyticsSnapshotAdmin(admin.ModelAdmin):
    list_display = ('teacher', 'subject', 'school_class', 'term',
                    'total_planned', 'total_delivered', 'completion_rate')
