from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source='actor.get_full_name', default='', read_only=True)
    actor_email = serializers.CharField(source='actor.email', default='', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'madrasah', 'actor', 'actor_name', 'actor_email',
            'action', 'model_name', 'object_id', 'object_repr',
            'previous_data', 'new_data', 'reason',
            'ip_address', 'user_agent', 'created_at',
        ]
        read_only_fields = fields
