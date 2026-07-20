from django.urls import path
from . import views

urlpatterns = [
    path('lesson-plans/', views.LessonPlanListCreateView.as_view(), name='lessonplan-list-create'),
    path('lesson-plans/<int:pk>/', views.LessonPlanDetailView.as_view(), name='lessonplan-detail'),
    path('lesson-plans/<int:pk>/approve/', views.LessonPlanApprovalView.as_view(), name='lessonplan-approve'),
    path('homework/', views.HomeworkListCreateView.as_view(), name='homework-list-create'),
    path('homework/<int:pk>/', views.HomeworkDetailView.as_view(), name='homework-detail'),
    path('homework/<int:homework_pk>/submissions/', views.HomeworkSubmissionListCreateView.as_view(), name='homework-submission-list-create'),
    path('homework/submissions/pending/', views.PendingGradingView.as_view(), name='homework-submission-pending'),
    path('homework/submissions/<int:pk>/grade/', views.HomeworkSubmissionGradeView.as_view(), name='homework-submission-grade'),
]
