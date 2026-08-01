from django.urls import path
from . import views

urlpatterns = [
    path('', views.QuestionBankListCreateView.as_view(), name='question-bank-list'),
    path('<int:pk>/', views.QuestionBankDetailView.as_view(), name='question-bank-detail'),
    path('<int:pk>/convert/', views.QuestionBankConvertView.as_view(), name='question-bank-convert'),
    path('<int:pk>/questions/', views.QuestionBankQuestionsView.as_view(), name='question-bank-questions'),
    path('<int:pk>/gap-analysis/<uuid:attempt_uuid>/', views.QuestionBankGapAnalysisView.as_view(), name='question-bank-gap-analysis'),
]
