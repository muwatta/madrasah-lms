from rest_framework import serializers
from .models import Exam, ExamResult, ResultTemplate, ResultTemplateItem, ResultComponent, StudentResult, TermResult
from academic.models import Session, Term


class ExamSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    subject_name = serializers.CharField(source='subject.name_ar', read_only=True)
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


class TermSerializer(serializers.ModelSerializer):
    class Meta:
        model = Term
        fields = ['id', 'session', 'name', 'term_number', 'start_date', 'end_date', 'hijri_start', 'hijri_end', 'is_current']


class SessionSerializer(serializers.ModelSerializer):
    terms = TermSerializer(many=True, read_only=True)

    class Meta:
        model = Session
        fields = ['id', 'madrasah', 'name', 'hijri_year', 'start_date', 'end_date', 'is_current', 'terms']


class ResultTemplateItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResultTemplateItem
        fields = ['id', 'template', 'component_type', 'name', 'weight', 'order']


class ResultTemplateSerializer(serializers.ModelSerializer):
    items = ResultTemplateItemSerializer(many=True, read_only=True)
    school_class_name = serializers.CharField(source='school_class.name_en', read_only=True)

    class Meta:
        model = ResultTemplate
        fields = ['id', 'madrasah', 'school_class', 'school_class_name', 'name', 'items', 'created_by', 'created_at', 'updated_at']
        read_only_fields = ['madrasah', 'created_by']


class ResultComponentSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name_ar', read_only=True)
    term_name = serializers.CharField(source='term.name', read_only=True)
    class_name = serializers.CharField(source='school_class.name_en', read_only=True)
    score_count = serializers.SerializerMethodField()

    class Meta:
        model = ResultComponent
        fields = [
            'id', 'madrasah', 'subject', 'subject_name', 'term', 'term_name',
            'school_class', 'class_name', 'template_item', 'component_type', 'name',
            'max_score', 'weight', 'score_count', 'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['madrasah', 'created_by']

    def get_score_count(self, obj):
        return obj.scores.count()


class StudentResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    component_name = serializers.CharField(source='component.name', read_only=True)

    class Meta:
        model = StudentResult
        fields = ['id', 'component', 'component_name', 'student', 'student_name', 'score', 'remarks', 'entered_by', 'created_at', 'updated_at']
        read_only_fields = ['entered_by']


class BulkScoreInputSerializer(serializers.Serializer):
    scores = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        )
    )

    def validate_scores(self, value):
        for item in value:
            if 'student' not in item or 'score' not in item:
                raise serializers.ValidationError("Each entry must have 'student' and 'score'")
        return value


class TermResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    subject_name = serializers.CharField(source='subject.name_ar', read_only=True)
    term_name = serializers.CharField(source='term.name', read_only=True)
    term_number = serializers.IntegerField(source='term.term_number', read_only=True)
    components = serializers.SerializerMethodField()

    class Meta:
        model = TermResult
        fields = [
            'id', 'student', 'student_name', 'subject', 'subject_name',
            'term', 'term_name', 'term_number', 'total_score', 'grade', 'status',
            'components', 'published_by', 'published_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['total_score', 'grade', 'published_by', 'published_at']

    def get_components(self, obj):
        scores = StudentResult.objects.filter(
            component__subject=obj.subject,
            component__term=obj.term,
            student=obj.student
        ).select_related('component')
        return [
            {
                'id': s.id,
                'component_id': s.component_id,
                'component_name': s.component.name,
                'component_type': s.component.component_type,
                'score': str(s.score),
                'max_score': str(s.component.max_score),
                'weight': str(s.component.weight),
                'remarks': s.remarks,
            }
            for s in scores
        ]
