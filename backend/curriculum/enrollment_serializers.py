from rest_framework import serializers
from .models import Enrollment


class EnrollmentSerializer(serializers.ModelSerializer):
    student_email = serializers.CharField(source='student.email', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    subject_name = serializers.CharField(source='subject.name_ar', read_only=True)
    ustaadh_name = serializers.CharField(source='ustaadh.get_full_name', read_only=True, default=None)

    class Meta:
        model = Enrollment
        fields = [
            'id', 'madrasah', 'student', 'student_email', 'student_name',
            'subject', 'subject_name', 'ustaadh', 'ustaadh_name', 'enrolled_at'
        ]
