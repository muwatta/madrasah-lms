from django.urls import path
from . import views
from . import progress_views

urlpatterns = [
    path('questions/', views.QuestionListView.as_view(), name='question-list'),
    path('questions/bulk-upload/', progress_views.BulkQuestionUploadView.as_view(), name='question-bulk-upload'),
    path('questions/<int:pk>/', views.QuestionDetailView.as_view(), name='question-detail'),
    path('quizzes/', views.QuizListView.as_view(), name='quiz-list'),
    path('quizzes/<int:pk>/', views.QuizDetailView.as_view(), name='quiz-detail'),
    path('quizzes/<int:pk>/publish/', views.QuizPublishView.as_view(), name='quiz-publish'),
    path('quizzes/<int:pk>/analytics/', progress_views.QuizAnalyticsView.as_view(), name='quiz-analytics'),
    path('quiz-attempts/', views.QuizAttemptCreateView.as_view(), name='quiz-attempt-create'),
    path('quiz-attempts/<int:pk>/', views.QuizAttemptDetailView.as_view(), name='quiz-attempt-detail'),
    path('quiz-attempts/<int:pk>/submit/', views.QuizAttemptSubmitView.as_view(), name='quiz-attempt-submit'),
    path('my-attempts/', views.StudentQuizAttemptsView.as_view(), name='my-attempts'),
    path('progress/', progress_views.StudentProgressView.as_view(), name='student-progress'),
    path('generate-questions/', views.QuestionGeneratorView.as_view(), name='generate-questions'),
]
