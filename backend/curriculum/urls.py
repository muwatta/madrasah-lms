from django.urls import path
from . import views

urlpatterns = [
    path('classes/', views.SchoolClassListView.as_view(), name='schoolclass-list'),
    path('classes/<int:pk>/', views.SchoolClassDetailView.as_view(), name='schoolclass-detail'),
    path('class-subjects/', views.ClassSubjectListCreateView.as_view(), name='class-subject-list'),
    path('class-subjects/<int:pk>/', views.ClassSubjectDestroyView.as_view(), name='class-subject-detail'),
    path('', views.SubjectListView.as_view(), name='subject-list'),
    path('<int:pk>/', views.SubjectDetailView.as_view(), name='subject-detail'),
    path('<int:subject_pk>/topics/', views.TopicListView.as_view(), name='topic-list'),
    path('topics/<int:pk>/', views.TopicDetailView.as_view(), name='topic-detail'),
]
