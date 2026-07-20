from rest_framework import serializers
from .models import Message


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True)
    recipient_name = serializers.CharField(source='recipient.get_full_name', read_only=True)

    class Meta:
        model = Message
        fields = [
            'id', 'madrasah', 'sender', 'sender_name', 'recipient', 'recipient_name',
            'subject', 'body', 'is_read', 'created_at',
        ]
        read_only_fields = ['madrasah', 'sender', 'is_read']