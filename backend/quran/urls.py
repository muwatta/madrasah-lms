from django.urls import path
from . import views

urlpatterns = [
    path('memorization/', views.MemorizationTrackerListCreateView.as_view(), name='memorization-list'),
    path('memorization/<int:pk>/', views.MemorizationTrackerDetailView.as_view(), name='memorization-detail'),
    path('revision/', views.RevisionScheduleListCreateView.as_view(), name='revision-list'),
    path('revision/mark-complete/<int:pk>/', views.mark_revision_complete, name='revision-mark-complete'),
    path('revision/<int:pk>/', views.RevisionScheduleDetailView.as_view(), name='revision-detail'),
    path('tajwid/', views.TajwidAssessmentListCreateView.as_view(), name='tajwid-list'),
    path('tajwid/<int:pk>/', views.TajwidAssessmentDetailView.as_view(), name='tajwid-detail'),
    path('prayer-times/', views.PrayerTimetableListCreateView.as_view(), name='prayer-times-list'),
    path('prayer-times/<int:pk>/', views.PrayerTimetableDetailView.as_view(), name='prayer-times-detail'),
    path('prayer-times/today/', views.today_prayer_times, name='prayer-times-today'),
    path('student-progress/<int:student_id>/', views.student_progress, name='student-progress'),
]
