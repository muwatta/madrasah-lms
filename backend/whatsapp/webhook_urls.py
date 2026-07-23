from django.urls import path
from . import webhook_views

urlpatterns = [
    path('', webhook_views.whatsapp_webhook, name='whatsapp-webhook'),
]
