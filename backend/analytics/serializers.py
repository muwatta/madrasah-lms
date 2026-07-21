from rest_framework import serializers
from .models import AtRiskPrediction, SkillAssessment, DigitalPortfolio


class AtRiskPredictionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    created_at = serializers.DateTimeField(source='generated_at', read_only=True)

    class Meta:
        model = AtRiskPrediction
        fields = [
            'id', 'madrasah', 'student', 'student_name', 'risk_score', 'risk_level',
            'factors', 'recommendations', 'created_at', 'is_active',
        ]
        read_only_fields = ['madrasah']


class SkillAssessmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True, default=None)

    class Meta:
        model = SkillAssessment
        fields = [
            'id', 'madrasah', 'student', 'student_name', 'teacher', 'teacher_name',
            'skill_name', 'score', 'assessment_date', 'notes', 'created_at',
        ]
        read_only_fields = ['madrasah']


class DigitalPortfolioSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    file_url = serializers.URLField(source='file', read_only=True, allow_null=True)
    date = serializers.DateField(source='date_achieved', read_only=True)

    class Meta:
        model = DigitalPortfolio
        fields = [
            'id', 'madrasah', 'student', 'student_name', 'item_type', 'title',
            'description', 'url', 'file', 'file_url', 'date_achieved', 'date', 'created_at',
        ]
        read_only_fields = ['madrasah']
