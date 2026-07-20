from rest_framework import serializers
from .models import LessonPlan, Homework, HomeworkSubmission


class LessonPlanSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name_ar', read_only=True)
    school_class_name = serializers.CharField(source='school_class.name_ar', read_only=True)
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    class_arm_name = serializers.CharField(source='class_arm.name', read_only=True, default=None)
    term_name = serializers.CharField(source='term.name', read_only=True, default=None)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True, default=None)

    class Meta:
        model = LessonPlan
        fields = [
            'id', 'madrasah', 'teacher', 'teacher_name', 'subject', 'subject_name',
            'school_class', 'school_class_name', 'class_arm', 'class_arm_name',
            'term', 'term_name', 'title', 'lesson_date', 'start_time', 'end_time',
            'objectives', 'resources', 'homework', 'notes', 'attachments',
            'status', 'approved_by', 'approved_by_name', 'approval_notes',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'madrasah', 'status', 'approved_by', 'approval_notes', 'created_at', 'updated_at']


class HomeworkSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name_ar', read_only=True)
    school_class_name = serializers.CharField(source='school_class.name_ar', read_only=True)
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    submission_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Homework
        fields = [
            'id', 'madrasah', 'lesson_plan', 'teacher', 'teacher_name',
            'subject', 'subject_name', 'school_class', 'school_class_name',
            'title', 'description', 'due_date', 'total_marks', 'attachments',
            'is_published', 'late_submission_allowed',
            'submission_count', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'madrasah', 'created_at', 'updated_at']


class HomeworkSubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    homework_title = serializers.CharField(source='homework.title', read_only=True)
    graded_by_name = serializers.CharField(source='graded_by.get_full_name', read_only=True, default=None)

    class Meta:
        model = HomeworkSubmission
        fields = [
            'id', 'madrasah', 'homework', 'homework_title',
            'student', 'student_name', 'submitted_at', 'content', 'attachments',
            'is_late', 'score', 'feedback', 'graded_by', 'graded_by_name',
            'graded_at', 'status',
        ]
        read_only_fields = [
            'id', 'madrasah', 'student', 'submitted_at', 'is_late',
            'score', 'feedback', 'graded_by', 'graded_at', 'status',
        ]


class HomeworkSubmissionGradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = HomeworkSubmission
        fields = ['score', 'feedback', 'status']
