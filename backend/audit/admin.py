from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['created_at', 'actor', 'action', 'model_name', 'object_id', 'ip_address']
    list_filter = ['action', 'model_name', 'created_at']
    search_fields = ['actor__email', 'actor__first_name', 'actor__last_name', 'object_repr']
    readonly_fields = [
        'id', 'madrasah', 'actor', 'action', 'model_name', 'object_id', 'object_repr',
        'previous_data', 'new_data', 'reason', 'ip_address', 'user_agent', 'created_at',
    ]
    ordering = ['-created_at']
    date_hierarchy = 'created_at'

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
