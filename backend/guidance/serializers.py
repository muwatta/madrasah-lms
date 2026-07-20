from rest_framework import serializers
from .models import CareerRecommendation, AITutorSession


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

    class Meta:
        model = AITutorSession
        fields = [
            'id', 'madrasah', 'student', 'student_name', 'subject', 'subject_name',
            'question', 'response', 'created_at',
        ]
        read_only_fields = ['madrasah']
