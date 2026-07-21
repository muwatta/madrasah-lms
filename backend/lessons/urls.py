from django.urls import path
from . import views

urlpatterns = [
    # ── Schemes of Work ──
    path('schemes/', views.SchemeOfWorkListCreateView.as_view(), name='scheme-list-create'),
    path('schemes/<int:pk>/', views.SchemeOfWorkDetailView.as_view(), name='scheme-detail'),
    path('schemes/weeks/<int:pk>/', views.SchemeWeekUpdateView.as_view(), name='scheme-week-update'),

    # ── Learning Objectives ──
    path('objectives/', views.LearningObjectiveListCreateView.as_view(), name='objective-list-create'),

    # ── Lesson Plans ──
    path('lesson-plans/', views.LessonPlanListCreateView.as_view(), name='lessonplan-list-create'),
    path('lesson-plans/<int:pk>/', views.LessonPlanDetailView.as_view(), name='lessonplan-detail'),
    path('lesson-plans/<int:pk>/approve/', views.LessonPlanApprovalView.as_view(), name='lessonplan-approve'),
    path('lesson-plans/<int:pk>/submit/', views.LessonPlanSubmitView.as_view(), name='lessonplan-submit'),

    # ── Lesson Resources ──
    path('lesson-plans/<int:lesson_pk>/resources/',
         views.LessonResourceListCreateView.as_view(), name='lesson-resource-list-create'),

    # ── Lesson Delivery ──
    path('lesson-plans/<int:lesson_pk>/delivery/',
         views.LessonDeliveryView.as_view(), name='lesson-delivery'),

    # ── Lesson Reflections ──
    path('lesson-plans/<int:lesson_pk>/reflections/',
         views.LessonReflectionListCreateView.as_view(), name='lesson-reflection-list-create'),

    # ── Homework ──
    path('homework/', views.HomeworkListCreateView.as_view(), name='homework-list-create'),
    path('homework/<int:pk>/', views.HomeworkDetailView.as_view(), name='homework-detail'),
    path('homework/<int:homework_pk>/submissions/',
         views.HomeworkSubmissionListCreateView.as_view(), name='homework-submission-list-create'),
    path('homework/submissions/pending/',
         views.PendingGradingView.as_view(), name='homework-submission-pending'),
    path('homework/submissions/<int:pk>/grade/',
         views.HomeworkSubmissionGradeView.as_view(), name='homework-submission-grade'),

    # ── Analytics ──
    path('analytics/', views.LessonAnalyticsView.as_view(), name='lesson-analytics'),

    # ── Audit Log ──
    path('audit-logs/', views.LessonAuditLogView.as_view(), name='lesson-audit-log'),

    # ── Teacher Info ──
    path('teacher-classes/', views.TeacherClassesView.as_view(), name='lesson-teacher-classes'),
    path('teacher-subjects/', views.TeacherSubjectsView.as_view(), name='lesson-teacher-subjects'),

    # ── AI Generation ──
    path('ai/generate-lesson-plan/', views.LessonPlanAIGenerateView.as_view(), name='ai-generate-lesson-plan'),
    path('ai/generate-scheme/', views.SchemeAIGenerateView.as_view(), name='ai-generate-scheme'),
    path('ai/generate-homework/', views.HomeworkAIGenerateView.as_view(), name='ai-generate-homework'),
    path('ai/refine/<int:pk>/', views.LessonPlanAIRefineView.as_view(), name='ai-refine-lesson-plan'),
]
