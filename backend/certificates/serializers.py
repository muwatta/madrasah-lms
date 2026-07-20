from rest_framework import serializers
from .models import Certificate


class CertificateSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)

    class Meta:
        model = Certificate
        fields = [
            'id', 'madrasah', 'student', 'student_name',
            'certificate_type', 'title', 'description', 'metadata',
            'file', 'certificate_number', 'issued_at', 'created_at',
        ]
        read_only_fields = ['id', 'file', 'certificate_number', 'issued_at', 'created_at']


class CertificateGenerateSerializer(serializers.Serializer):
    certificate_type = serializers.ChoiceField(choices=Certificate.CertificateType.choices)
    title = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True)
    metadata = serializers.JSONField(default=dict, required=False)
