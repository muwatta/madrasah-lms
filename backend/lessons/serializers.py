from __future__ import annotations

from rest_framework import serializers
from django.utils.timezone import now

from .models import (
    SchemeOfWork, SchemeWeek, LearningObjective, LessonPlan,
    LessonResource, LessonDelivery, LessonReflection, LessonAuditLog,
    Homework, HomeworkSubmission, LessonAnalyticsSnapshot,
)
from .validators import (
    validate_learning_objectives, validate_student_activities,
    validate_lesson_duration, validate_reflection_rating,
    validate_resource_data,
)


# ──────────────────────────────────────────────────────
#  Scheme of Work
# ──────────────────────────────────────────────────────


class SchemeWeekSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchemeWeek
        fields = [
            'id', 'week_number', 'topic', 'subtopic',
            'learning_outcomes', 'reference_materials',
            'lesson_count', 'status', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class SchemeOfWorkSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name_ar', read_only=True)
    school_class_name = serializers.CharField(source='school_class.name_ar', read_only=True)
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    term_name = serializers.CharField(source='term.name', read_only=True)
    weeks = SchemeWeekSerializer(many=True, read_only=True)
    total_weeks = serializers.IntegerField(read_only=True)
    completion_percentage = serializers.FloatField(read_only=True)

    class Meta:
        model = SchemeOfWork
        fields = [
            'id', 'madrasah', 'teacher', 'teacher_name',
            'term', 'term_name', 'subject', 'subject_name',
            'school_class', 'school_class_name',
            'title', 'description', 'is_active',
            'total_weeks', 'completion_percentage',
            'weeks', 'created_by', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'madrasah', 'created_by', 'created_at', 'updated_at']


class SchemeOfWorkWriteSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, default='')
    term = serializers.IntegerField()
    subject = serializers.IntegerField()
    school_class = serializers.IntegerField()
    weeks = SchemeWeekSerializer(many=True, required=False, default=[])


# ──────────────────────────────────────────────────────
#  Learning Objective
# ──────────────────────────────────────────────────────


class LearningObjectiveSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name_ar', read_only=True, default=None)

    class Meta:
        model = LearningObjective
        fields = ['id', 'objective', 'subject', 'subject_name', 'created_at']
        read_only_fields = ['id', 'created_at']


# ──────────────────────────────────────────────────────
#  Lesson Plan (read)
# ──────────────────────────────────────────────────────


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
    resources_list = serializers.SerializerMethodField()

    class Meta:
        model = LessonPlan
        fields = [
            'id', 'uuid', 'madrasah', 'teacher', 'teacher_name',
            'subject', 'subject_name',
            'school_class', 'school_class_name', 'class_obj', 'class_name',
            'class_arm', 'class_arm_name',
            'term', 'term_name',
            'scheme_week', 'timetable_slot',
            'title', 'lesson_date', 'date',
            'start_time', 'end_time', 'room', 'duration_minutes',
            'learning_objectives', 'success_criteria', 'keywords',
            'prior_knowledge',
            'teaching_materials', 'references', 'teaching_methods',
            'introduction', 'lesson_development', 'student_activities',
            'differentiation', 'assessment', 'homework', 'resources',
            'status', 'approved_by', 'approved_by_name', 'approval_notes',
            'submitted_at', 'approved_at',
            'ai_generated', 'ai_prompt',
            'attachments', 'resources_list',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'uuid', 'madrasah', 'status', 'approved_by', 'approval_notes',
            'submitted_at', 'approved_at', 'created_at', 'updated_at',
        ]

    def get_resources_list(self, obj):
        resources = obj.resources_list.all() if hasattr(obj, 'resources_list') else []
        return LessonResourceSerializer(resources, many=True).data

    def validate_learning_objectives(self, value):
        if value:
            validate_learning_objectives(objectives=value)
        return value

    def validate_student_activities(self, value):
        if value:
            validate_student_activities(activities=value)
        return value

    def validate_duration_minutes(self, value):
        validate_lesson_duration(duration_minutes=value)
        return value


# ──────────────────────────────────────────────────────
#  Lesson Plan (write)
# ──────────────────────────────────────────────────────


