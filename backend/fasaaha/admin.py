"""
Fasaaha admin configuration.
"""
from django.contrib import admin

from .models import (
    SpeakingLevel, MissionCategory, Mission, SpeakingAttempt,
    AIAnalysis, TeacherReview, MissionAssignment,
    StudentLevelProgress, StudentStreak, Badge, StudentBadge,
    DialogueSession, DialogueTurn, DailyGoal, LeaderboardEntry,
)


@admin.register(SpeakingLevel)
class SpeakingLevelAdmin(admin.ModelAdmin):
    list_display = ['number', 'name', 'name_ar', 'madrasah', 'difficulty', 'is_active']
    list_filter = ['madrasah', 'is_active', 'difficulty']
    search_fields = ['name', 'name_ar']
    ordering = ['number']


@admin.register(MissionCategory)
class MissionCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'name_ar', 'madrasah', 'icon', 'is_active']
    list_filter = ['madrasah', 'is_active']
    search_fields = ['name', 'name_ar']


@admin.register(Mission)
class MissionAdmin(admin.ModelAdmin):
    list_display = ['title', 'title_ar', 'level', 'category', 'difficulty', 'madrasah', 'is_active']
    list_filter = ['madrasah', 'level', 'category', 'difficulty', 'is_active']
    search_fields = ['title', 'title_ar']
    raw_id_fields = ['level', 'category', 'created_by']


@admin.register(SpeakingAttempt)
class SpeakingAttemptAdmin(admin.ModelAdmin):
    list_display = ['id', 'student', 'mission', 'attempt_number', 'status', 'is_best_attempt', 'created_at']
    list_filter = ['madrasah', 'status', 'is_best_attempt']
    search_fields = ['student__first_name', 'student__last_name']
    raw_id_fields = ['student', 'mission']
    readonly_fields = ['uuid', 'created_at', 'completed_at']


@admin.register(AIAnalysis)
class AIAnalysisAdmin(admin.ModelAdmin):
    list_display = ['attempt', 'overall_score', 'pronunciation_score', 'grammar_score', 'fluency_score', 'created_at']
    list_filter = ['transcription_provider']
    raw_id_fields = ['attempt']
    readonly_fields = ['created_at']


@admin.register(TeacherReview)
class TeacherReviewAdmin(admin.ModelAdmin):
    list_display = ['attempt', 'teacher', 'overall_score', 'is_approved', 'created_at']
    list_filter = ['madrasah', 'is_approved']
    raw_id_fields = ['attempt', 'teacher']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(MissionAssignment)
class MissionAssignmentAdmin(admin.ModelAdmin):
    list_display = ['mission', 'assigned_by', 'target_student', 'target_class', 'due_date', 'is_required']
    list_filter = ['madrasah', 'is_required']
    raw_id_fields = ['mission', 'assigned_by', 'target_student', 'target_class']
    readonly_fields = ['created_at']


@admin.register(StudentLevelProgress)
class StudentLevelProgressAdmin(admin.ModelAdmin):
    list_display = ['student', 'level', 'status', 'missions_attempted', 'missions_completed', 'average_score']
    list_filter = ['madrasah', 'status']
    raw_id_fields = ['student', 'level']
    readonly_fields = ['updated_at']


@admin.register(StudentStreak)
class StudentStreakAdmin(admin.ModelAdmin):
    list_display = ['student', 'current_streak', 'longest_streak', 'last_practice_date', 'total_points']
    list_filter = ['madrasah']
    raw_id_fields = ['student']
    readonly_fields = ['updated_at']


@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ['name', 'name_ar', 'icon', 'category', 'points', 'madrasah', 'is_active']
    list_filter = ['madrasah', 'category', 'is_active']
    search_fields = ['name', 'name_ar']


@admin.register(StudentBadge)
class StudentBadgeAdmin(admin.ModelAdmin):
    list_display = ['student', 'badge', 'awarded_at', 'awarded_by']
    list_filter = ['madrasah']
    raw_id_fields = ['student', 'badge', 'awarded_by']
    readonly_fields = ['awarded_at']


@admin.register(DialogueSession)
class DialogueSessionAdmin(admin.ModelAdmin):
    list_display = ['uuid', 'student', 'topic', 'status', 'turn_count', 'total_score', 'created_at']
    list_filter = ['madrasah', 'status', 'topic']
    raw_id_fields = ['student', 'mission']
    readonly_fields = ['uuid', 'created_at', 'completed_at']


@admin.register(DialogueTurn)
class DialogueTurnAdmin(admin.ModelAdmin):
    list_display = ['session', 'role', 'text_ar', 'turn_score', 'sort_order', 'created_at']
    list_filter = ['role']
    raw_id_fields = ['session']
    readonly_fields = ['created_at']


@admin.register(DailyGoal)
class DailyGoalAdmin(admin.ModelAdmin):
    list_display = ['student', 'date', 'missions_target', 'missions_completed', 'minutes_target', 'minutes_practiced', 'is_achieved']
    list_filter = ['madrasah', 'is_achieved', 'date']
    raw_id_fields = ['student']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(LeaderboardEntry)
class LeaderboardEntryAdmin(admin.ModelAdmin):
    list_display = ['rank', 'student', 'period', 'points', 'missions_completed', 'average_score', 'period_start']
    list_filter = ['madrasah', 'period']
    raw_id_fields = ['student']
    readonly_fields = ['updated_at']
