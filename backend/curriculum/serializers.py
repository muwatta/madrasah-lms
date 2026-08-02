from rest_framework import serializers
from .models import Subject, Topic, SchoolClass, ClassSubject


class SchoolClassSerializer(serializers.ModelSerializer):
    class_teacher_name = serializers.CharField(source='class_teacher.get_full_name', read_only=True, default=None)

    class Meta:
        model = SchoolClass
        fields = ['id', 'madrasah', 'name_ar', 'name_en', 'order', 'class_teacher', 'class_teacher_name']
        read_only_fields = ['madrasah']


class TopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Topic
        fields = ['id', 'subject', 'name', 'surah_number', 'description', 'created_at']
        read_only_fields = ['subject']


class SubjectSerializer(serializers.ModelSerializer):
    topics = TopicSerializer(many=True, read_only=True)
    topic_count = serializers.SerializerMethodField()

    class Meta:
        model = Subject
        fields = ['id', 'madrasah', 'name_ar', 'name_en', 'code', 'description', 'topics', 'topic_count', 'created_at']
        read_only_fields = ['madrasah']

    def get_topic_count(self, obj):
        return getattr(obj, 'topic_count', None) or obj.topics.count()


class ClassSubjectSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name_ar', read_only=True)
    subject_name_en = serializers.CharField(source='subject.name_en', read_only=True)
    school_class_name = serializers.CharField(source='school_class.name_en', read_only=True, default=None)
    school_class_name_ar = serializers.CharField(source='school_class.name_ar', read_only=True, default=None)

    class Meta:
        model = ClassSubject
        fields = [
            'id', 'madrasah', 'school_class', 'school_class_name', 'school_class_name_ar',
            'subject', 'subject_name', 'subject_name_en', 'created_at'
        ]
        read_only_fields = ['madrasah']


class SubjectListSerializer(serializers.ModelSerializer):
    topic_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Subject
        fields = ['id', 'madrasah', 'name_ar', 'name_en', 'code', 'description', 'topic_count', 'created_at']
        read_only_fields = ['madrasah']
