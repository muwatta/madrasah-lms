from rest_framework import serializers
from .models import (
    Question, Quiz, QuizQuestion, QuizAssignment,
    QuizAttempt, QuizAnswer, ViolationLog,
)


# ─── Question Bank ───────────────────────────────────────────────────────────

class QuestionSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    topic_name = serializers.CharField(source='topic.name', read_only=True, default='')
    school_class_name = serializers.CharField(source='school_class.name', read_only=True, default='')
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = Question
        fields = [
            'id', 'uuid', 'madrasah', 'subject', 'subject_name',
            'topic', 'topic_name', 'school_class', 'school_class_name',
            'question_type', 'difficulty', 'marks',
            'question_text', 'question_text_ar', 'options', 'correct_answer',
            'explanation', 'explanation_ar', 'is_active',
            'created_by', 'created_by_name', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'uuid', 'madrasah', 'created_by', 'created_at', 'updated_at']


class QuestionWriteSerializer(serializers.Serializer):
    subject = serializers.IntegerField()
    topic = serializers.IntegerField(required=False, default=None, allow_null=True)
    school_class = serializers.IntegerField(required=False, default=None, allow_null=True)
    question_type = serializers.ChoiceField(choices=['mcq', 'true_false'], default='mcq')
    difficulty = serializers.IntegerField(min_value=1, max_value=5, default=2)
    marks = serializers.DecimalField(max_digits=6, decimal_places=2, default=1.00)
    question_text = serializers.CharField()
    question_text_ar = serializers.CharField(required=False, default='')
    options = serializers.ListField(child=serializers.DictField(), required=False, default=list)
    correct_answer = serializers.CharField()
    explanation = serializers.CharField(required=False, default='')
    explanation_ar = serializers.CharField(required=False, default='')


# ─── Quiz ────────────────────────────────────────────────────────────────────

class QuizQuestionSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source='question.question_text', read_only=True)
    question_text_ar = serializers.CharField(source='question.question_text_ar', read_only=True)
    question_type = serializers.CharField(source='question.question_type', read_only=True)
    options = serializers.JSONField(source='question.options', read_only=True)
    effective_marks = serializers.DecimalField(max_digits=6, decimal_places=2, read_only=True)

    class Meta:
        model = QuizQuestion
        fields = [
            'id', 'quiz', 'question', 'sort_order', 'marks',
            'question_text', 'question_text_ar', 'question_type',
            'options', 'effective_marks',
        ]


class QuizSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    school_class_name = serializers.CharField(source='school_class.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    total_marks = serializers.DecimalField(max_digits=6, decimal_places=2, read_only=True)
    question_count = serializers.IntegerField(read_only=True)
    attempt_count = serializers.IntegerField(read_only=True)
    average_score = serializers.FloatField(read_only=True)
    is_available_now = serializers.BooleanField(read_only=True)

    class Meta:
        model = Quiz
        fields = [
            'id', 'uuid', 'madrasah', 'created_by', 'created_by_name',
            'title', 'description', 'instructions',
            'subject', 'subject_name', 'school_class', 'school_class_name',
            'session', 'term', 'difficulty', 'estimated_duration_minutes',
            'available_from', 'available_until',
            'time_limit_minutes', 'grace_period_minutes', 'max_attempts', 'passing_score',
            'marks_per_question', 'negative_marking', 'negative_mark_fraction',
            'randomize_questions', 'randomize_options',
            'one_question_per_page', 'allow_review', 'allow_back_navigation',
            'show_question_numbers', 'auto_save',
            'grading_mode',
            'require_fullscreen', 'max_violations', 'auto_submit_on_violations',
            'status', 'is_published',
            'total_marks', 'question_count', 'attempt_count', 'average_score',
            'is_available_now',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'uuid', 'madrasah', 'created_by', 'status', 'is_published',
            'created_at', 'updated_at',
        ]


class QuizWriteSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, default='')
    instructions = serializers.CharField(required=False, default='')
    subject = serializers.IntegerField()
    school_class = serializers.IntegerField()
    session = serializers.IntegerField(required=False, default=None, allow_null=True)
    term = serializers.IntegerField(required=False, default=None, allow_null=True)
    difficulty = serializers.IntegerField(min_value=1, max_value=5, default=2)
    estimated_duration_minutes = serializers.IntegerField(default=30)
    available_from = serializers.DateTimeField(required=False, default=None, allow_null=True)
    available_until = serializers.DateTimeField(required=False, default=None, allow_null=True)
    time_limit_minutes = serializers.IntegerField(default=30)
    grace_period_minutes = serializers.IntegerField(default=5)
    max_attempts = serializers.IntegerField(default=1)
    passing_score = serializers.DecimalField(max_digits=5, decimal_places=2, default=60.00)
    marks_per_question = serializers.DecimalField(max_digits=6, decimal_places=2, default=1.00)
    negative_marking = serializers.BooleanField(default=False)
    negative_mark_fraction = serializers.DecimalField(max_digits=3, decimal_places=2, default=0.25)
    randomize_questions = serializers.BooleanField(default=False)
    randomize_options = serializers.BooleanField(default=False)
    one_question_per_page = serializers.BooleanField(default=True)
    allow_review = serializers.BooleanField(default=True)
    allow_back_navigation = serializers.BooleanField(default=True)
    show_question_numbers = serializers.BooleanField(default=True)
    auto_save = serializers.BooleanField(default=True)
    grading_mode = serializers.ChoiceField(
        choices=['auto_immediate', 'auto_release_later', 'manual'], default='auto_release_later')
    require_fullscreen = serializers.BooleanField(default=False)
    max_violations = serializers.IntegerField(default=5)
    auto_submit_on_violations = serializers.BooleanField(default=True)
    question_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, default=list)
    assignment_class_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, default=list)


