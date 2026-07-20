from django.urls import path
from . import views

urlpatterns = [
    path('', views.CertificateListCreateView.as_view(), name='certificate-list'),
    path('<uuid:pk>/', views.CertificateDetailView.as_view(), name='certificate-detail'),
    path('generate/', views.CertificateGenerateView.as_view(), name='certificate-generate'),
    path('<uuid:pk>/download/', views.CertificateDownloadView.as_view(), name='certificate-download'),
]
