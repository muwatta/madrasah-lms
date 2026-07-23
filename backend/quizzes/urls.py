from django.urls import path
from . import views

urlpatterns = [
    # ── Question Bank ──
    path('questions/', views.QuestionListCreateView.as_view(), name='question-list-create'),
    path('questions/<int:pk>/', views.QuestionDetailView.as_view(), name='question-detail'),
    path('questions/<int:pk>/duplicate/', views.QuestionDuplicateView.as_view(), name='question-duplicate'),

    # ── Quiz CRUD ──
    path('', views.QuizListCreateView.as_view(), name='quiz-list-create'),
    path('<int:pk>/', views.QuizDetailView.as_view(), name='quiz-detail'),
    path('<int:pk>/publish/', views.QuizPublishView.as_view(), name='quiz-publish'),
    path('<int:pk>/archive/', views.QuizArchiveView.as_view(), name='quiz-archive'),
    path('<int:pk>/questions/', views.QuizQuestionsView.as_view(), name='quiz-questions'),
    path('<int:pk>/questions/add/', views.QuizAddQuestionView.as_view(), name='quiz-add-question'),
    path('<int:pk>/questions/<int:question_pk>/remove/', views.QuizRemoveQuestionView.as_view(), name='quiz-remove-question'),

    # ── Student: Take Quiz ──
    path('start/', views.StartQuizView.as_view(), name='quiz-start'),
    path('attempt/<uuid:attempt_uuid>/', views.MyAttemptView.as_view(), name='quiz-attempt-detail'),
    path('attempt/<uuid:attempt_uuid>/answer/', views.SaveAnswerView.as_view(), name='quiz-save-answer'),
    path('attempt/<uuid:attempt_uuid>/flag/', views.FlagQuestionView.as_view(), name='quiz-flag'),
    path('attempt/<uuid:attempt_uuid>/submit/', views.SubmitQuizView.as_view(), name='quiz-submit'),
    path('attempt/<uuid:attempt_uuid>/violation/', views.ReportViolationView.as_view(), name='quiz-violation'),

    # ── Results & Analytics ──
    path('<int:pk>/results/', views.QuizResultsView.as_view(), name='quiz-results'),
    path('<int:pk>/stats/', views.QuizStatsView.as_view(), name='quiz-stats'),
    path('<int:pk>/analysis/', views.QuestionAnalysisView.as_view(), name='quiz-question-analysis'),
    path('<int:pk>/violations/', views.ViolationReportView.as_view(), name='quiz-violations'),

    # ── Dashboard ──
    path('overview/', views.QuizOverviewView.as_view(), name='quiz-overview'),
]
