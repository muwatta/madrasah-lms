from rest_framework import serializers
from .models import LessonPlan, Homework, HomeworkSubmission


class LessonPlanSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name_ar', read_only=True)
    school_class_name = serializers.CharField(source='school_class.name_ar', read_only=True)
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    class_arm_name = serializers.CharField(source='class_arm.name', read_only=True, default=None)
    term_name = serializers.CharField(source='term.name', read_only=True, default=None)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True, default=None)
    class_obj = serializers.PrimaryKeyRelatedField(source='school_class', read_only=True)
    class_name = serializers.CharField(source='school_class.name_ar', read_only=True)
    date = serializers.DateField(source='lesson_date', read_only=True)

    class Meta:
        model = LessonPlan
        fields = [
            'id', 'madrasah', 'teacher', 'teacher_name', 'subject', 'subject_name',
            'school_class', 'school_class_name', 'class_obj', 'class_name',
            'class_arm', 'class_arm_name',
            'term', 'term_name', 'title', 'lesson_date', 'date', 'start_time', 'end_time',
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
    class_obj = serializers.PrimaryKeyRelatedField(source='school_class', read_only=True)
    class_name = serializers.CharField(source='school_class.name_ar', read_only=True)
    submissions_count = serializers.IntegerField(source='submission_count', read_only=True, default=0)
    status = serializers.SerializerMethodField()

    class Meta:
        model = Homework
        fields = [
            'id', 'madrasah', 'lesson_plan', 'teacher', 'teacher_name',
            'subject', 'subject_name', 'school_class', 'school_class_name',
            'class_obj', 'class_name',
            'title', 'description', 'due_date', 'total_marks', 'attachments', 'file',
            'is_published', 'late_submission_allowed',
            'submission_count', 'submissions_count', 'status', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'madrasah', 'created_at', 'updated_at']

    def get_status(self, obj):
        if not obj.is_published:
            return 'closed'
        from django.utils import timezone
        if obj.due_date < timezone.now():
            return 'overdue'
        return 'active'


class HomeworkSubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    homework_title = serializers.CharField(source='homework.title', read_only=True)
    graded_by_name = serializers.CharField(source='graded_by.get_full_name', read_only=True, default=None)
    answer_text = serializers.CharField(source='content', read_only=True, allow_null=True)
    is_graded = serializers.SerializerMethodField()

    class Meta:
        model = HomeworkSubmission
        fields = [
            'id', 'madrasah', 'homework', 'homework_title',
            'student', 'student_name', 'submitted_at', 'content', 'answer_text', 'file', 'attachments',
            'is_late', 'score', 'feedback', 'graded_by', 'graded_by_name',
            'graded_at', 'status', 'is_graded',
        ]
        read_only_fields = [
            'id', 'madrasah', 'student', 'submitted_at', 'is_late',
            'score', 'feedback', 'graded_by', 'graded_at', 'status',
        ]

    def get_is_graded(self, obj):
        return obj.score is not None


class HomeworkSubmissionGradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = HomeworkSubmission
        fields = ['score', 'feedback', 'status']
