from django.urls import path
from . import views
from . import export_views

urlpatterns = [
    path('exams/', views.ExamListView.as_view(), name='exam-list'),
    path('exams/<int:pk>/', views.ExamDetailView.as_view(), name='exam-detail'),
    path('exams/<int:pk>/results/', views.ExamResultListView.as_view(), name='exam-results'),
    path('exams/<int:pk>/results/bulk/', views.ExamResultsBulkUploadView.as_view(), name='exam-results-bulk'),
    path('my-exams/', views.StudentExamResultsView.as_view(), name='student-exam-results'),
    path('export/students/', export_views.ExportStudentPerformanceView.as_view(), name='export-students'),
    path('export/quizzes/<int:quiz_id>/', export_views.ExportQuizResultsView.as_view(), name='export-quiz-results'),
    path('export/exams/<int:exam_id>/', export_views.ExportExamResultsView.as_view(), name='export-exam-results'),
]
