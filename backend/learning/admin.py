from django.contrib import admin
from .models import LearningPath, LearningPathItem, FlashCardDeck, FlashCard, FlashCardReview


class LearningPathItemInline(admin.TabularInline):
    model = LearningPathItem
    extra = 0
    ordering = ['order']


@admin.register(LearningPath)
class LearningPathAdmin(admin.ModelAdmin):
    list_display = ['title', 'student', 'subject', 'progress_percent', 'is_active', 'created_at']
    list_filter = ['is_active', 'subject']
    search_fields = ['title', 'student__first_name', 'student__last_name']
    inlines = [LearningPathItemInline]


@admin.register(FlashCardDeck)
class FlashCardDeckAdmin(admin.ModelAdmin):
    list_display = ['title', 'madrasah', 'subject', 'is_shared', 'created_by', 'created_at']
    list_filter = ['is_shared', 'madrasah']
    search_fields = ['title']


@admin.register(FlashCard)
class FlashCardAdmin(admin.ModelAdmin):
    list_display = ['front', 'deck', 'difficulty', 'order', 'created_at']
    list_filter = ['difficulty', 'deck']
    search_fields = ['front', 'back']


@admin.register(FlashCardReview)
class FlashCardReviewAdmin(admin.ModelAdmin):
    list_display = ['card', 'student', 'quality', 'interval_days', 'easiness_factor', 'next_review']
    list_filter = ['quality']
    search_fields = ['card__front', 'student__first_name', 'student__last_name']
