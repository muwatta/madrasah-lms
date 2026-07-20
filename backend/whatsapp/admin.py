from django.contrib import admin
from .models import WhatsAppRecipient, WhatsAppMessage, WhatsAppTemplate

admin.site.register(WhatsAppRecipient)
admin.site.register(WhatsAppMessage)
admin.site.register(WhatsAppTemplate)
