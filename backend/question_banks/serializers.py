from rest_framework import serializers
from .models import QuestionBank, GapAnalysis


class QuestionBankSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    subject_name = serializers.CharField(source='subject.name_ar', read_only=True)
    school_class_name = serializers.CharField(source='school_class.name_ar', read_only=True)
    session_name = serializers.CharField(source='session.name', read_only=True)
    term_name = serializers.CharField(source='term.name', read_only=True)
    term_number = serializers.IntegerField(source='term.term_number', read_only=True)
    question_count = serializers.IntegerField(read_only=True)
    converted_quiz = serializers.IntegerField(source='converted_quiz_id', read_only=True, default=None)
    file_url = serializers.SerializerMethodField()
    size_saved = serializers.SerializerMethodField()

    class Meta:
        model = QuestionBank
        fields = [
            'id', 'madrasah', 'created_by', 'created_by_name',
            'subject', 'subject_name', 'school_class', 'school_class_name',
            'session', 'session_name', 'term', 'term_name', 'term_number',
            'title', 'description', 'file', 'file_url', 'file_type',
            'original_size', 'stored_size', 'size_saved',
            'status', 'error_message', 'question_count', 'converted_quiz',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'madrasah', 'created_by', 'created_by_name',
            'status', 'error_message', 'question_count', 'converted_quiz',
            'created_at', 'updated_at',
        ]

    def get_file_url(self, obj):
        if obj.file:
            return obj.file.url
        return None

    def get_size_saved(self, obj):
        if obj.original_size and obj.stored_size:
            return max(0, int(obj.original_size - obj.stored_size))
        return 0


class GapAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = GapAnalysis
        fields = ['id', 'bank', 'student', 'attempt', 'content', 'created_at']
        read_only_fields = ['id', 'created_at']
