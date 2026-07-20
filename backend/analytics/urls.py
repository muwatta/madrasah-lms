from django.urls import path
from . import views

urlpatterns = [
    path('at-risk/', views.AtRiskPredictionListView.as_view(), name='at-risk-list'),
    path('at-risk/generate/', views.GenerateAtRiskPredictionsView.as_view(), name='at-risk-generate'),
    path('at-risk/<int:pk>/', views.AtRiskPredictionDetailView.as_view(), name='at-risk-detail'),
    path('skills/', views.SkillAssessmentListCreateView.as_view(), name='skill-assessment-list'),
    path('skills/<int:pk>/', views.SkillAssessmentDetailView.as_view(), name='skill-assessment-detail'),
    path('portfolio/', views.DigitalPortfolioListCreateView.as_view(), name='portfolio-list'),
    path('portfolio/<int:pk>/', views.DigitalPortfolioDetailView.as_view(), name='portfolio-detail'),
    path('teacher-workload/', views.TeacherWorkloadListView.as_view(), name='teacher-workload-list'),
    path('teacher-workload/me/', views.TeacherWorkloadMeView.as_view(), name='teacher-workload-me'),
    path('dashboard/admin/', views.AdminDashboardView.as_view(), name='admin-dashboard'),
]
