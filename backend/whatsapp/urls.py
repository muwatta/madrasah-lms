from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'recipients', views.WhatsAppRecipientViewSet, basename='whatsapp-recipient')
router.register(r'templates', views.WhatsAppTemplateViewSet, basename='whatsapp-template')
router.register(r'messages', views.WhatsAppMessageViewSet, basename='whatsapp-message')

urlpatterns = [
    path('', include(router.urls)),
    path('webhook/', views.whatsapp_webhook, name='whatsapp-webhook'),
    path('send/', views.SendMessageView.as_view(), name='whatsapp-send'),
]
