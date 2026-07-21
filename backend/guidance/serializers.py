from rest_framework import serializers
from .models import CareerRecommendation, AITutorSession, SessionAttachment


class SessionAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SessionAttachment
        fields = ['id', 'filename', 'file_type', 'file_size', 'uploaded_at', 'file']
        read_only_fields = ['id', 'uploaded_at']


class CareerRecommendationSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)

    class Meta:
        model = CareerRecommendation
        fields = [
            'id', 'madrasah', 'student', 'student_name', 'recommendations',
            'recommended_universities', 'recommended_courses',
            'generated_at', 'is_current',
        ]
        read_only_fields = ['madrasah']


class AITutorSessionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    subject_name = serializers.CharField(source='subject.name_en', read_only=True, default=None)
    attachments = SessionAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = AITutorSession
        fields = [
            'id', 'madrasah', 'student', 'student_name', 'subject', 'subject_name',
            'session_id', 'question', 'response', 'created_at', 'attachments',
        ]
        read_only_fields = ['madrasah', 'session_id', 'attachments']
