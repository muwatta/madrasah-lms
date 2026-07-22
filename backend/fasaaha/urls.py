"""
Fasaaha URL configuration.
"""
from django.urls import path

from . import views

app_name = 'fasaaha'

urlpatterns = [
    path('levels/', views.SpeakingLevelListCreateView.as_view(), name='level-list'),
    path('levels/<int:pk>/', views.SpeakingLevelDetailView.as_view(), name='level-detail'),
    path('levels/<int:level_id>/missions/', views.LevelMissionsView.as_view(), name='level-missions'),

    path('categories/', views.MissionCategoryListCreateView.as_view(), name='category-list'),
    path('categories/<int:pk>/', views.MissionCategoryDetailView.as_view(), name='category-detail'),

    path('missions/', views.MissionListCreateView.as_view(), name='mission-list'),
    path('missions/<int:pk>/', views.MissionDetailView.as_view(), name='mission-detail'),

    path('attempts/', views.AttemptListCreateView.as_view(), name='attempt-list'),
    path('attempts/<int:pk>/', views.AttemptDetailView.as_view(), name='attempt-detail'),
    path('attempts/<int:pk>/retry/', views.AttemptRetryView.as_view(), name='attempt-retry'),

    path('attempts/<int:attempt_pk>/analysis/', views.AIAnalysisView.as_view(), name='attempt-analysis'),

    path('reviews/pending/', views.PendingReviewListView.as_view(), name='review-pending'),
    path('reviews/', views.ReviewListCreateView.as_view(), name='review-list'),
    path('reviews/<int:pk>/', views.ReviewDetailView.as_view(), name='review-detail'),

    path('assignments/', views.AssignmentListCreateView.as_view(), name='assignment-list'),
    path('assignments/<int:pk>/', views.AssignmentDetailView.as_view(), name='assignment-detail'),

    path('progress/', views.StudentProgressListView.as_view(), name='progress-list'),
    path('progress/<int:level_id>/', views.LevelProgressView.as_view(), name='level-progress'),
    path('progress/streak/', views.StudentStreakView.as_view(), name='streak'),

    path('badges/', views.BadgeListView.as_view(), name='badge-list'),
    path('badges/create/', views.BadgeCreateView.as_view(), name='badge-create'),
    path('badges/my/', views.MyBadgesView.as_view(), name='my-badges'),

    path('analytics/class/', views.ClassAnalyticsView.as_view(), name='class-analytics'),
    path('analytics/student/<int:student_id>/', views.StudentAnalyticsView.as_view(), name='student-analytics'),
    path('analytics/school/', views.SchoolAnalyticsView.as_view(), name='school-analytics'),

    path('dashboard/student/', views.StudentDashboardView.as_view(), name='student-dashboard'),
    path('dashboard/teacher/', views.TeacherDashboardView.as_view(), name='teacher-dashboard'),
]
