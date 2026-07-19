from django.urls import path
from . import views

urlpatterns = [
    path('questions/', views.QuestionListView.as_view(), name='question-list'),
    path('questions/<int:pk>/', views.QuestionDetailView.as_view(), name='question-detail'),
    path('quizzes/', views.QuizListView.as_view(), name='quiz-list'),
    path('quizzes/<int:pk>/', views.QuizDetailView.as_view(), name='quiz-detail'),
    path('quizzes/<int:pk>/publish/', views.QuizPublishView.as_view(), name='quiz-publish'),
    path('quiz-attempts/', views.QuizAttemptCreateView.as_view(), name='quiz-attempt-create'),
    path('quiz-attempts/<int:pk>/', views.QuizAttemptDetailView.as_view(), name='quiz-attempt-detail'),
    path('quiz-attempts/<int:pk>/submit/', views.QuizAttemptSubmitView.as_view(), name='quiz-attempt-submit'),
    path('my-attempts/', views.StudentQuizAttemptsView.as_view(), name='my-attempts'),
]
