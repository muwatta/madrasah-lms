from rest_framework import serializers
from .models import WhatsAppRecipient, WhatsAppMessage, WhatsAppTemplate


class WhatsAppRecipientSerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source='parent.get_full_name', read_only=True)
    parent_email = serializers.CharField(source='parent.email', read_only=True)

    class Meta:
        model = WhatsAppRecipient
        fields = [
            'id', 'madrasah', 'parent', 'parent_name', 'parent_email',
            'phone_number', 'is_opted_in', 'opted_in_at', 'opted_out_at',
            'language', 'created_at', 'updated_at',
        ]
        read_only_fields = ['madrasah', 'opted_in_at', 'opted_out_at']


class WhatsAppTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = WhatsAppTemplate
        fields = [
            'id', 'madrasah', 'name', 'message_type',
            'body_ar', 'body_en', 'variables', 'is_active',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['madrasah']


class WhatsAppMessageSerializer(serializers.ModelSerializer):
    recipient_name = serializers.CharField(source='recipient.parent.get_full_name', read_only=True)
    recipient_phone = serializers.CharField(source='recipient.phone_number', read_only=True)

    class Meta:
        model = WhatsAppMessage
        fields = [
            'id', 'madrasah', 'recipient', 'recipient_name', 'recipient_phone',
            'message_type', 'template_name', 'body', 'media_url',
            'status', 'whatsapp_message_id', 'error_message',
            'sent_at', 'created_at',
        ]
        read_only_fields = fields
