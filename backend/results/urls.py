from django.urls import path
from . import views

urlpatterns = [
    path('exams/', views.ExamListView.as_view(), name='exam-list'),
    path('exams/<int:pk>/', views.ExamDetailView.as_view(), name='exam-detail'),
    path('exams/<int:exam_pk>/results/', views.ExamResultListView.as_view(), name='exam-results'),
    path('exams/<int:exam_pk>/results/bulk/', views.ExamResultsBulkUploadView.as_view(), name='exam-results-bulk'),
    path('student/exams/', views.StudentExamResultsView.as_view(), name='student-exam-results'),
]
