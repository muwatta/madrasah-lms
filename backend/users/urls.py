from django.urls import path
from . import views
from . import message_views
from . import intervention_views
from . import bulk_import_views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('refresh-token/', views.RefreshTokenView.as_view(), name='refresh-token'),
    path('me/', views.MeView.as_view(), name='me'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    path('', views.UserListView.as_view(), name='user-list'),
    path('<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),
    path('madrasahs/', views.MadrasahListView.as_view(), name='madrasah-list'),
    path('student-parents/', views.StudentParentListCreateView.as_view(), name='student-parent-list'),
    path('student-parents/<int:pk>/', views.StudentParentDeleteView.as_view(), name='student-parent-delete'),
    path('messages/', message_views.MessageListView.as_view(), name='message-list'),
    path('messages/<int:pk>/', message_views.MessageDetailView.as_view(), name='message-detail'),
    path('messages/unread-count/', message_views.MessageUnreadCountView.as_view(), name='message-unread-count'),
    path('parent-students/', message_views.ParentStudentsView.as_view(), name='parent-students'),
    path('teacher-parents/', message_views.TeacherParentsView.as_view(), name='teacher-parents'),
    path('intervention-alerts/', intervention_views.StudentInterventionAlertsView.as_view(), name='intervention-alerts'),
    path('admin-engagement/', intervention_views.AdminEngagementView.as_view(), name='admin-engagement'),
    path('bulk-import/', bulk_import_views.BulkUserImportView.as_view(), name='bulk-user-import'),
]
