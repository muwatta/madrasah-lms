from django.contrib import admin
from django.urls import path
from . import views

urlpatterns = [
    path('fee-structures/', views.FeeStructureListView.as_view(), name='fee-structure-list'),
    path('fees/', views.FeeListView.as_view(), name='fee-list'),
    path('fees/<int:pk>/', views.FeeDetailView.as_view(), name='fee-detail'),
    path('fees/<int:fee_id>/pay/', views.FeePaymentCreateView.as_view(), name='fee-pay'),
    path('fees/bulk-create/', views.BulkFeeCreateView.as_view(), name='fee-bulk-create'),
    path('fees/analytics/', views.FeeAnalyticsView.as_view(), name='fee-analytics'),
    path('attendance/', views.AttendanceListView.as_view(), name='attendance-list'),
    path('attendance/bulk/', views.BulkAttendanceView.as_view(), name='attendance-bulk'),
    path('attendance/analytics/', views.AttendanceAnalyticsView.as_view(), name='attendance-analytics'),
    path('announcements/', views.AnnouncementListView.as_view(), name='announcement-list'),
    path('announcements/<int:pk>/', views.AnnouncementDetailView.as_view(), name='announcement-detail'),
    path('reports/student/<int:student_id>/', views.StudentReportView.as_view(), name='student-report'),
    path('notifications/', views.NotificationListView.as_view(), name='notification-list'),
    path('notifications/mark-read/<int:pk>/', views.NotificationMarkReadView.as_view(), name='notification-mark-read'),
    path('notifications/mark-all-read/', views.NotificationMarkAllReadView.as_view(), name='notification-mark-all-read'),
    path('notifications/unread-count/', views.NotificationUnreadCountView.as_view(), name='notification-unread-count'),
]
