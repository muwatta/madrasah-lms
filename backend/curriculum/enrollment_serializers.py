from rest_framework import serializers
from .models import Enrollment, ClassSubject


class EnrollmentSerializer(serializers.ModelSerializer):
    student_email = serializers.CharField(source='student.email', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    subject_name = serializers.CharField(source='subject.name_ar', read_only=True)
    subject_name_en = serializers.CharField(source='subject.name_en', read_only=True)
    ustaadh_name = serializers.CharField(source='ustaadh.get_full_name', read_only=True, default=None)
    school_class_name = serializers.CharField(source='school_class.name_en', read_only=True, default=None)
    school_class_name_ar = serializers.CharField(source='school_class.name_ar', read_only=True, default=None)

    class Meta:
        model = Enrollment
        fields = [
            'id', 'madrasah', 'student', 'student_email', 'student_name',
            'subject', 'subject_name', 'subject_name_en',
            'school_class', 'school_class_name', 'school_class_name_ar',
            'ustaadh', 'ustaadh_name', 'enrolled_at'
        ]
        read_only_fields = ['madrasah', 'enrolled_at']

    def _is_class_subject(self, madrasah, school_class, subject):
        return ClassSubject.objects.filter(
            madrasah=madrasah, school_class=school_class, subject=subject
        ).exists()

    def validate(self, data):
        student = data.get('student')
        subject = data.get('subject')
        school_class = data.get('school_class')
        madrasah = self.context['request'].user.madrasah

        if Enrollment.objects.filter(student=student, subject=subject, madrasah=madrasah).exists():
            raise serializers.ValidationError({'student': 'This student is already enrolled in this subject.'})

        # A student may only be enrolled in subjects attached to their class.
        if school_class is not None:
            if not self._is_class_subject(madrasah, school_class, subject):
                raise serializers.ValidationError({
                    'subject': 'This subject is not attached to the selected class.'
                })
        elif student is not None:
            existing = (
                Enrollment.objects.filter(student=student, madrasah=madrasah)
                .exclude(school_class__isnull=True)
                .select_related('school_class')
                .first()
            )
            if existing and not self._is_class_subject(madrasah, existing.school_class, subject):
                raise serializers.ValidationError({
                    'subject': "This subject is not attached to the student's class."
                })

        return data
