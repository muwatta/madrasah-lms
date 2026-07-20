from rest_framework import serializers
from .models import MemorizationTracker, RevisionSchedule, TajwidAssessment, PrayerTimetable


class MemorizationTrackerSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True, default=None)

    class Meta:
        model = MemorizationTracker
        fields = [
            'id', 'madrasah', 'student', 'student_name', 'surah_number', 'surah_name',
            'ayah_start', 'ayah_end', 'memorization_date', 'score', 'notes',
            'teacher', 'teacher_name', 'created_at', 'updated_at',
        ]
        read_only_fields = ['madrasah']


class RevisionScheduleSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)

    class Meta:
        model = RevisionSchedule
        fields = [
            'id', 'madrasah', 'student', 'student_name', 'surah_number', 'surah_name',
            'ayah_start', 'ayah_end', 'revision_date', 'completed', 'completed_at',
            'score', 'notes', 'created_at',
        ]
        read_only_fields = ['madrasah']


class TajwidAssessmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True, default=None)

    class Meta:
        model = TajwidAssessment
        fields = [
            'id', 'madrasah', 'student', 'student_name', 'teacher', 'teacher_name',
            'assessment_date', 'surah_number', 'surah_name', 'ayah_range',
            'makharij_score', 'sifaat_score', 'ghunna_score', 'madd_score',
            'waqf_score', 'overall_score', 'notes', 'audio_submission', 'created_at',
        ]
        read_only_fields = ['madrasah']


class PrayerTimetableSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrayerTimetable
        fields = [
            'id', 'madrasah', 'date', 'fajr', 'sunrise', 'dhuhr', 'asr',
            'maghrib', 'isha', 'jumuah_khutbah', 'created_at',
        ]
        read_only_fields = ['madrasah']
