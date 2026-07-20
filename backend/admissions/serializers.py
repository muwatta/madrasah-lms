from rest_framework import serializers
from .models import Application, ApplicationDocument


class ApplicationDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationDocument
        fields = ['id', 'application', 'document_type', 'file', 'uploaded_at']
        read_only_fields = ['uploaded_at']


class ApplicationSerializer(serializers.ModelSerializer):
    applying_for_class_name = serializers.CharField(
        source='applying_for_class.__str__', read_only=True, default=None
    )
    documents = ApplicationDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = Application
        fields = [
            'id', 'madrasah', 'application_number', 'first_name', 'last_name',
            'email', 'phone', 'date_of_birth', 'gender', 'address',
            'previous_school', 'applying_for_class', 'applying_for_class_name',
            'status', 'interview_date', 'interview_notes',
            'entrance_score', 'entrance_result',
            'accepted_at', 'enrolled_at', 'rejected_reason',
            'documents', 'created_at', 'updated_at',
        ]
        read_only_fields = ['madrasah', 'application_number', 'accepted_at', 'enrolled_at']


class ApplicationListSerializer(serializers.ModelSerializer):
    applying_for_class_name = serializers.CharField(
        source='applying_for_class.__str__', read_only=True, default=None
    )

    class Meta:
        model = Application
        fields = [
            'id', 'madrasah', 'application_number', 'first_name', 'last_name',
            'email', 'phone', 'date_of_birth', 'gender',
            'applying_for_class', 'applying_for_class_name',
            'status', 'entrance_score', 'accepted_at', 'enrolled_at',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['madrasah', 'application_number']