# ─── Quiz Attempt ────────────────────────────────────────────────────────────

class QuizAnswerSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source='question.question_text', read_only=True)
    question_text_ar = serializers.CharField(source='question.question_text_ar', read_only=True)
    question_type = serializers.CharField(source='question.question_type', read_only=True)
    options = serializers.JSONField(source='question.options', read_only=True)
    correct_answer = serializers.CharField(source='question.correct_answer', read_only=True)
    explanation = serializers.CharField(source='question.explanation', read_only=True)
    explanation_ar = serializers.CharField(source='question.explanation_ar', read_only=True)

    class Meta:
        model = QuizAnswer
        fields = [
            'id', 'attempt', 'question',
            'question_text', 'question_text_ar', 'question_type', 'options',
            'selected_answer', 'is_correct', 'marks_awarded',
            'is_flagged', 'time_spent_seconds', 'answered_at',
            'correct_answer', 'explanation', 'explanation_ar',
        ]
        read_only_fields = [
            'id', 'attempt', 'is_correct', 'marks_awarded',
            'correct_answer', 'explanation', 'explanation_ar',
        ]


class QuizAttemptSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)
    answers = QuizAnswerSerializer(many=True, read_only=True)
    violation_count = serializers.SerializerMethodField()

    class Meta:
        model = QuizAttempt
        fields = [
            'id', 'uuid', 'madrasah', 'quiz', 'quiz_title',
            'student', 'student_name', 'attempt_number', 'status',
            'score', 'total_marks', 'percentage', 'is_pass',
            'started_at', 'submitted_at', 'time_spent_seconds',
            'ip_address', 'answers', 'violation_count',
            'created_at',
        ]
        read_only_fields = [
            'id', 'uuid', 'madrasah', 'status', 'score', 'total_marks',
            'percentage', 'is_pass', 'submitted_at', 'time_spent_seconds',
            'created_at',
        ]

    def get_violation_count(self, obj):
        return obj.violations.count()


class StartAttemptSerializer(serializers.Serializer):
    quiz_id = serializers.IntegerField()


class SaveAnswerSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    selected_answer = serializers.CharField(max_length=10)


class FlagQuestionSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()


# ─── Violation Log ───────────────────────────────────────────────────────────

class ViolationLogSerializer(serializers.ModelSerializer):
    violation_display = serializers.CharField(
        source='get_violation_type_display', read_only=True)

    class Meta:
        model = ViolationLog
        fields = ['id', 'attempt', 'violation_type', 'violation_display', 'details', 'timestamp']
        read_only_fields = ['id', 'timestamp']


# ─── Quiz Assignment ─────────────────────────────────────────────────────────

class QuizAssignmentSerializer(serializers.ModelSerializer):
    school_class_name = serializers.CharField(source='school_class.name', read_only=True)

    class Meta:
        model = QuizAssignment
        fields = ['id', 'quiz', 'school_class', 'school_class_name',
                  'assigned_to_all', 'student_ids', 'created_at']
        read_only_fields = ['id', 'created_at']
