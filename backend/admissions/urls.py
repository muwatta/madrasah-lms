from django.urls import path
from . import views

urlpatterns = [
    path('applications/', views.ApplicationListView.as_view(), name='application-list'),
    path('applications/<int:pk>/', views.ApplicationDetailView.as_view(), name='application-detail'),
    path('applications/<int:pk>/accept/', views.ApplicationAcceptView.as_view(), name='application-accept'),
    path('applications/<int:pk>/reject/', views.ApplicationRejectView.as_view(), name='application-reject'),
    path('applications/<int:pk>/enroll/', views.ApplicationEnrollView.as_view(), name='application-enroll'),
    path('applications/<int:pk>/documents/', views.ApplicationDocumentListCreateView.as_view(), name='application-documents'),
    path('applications/<int:pk>/documents/<int:doc_pk>/', views.ApplicationDocumentDeleteView.as_view(), name='application-document-delete'),
]
