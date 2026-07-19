from rest_framework import serializers
from .models import Subject, Topic


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
        fields = ['id', 'madrasah', 'name', 'description', 'level', 'topics', 'topic_count', 'created_at']
        read_only_fields = ['madrasah']

    def get_topic_count(self, obj):
        return obj.topics.count()


class SubjectListSerializer(serializers.ModelSerializer):
    topic_count = serializers.SerializerMethodField()

    class Meta:
        model = Subject
        fields = ['id', 'madrasah', 'name', 'description', 'level', 'topic_count', 'created_at']
        read_only_fields = ['madrasah']

    def get_topic_count(self, obj):
        return obj.topics.count()
