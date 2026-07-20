from rest_framework import serializers
from .models import CharacterTrait, CharacterEvaluation, CharacterScore


class CharacterTraitSerializer(serializers.ModelSerializer):
    class Meta:
        model = CharacterTrait
        fields = [
            'id', 'madrasah', 'name', 'name_ar', 'description',
            'category', 'is_active', 'sort_order', 'created_at',
        ]
        read_only_fields = ['madrasah']


class CharacterScoreSerializer(serializers.ModelSerializer):
    trait_name = serializers.CharField(source='trait.name', read_only=True)
    trait_name_ar = serializers.CharField(source='trait.name_ar', read_only=True)

    class Meta:
        model = CharacterScore
        fields = ['id', 'trait', 'trait_name', 'trait_name_ar', 'score', 'notes']
        read_only_fields = ['evaluation']


class CharacterEvaluationSerializer(serializers.ModelSerializer):
    scores = CharacterScoreSerializer(many=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)

    class Meta:
        model = CharacterEvaluation
        fields = [
            'id', 'madrasah', 'student', 'student_name',
            'teacher', 'teacher_name', 'evaluation_date', 'term',
            'overall_notes', 'scores', 'created_at', 'updated_at',
        ]
        read_only_fields = ['madrasah', 'teacher']

    def create(self, validated_data):
        scores_data = validated_data.pop('scores')
        evaluation = CharacterEvaluation.objects.create(**validated_data)
        score_objs = [
            CharacterScore(evaluation=evaluation, **s) for s in scores_data
        ]
        CharacterScore.objects.bulk_create(score_objs)
        return evaluation

    def update(self, instance, validated_data):
        scores_data = validated_data.pop('scores', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if scores_data is not None:
            instance.scores.all().delete()
            score_objs = [
                CharacterScore(evaluation=instance, **s) for s in scores_data
            ]
            CharacterScore.objects.bulk_create(score_objs)

        return instance


class CharacterEvaluationListSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    average_score = serializers.SerializerMethodField()

    class Meta:
        model = CharacterEvaluation
        fields = [
            'id', 'student', 'student_name', 'teacher', 'teacher_name',
            'evaluation_date', 'term', 'average_score', 'created_at',
        ]
        read_only_fields = ['madrasah']

    def get_average_score(self, obj):
        scores = obj.scores.values_list('score', flat=True)
        if scores:
            return round(sum(scores) / len(scores), 2)
        return None
