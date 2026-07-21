from rest_framework import serializers
from .models import Enrollment


class EnrollmentSerializer(serializers.ModelSerializer):
    student_email = serializers.CharField(source='student.email', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    subject_name = serializers.CharField(source='subject.name_ar', read_only=True)
    subject_name_en = serializers.CharField(source='subject.name_en', read_only=True)
    ustaadh_name = serializers.CharField(source='ustaadh.get_full_name', read_only=True, default=None)
    school_class_name = serializers.CharField(source='school_class.name_en', read_only=True, default=None)

    class Meta:
        model = Enrollment
        fields = [
            'id', 'madrasah', 'student', 'student_email', 'student_name',
            'subject', 'subject_name', 'subject_name_en',
            'school_class', 'school_class_name',
            'ustaadh', 'ustaadh_name', 'enrolled_at'
        ]
        read_only_fields = ['madrasah', 'enrolled_at']

    def validate(self, data):
        student = data.get('student')
        subject = data.get('subject')
        madrasah = self.context['request'].user.madrasah
        if Enrollment.objects.filter(student=student, subject=subject, madrasah=madrasah).exists():
            raise serializers.ValidationError({'student': 'This student is already enrolled in this subject.'})
        return data
