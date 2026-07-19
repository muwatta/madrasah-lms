from django.urls import path
from . import views

urlpatterns = [
    path('classes/', views.SchoolClassListView.as_view(), name='schoolclass-list'),
    path('', views.SubjectListView.as_view(), name='subject-list'),
    path('<int:pk>/', views.SubjectDetailView.as_view(), name='subject-detail'),
    path('<int:subject_pk>/topics/', views.TopicListView.as_view(), name='topic-list'),
    path('topics/<int:pk>/', views.TopicDetailView.as_view(), name='topic-detail'),
]
