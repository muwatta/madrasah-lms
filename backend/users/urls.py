from django.urls import path
from . import views

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
]
