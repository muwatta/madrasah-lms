from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import export_views
from . import result_views

router = DefaultRouter()

# ── New Workflow ViewSets ─────────────────────────────────────────
router.register(r'grade-scales', views.GradeScaleViewSet, basename='grade-scale')
router.register(r'blueprints', views.AssessmentBlueprintViewSet, basename='blueprint')
router.register(r'assessments', views.AssessmentViewSet, basename='assessment')
router.register(r'assessment-scores', views.AssessmentScoreViewSet, basename='assessment-score')
router.register(r'subject-results', views.SubjectResultViewSet, basename='subject-result')
router.register(r'term-results', views.TermResultViewSet, basename='term-result')
router.register(r'annual-results', views.AnnualResultViewSet, basename='annual-result')
router.register(r'ranks', views.StudentRankViewSet, basename='student-rank')
router.register(r'publications', views.ResultPublicationViewSet, basename='publication')
router.register(r'report-cards', views.ReportCardViewSet, basename='report-card')
router.register(r'audit-logs', views.ResultAuditLogViewSet, basename='audit-log')

urlpatterns = [
    # ── Explicit paths FIRST to avoid router conflicts ─────────────

    # ── Bulk operations ────────────────────────────────────────────
    path('bulk-scores/<int:assessment_id>/',
         views.BulkScoreUploadView.as_view(), name='bulk-score-upload'),

    # ── Legacy teacher endpoints (backward compatible) ─────────────
    path('teacher/subjects/',
         views.TeacherSubjectsView.as_view(), name='teacher-subjects'),
    path('teacher/terms/',
         views.TeacherTermsView.as_view(), name='teacher-terms'),
    path('teacher/submit/',
         result_views.TeacherTermSubmitView.as_view(), name='teacher-submit'),

    # ── Legacy template/component endpoints ────────────────────────
    path('templates/',
         result_views.ResultTemplateView.as_view(), name='template-list'),
    path('templates/<int:pk>/',
         result_views.ResultTemplateDetailView.as_view(), name='template-detail'),
    path('templates/<int:template_id>/items/',
         result_views.ResultTemplateItemBulkView.as_view(), name='template-items'),
    path('components/',
         result_views.ResultComponentListCreateView.as_view(), name='component-list'),
    path('components/generate/',
         result_views.ResultComponentGenerateView.as_view(), name='component-generate'),
    path('components/<int:pk>/',
         result_views.ResultComponentDetailView.as_view(), name='component-detail'),
    path('legacy-scores/',
         result_views.ScoreListView.as_view(), name='legacy-score-list'),
    path('legacy-scores/bulk/<int:component_id>/',
         result_views.ScoreBulkUpdateView.as_view(), name='legacy-score-bulk'),

    # ── Admin result management ────────────────────────────────────
    path('admin/pending/',
         result_views.PendingResultsView.as_view(), name='admin-pending'),
    path('admin/publish/',
         result_views.PublishResultsView.as_view(), name='admin-publish'),

    # ── Student / Parent results (backward compatible) ─────────────
    path('my-results/',
         views.MyTermResultsView.as_view(), name='my-results'),
    path('child-results/',
         views.ChildTermResultsView.as_view(), name='child-results'),

    # ── Exports ────────────────────────────────────────────────────
    path('export/students/',
         export_views.ExportStudentPerformanceView.as_view(), name='export-students'),
    path('export/quizzes/<int:quiz_id>/',
         export_views.ExportQuizResultsView.as_view(), name='export-quiz-results'),
    path('export/exams/<int:exam_id>/',
         export_views.ExportExamResultsView.as_view(), name='export-exam-results'),
    path('export/subject-results/',
         export_views.ExportSubjectResultsView.as_view(), name='export-subject-results'),
    path('export/term-results/',
         export_views.ExportTermResultsView.as_view(), name='export-term-results'),

    # ── Router MUST come after explicit paths ──────────────────────
    path('', include(router.urls)),
]
