from django.urls import path
from . import views
from . import export_views
from . import result_views

urlpatterns = [
    path('exams/', views.ExamListView.as_view(), name='exam-list'),
    path('exams/<int:pk>/', views.ExamDetailView.as_view(), name='exam-detail'),
    path('exams/<int:pk>/results/', views.ExamResultListView.as_view(), name='exam-results'),
    path('exams/<int:pk>/results/bulk/', views.ExamResultsBulkUploadView.as_view(), name='exam-results-bulk'),
    path('my-exams/', views.StudentExamResultsView.as_view(), name='student-exam-results'),
    path('export/students/', export_views.ExportStudentPerformanceView.as_view(), name='export-students'),
    path('export/quizzes/<int:quiz_id>/', export_views.ExportQuizResultsView.as_view(), name='export-quiz-results'),
    path('export/exams/<int:exam_id>/', export_views.ExportExamResultsView.as_view(), name='export-exam-results'),

    # Teacher result management
    path('teacher/subjects/', result_views.TeacherSubjectsView.as_view(), name='teacher-subjects'),
    path('teacher/terms/', result_views.TeacherTermsView.as_view(), name='teacher-terms'),
    path('components/', result_views.ResultComponentListCreateView.as_view(), name='component-list'),
    path('components/generate/', result_views.ResultComponentGenerateView.as_view(), name='component-generate'),
    path('components/<int:pk>/', result_views.ResultComponentDetailView.as_view(), name='component-detail'),
    path('scores/', result_views.ScoreListView.as_view(), name='score-list'),
    path('scores/bulk/<int:component_id>/', result_views.ScoreBulkUpdateView.as_view(), name='score-bulk'),
    path('teacher/submit/', result_views.TeacherTermSubmitView.as_view(), name='teacher-submit'),

    # Admin result management
    path('templates/', result_views.ResultTemplateView.as_view(), name='template-list'),
    path('templates/<int:pk>/', result_views.ResultTemplateDetailView.as_view(), name='template-detail'),
    path('templates/<int:template_id>/items/', result_views.ResultTemplateItemBulkView.as_view(), name='template-items'),
    path('admin/pending/', result_views.PendingResultsView.as_view(), name='admin-pending'),
    path('admin/publish/', result_views.PublishResultsView.as_view(), name='admin-publish'),

    # Student / Parent results
    path('my-results/', result_views.MyTermResultsView.as_view(), name='my-results'),
    path('child-results/', result_views.ChildTermResultsView.as_view(), name='child-results'),
]
