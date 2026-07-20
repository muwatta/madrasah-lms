from django.contrib import admin
from .models import Application, ApplicationDocument


class ApplicationDocumentInline(admin.TabularInline):
    model = ApplicationDocument
    extra = 0


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ['application_number', 'first_name', 'last_name', 'status', 'madrasah', 'created_at']
    list_filter = ['status', 'gender']
    search_fields = ['application_number', 'first_name', 'last_name', 'email']
    inlines = [ApplicationDocumentInline]


@admin.register(ApplicationDocument)
class ApplicationDocumentAdmin(admin.ModelAdmin):
    list_display = ['application', 'document_type', 'uploaded_at']
    list_filter = ['document_type']