class LessonPlanCreateSerializer(serializers.Serializer):
    subject = serializers.IntegerField()
    school_class = serializers.IntegerField()
    title = serializers.CharField(max_length=300)
    lesson_date = serializers.DateField()
    duration_minutes = serializers.IntegerField(default=45)
    start_time = serializers.TimeField(required=False, allow_null=True)
    end_time = serializers.TimeField(required=False, allow_null=True)
    room = serializers.CharField(required=False, default='')
    class_arm = serializers.IntegerField(required=False, allow_null=True)
    term = serializers.IntegerField(required=False, allow_null=True)
    scheme_week = serializers.IntegerField(required=False, allow_null=True)
    timetable_slot = serializers.IntegerField(required=False, allow_null=True)

    learning_objectives = serializers.ListField(
        child=serializers.CharField(), required=False, default=[])
    success_criteria = serializers.ListField(
        child=serializers.CharField(), required=False, default=[])
    keywords = serializers.ListField(
        child=serializers.CharField(), required=False, default=[])
    prior_knowledge = serializers.CharField(required=False, default='')
    teaching_materials = serializers.ListField(
        child=serializers.CharField(), required=False, default=[])
    references = serializers.ListField(
        child=serializers.CharField(), required=False, default=[])
    teaching_methods = serializers.ListField(
        child=serializers.CharField(), required=False, default=[])

    introduction = serializers.CharField(required=False, default='')
    lesson_development = serializers.CharField(required=False, default='')
    student_activities = serializers.ListField(
        child=serializers.CharField(), required=False, default=[])
    differentiation = serializers.CharField(required=False, default='')
    assessment = serializers.CharField(required=False, default='')
    homework = serializers.CharField(required=False, default='')
    resources = serializers.CharField(required=False, default='')

    ai_generated = serializers.BooleanField(default=False)
    ai_prompt = serializers.CharField(required=False, default='')
    attachments = serializers.ListField(required=False, default=[])


# ──────────────────────────────────────────────────────
#  Lesson Resource
# ──────────────────────────────────────────────────────


class LessonResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonResource
        fields = [
            'id', 'lesson', 'resource_type', 'title', 'url',
            'file', 'description', 'order', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def validate(self, data):
        validate_resource_data(
            resource_type=data.get('resource_type', ''),
            title=data.get('title', ''),
            url=data.get('url', ''),
        )
        return data


# ──────────────────────────────────────────────────────
#  Lesson Delivery
# ──────────────────────────────────────────────────────


class LessonDeliverySerializer(serializers.ModelSerializer):
    delivered_by_name = serializers.CharField(
        source='delivered_by.get_full_name', read_only=True)
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)
    attendance_rate = serializers.FloatField(read_only=True)

    class Meta:
        model = LessonDelivery
        fields = [
            'id', 'lesson', 'lesson_title', 'delivered_by', 'delivered_by_name',
            'delivery_date', 'delivery_status',
            'students_present', 'students_absent', 'total_students',
            'homework_given', 'assessment_conducted',
            'actual_duration_minutes', 'challenges', 'recommendations',
            'attendance_rate', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'delivered_by', 'created_at', 'updated_at']


# ──────────────────────────────────────────────────────
#  Lesson Reflection
# ──────────────────────────────────────────────────────


class LessonReflectionSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)

    class Meta:
        model = LessonReflection
        fields = [
            'id', 'lesson', 'lesson_title', 'teacher', 'teacher_name',
            'what_went_well', 'what_to_improve', 'student_understanding',
            'next_steps', 'self_rating', 'created_at',
        ]
        read_only_fields = ['id', 'teacher', 'created_at']

    def validate_self_rating(self, value):
        validate_reflection_rating(self_rating=value)
        return value


# ──────────────────────────────────────────────────────
#  Lesson Audit Log
# ──────────────────────────────────────────────────────


class LessonAuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source='actor.get_full_name', read_only=True, default=None)

    class Meta:
        model = LessonAuditLog
        fields = [
            'id', 'actor', 'actor_name', 'action', 'model_name',
            'object_id', 'previous_data', 'new_data', 'reason',
            'ip_address', 'created_at',
        ]
        read_only_fields = fields


# ──────────────────────────────────────────────────────
#  Homework (backward compatible)
# ──────────────────────────────────────────────────────


class HomeworkSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name_ar', read_only=True)
    school_class_name = serializers.CharField(source='school_class.name_ar', read_only=True)
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    submission_count = serializers.IntegerField(read_only=True, default=0)
    class_obj = serializers.PrimaryKeyRelatedField(source='school_class', read_only=True)
    class_name = serializers.CharField(source='school_class.name_ar', read_only=True)
    submissions_count = serializers.IntegerField(
        source='submission_count', read_only=True, default=0)
    status = serializers.SerializerMethodField()

    class Meta:
        model = Homework
        fields = [
            'id', 'madrasah', 'lesson_plan', 'teacher', 'teacher_name',
            'subject', 'subject_name', 'school_class', 'school_class_name',
            'class_obj', 'class_name',
            'title', 'description', 'due_date', 'total_marks',
            'attachments', 'file',
            'is_published', 'late_submission_allowed',
            'submission_count', 'submissions_count', 'status',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'madrasah', 'teacher', 'created_at', 'updated_at']

    def get_status(self, obj):
        if not obj.is_published:
            return 'closed'
        if obj.due_date < now():
            return 'overdue'
        return 'active'


class HomeworkSubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    homework_title = serializers.CharField(source='homework.title', read_only=True)
    graded_by_name = serializers.CharField(
        source='graded_by.get_full_name', read_only=True, default=None)
    answer_text = serializers.CharField(source='content', read_only=True, allow_null=True)
    is_graded = serializers.SerializerMethodField()

    class Meta:
        model = HomeworkSubmission
        fields = [
            'id', 'madrasah', 'homework', 'homework_title',
            'student', 'student_name', 'submitted_at',
            'content', 'answer_text', 'file', 'attachments',
            'is_late', 'score', 'feedback',
            'graded_by', 'graded_by_name', 'graded_at',
            'status', 'is_graded',
        ]
        read_only_fields = [
            'id', 'madrasah', 'homework', 'student', 'submitted_at', 'is_late',
            'score', 'feedback', 'graded_by', 'graded_at', 'status',
        ]

    def get_is_graded(self, obj):
        score = obj.get('score') if isinstance(obj, dict) else getattr(obj, 'score', None)
        return score is not None


class HomeworkSubmissionGradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = HomeworkSubmission
        fields = ['score', 'feedback', 'status']


# ──────────────────────────────────────────────────────
#  Analytics Snapshot
# ──────────────────────────────────────────────────────


class LessonAnalyticsSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    subject_name = serializers.CharField(source='subject.name_ar', read_only=True)
    school_class_name = serializers.CharField(source='school_class.name_ar', read_only=True)
    term_name = serializers.CharField(source='term.name', read_only=True)

    class Meta:
        model = LessonAnalyticsSnapshot
        fields = [
            'id', 'teacher', 'teacher_name',
            'subject', 'subject_name',
            'school_class', 'school_class_name',
            'term', 'term_name',
            'total_planned', 'total_delivered', 'total_missed',
            'completion_rate', 'avg_delivery_duration', 'avg_self_rating',
            'computed_at',
        ]
        read_only_fields = fields


# ──────────────────────────────────────────────────────
#  Approval action
# ──────────────────────────────────────────────────────


class LessonPlanApprovalSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['approved', 'rejected'])
    notes = serializers.CharField(required=False, default='')


# ──────────────────────────────────────────────────────
#  AI Generation
# ──────────────────────────────────────────────────────


class LessonPlanAIGenerateSerializer(serializers.Serializer):
    subject = serializers.IntegerField(help_text="Subject ID")
    school_class = serializers.IntegerField(help_text="School class ID")
    topic = serializers.CharField(max_length=500, help_text="Topic to teach")
    duration_minutes = serializers.IntegerField(default=45, min_value=15, max_value=180)
    teaching_methods = serializers.ListField(
        child=serializers.CharField(), required=False, default=[],
        help_text="Preferred teaching methods")
    language = serializers.ChoiceField(choices=['ar', 'en'], default='ar')


class SchemeAIGenerateSerializer(serializers.Serializer):
    subject = serializers.IntegerField(help_text="Subject ID")
    school_class = serializers.IntegerField(help_text="School class ID")
    term_weeks = serializers.IntegerField(default=12, min_value=4, max_value=24)
    topic_areas = serializers.ListField(
        child=serializers.CharField(), required=False, default=[],
        help_text="Optional topic focus areas")
    language = serializers.ChoiceField(choices=['ar', 'en'], default='ar')


class HomeworkAIGenerateSerializer(serializers.Serializer):
    lesson_plan = serializers.IntegerField(required=False, allow_null=True,
                                            help_text="Lesson plan ID (optional)")
    lesson_title = serializers.CharField(max_length=300)
    subject = serializers.IntegerField(help_text="Subject ID")
    topic_content = serializers.CharField(max_length=1000,
                                           help_text="What was covered in the lesson")
    total_marks = serializers.IntegerField(default=20, min_value=5, max_value=100)
    difficulty = serializers.ChoiceField(
        choices=['easy', 'medium', 'hard'], default='medium')
    language = serializers.ChoiceField(choices=['ar', 'en'], default='ar')


class LessonPlanAIRefineSerializer(serializers.Serializer):
    feedback = serializers.CharField(max_length=2000,
                                      help_text="What to improve or change")
    language = serializers.ChoiceField(choices=['ar', 'en'], default='ar')
