from rest_framework import serializers
from .models import Question, Quiz, QuizAttempt


class QuestionSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    topic_name = serializers.CharField(source='topic.name', read_only=True)

    class Meta:
        model = Question
        fields = [
            'id', 'madrasah', 'topic', 'topic_name', 'question_text', 'question_type',
            'options', 'correct_answer', 'explanation', 'difficulty',
            'created_by', 'created_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at']


class QuestionListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'question_text', 'question_type', 'difficulty', 'topic', 'created_at']


class QuizSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    question_count = serializers.IntegerField(read_only=True)
    attempt_count = serializers.IntegerField(read_only=True)
    average_score = serializers.FloatField(read_only=True)

    class Meta:
        model = Quiz
        fields = [
            'id', 'madrasah', 'subject', 'subject_name', 'created_by', 'created_by_name',
            'title', 'description', 'question_ids', 'quiz_type',
            'time_limit_minutes', 'passing_score', 'is_published',
            'question_count', 'attempt_count', 'average_score',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']


class QuizListSerializer(serializers.ModelSerializer):
    question_count = serializers.IntegerField(read_only=True)
    attempt_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Quiz
        fields = [
            'id', 'title', 'subject', 'quiz_type', 'question_count',
            'attempt_count', 'is_published', 'created_at'
        ]


class QuizAttemptSerializer(serializers.ModelSerializer):
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)

    class Meta:
        model = QuizAttempt
        fields = [
            'id', 'quiz', 'quiz_title', 'student', 'student_name',
            'answers', 'score', 'percentage', 'attempt_number',
            'started_at', 'submitted_at'
        ]
        read_only_fields = ['id', 'score', 'percentage', 'started_at']


class QuizAttemptDetailSerializer(serializers.ModelSerializer):
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    results = serializers.SerializerMethodField()

    class Meta:
        model = QuizAttempt
        fields = [
            'id', 'quiz', 'quiz_title', 'student', 'student_name',
            'answers', 'score', 'percentage', 'attempt_number',
            'started_at', 'submitted_at', 'results'
        ]

    def get_results(self, obj):
        from assessments.grading import grade_quiz
        if obj.percentage is not None:
            return None
        return None
