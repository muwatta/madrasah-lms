from rest_framework import serializers
from .models import Exam, ExamResult


class ExamSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    result_count = serializers.SerializerMethodField()

    class Meta:
        model = Exam
        fields = [
            'id', 'madrasah', 'subject', 'subject_name', 'created_by', 'created_by_name',
            'title', 'exam_date', 'description', 'total_marks', 'result_count', 'created_at'
        ]
        read_only_fields = ['madrasah', 'created_by']

    def get_result_count(self, obj):
        return obj.results.count()


class ExamResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    exam_title = serializers.CharField(source='exam.title', read_only=True)

    class Meta:
        model = ExamResult
        fields = [
            'id', 'exam', 'exam_title', 'student', 'student_name',
            'score', 'grade', 'remarks', 'recorded_at'
        ]
        read_only_fields = ['exam', 'student']
