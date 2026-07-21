from django.urls import path
from . import views

urlpatterns = [
    path('career/generate/', views.CareerGuidanceView.as_view(), name='career-generate'),
    path('career/', views.CareerRecommendationListView.as_view(), name='career-list'),
    path('tutor/ask/', views.AITutorSessionView.as_view(), name='tutor-ask'),
    path('tutor/history/', views.AITutorSessionListView.as_view(), name='tutor-history'),
    path('student-summary/', views.StudentSummaryView.as_view(), name='student-summary'),
    path('student-summary/<int:student_id>/', views.StudentSummaryView.as_view(), name='student-summary-detail'),
]
