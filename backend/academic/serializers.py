from rest_framework import serializers
from .models import (
    Session, Term, AcademicCalendar, ClassArm,
    Timetable, TimetableSlot,
)


class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = ['id', 'madrasah', 'name', 'start_date', 'end_date', 'is_current', 'created_at']
        read_only_fields = ['madrasah']


class TermSerializer(serializers.ModelSerializer):
    class Meta:
        model = Term
        fields = ['id', 'madrasah', 'session', 'name', 'term_number', 'start_date', 'end_date', 'is_current', 'created_at']
        read_only_fields = ['madrasah']


class AcademicCalendarSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicCalendar
        fields = ['id', 'madrasah', 'title', 'description', 'event_type', 'start_date', 'end_date', 'is_recurring', 'created_at']
        read_only_fields = ['madrasah']


class ClassArmSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassArm
        fields = ['id', 'madrasah', 'school_class', 'name', 'created_at']
        read_only_fields = ['madrasah']


class TimetableSlotSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name_ar', read_only=True)
    teacher_name = serializers.SerializerMethodField()

    class Meta:
        model = TimetableSlot
        fields = [
            'id', 'timetable', 'day_of_week', 'start_time', 'end_time',
            'subject', 'subject_name', 'teacher', 'teacher_name', 'room', 'created_at',
        ]

    def get_teacher_name(self, obj):
        if obj.teacher:
            return obj.teacher.get_full_name()
        return None


class TimetableSerializer(serializers.ModelSerializer):
    slot_count = serializers.SerializerMethodField()

    class Meta:
        model = Timetable
        fields = ['id', 'madrasah', 'name', 'school_class', 'class_arm', 'term', 'is_active', 'slot_count', 'created_at', 'updated_at']
        read_only_fields = ['madrasah', 'name']

    def get_slot_count(self, obj):
        return obj.slots.count()


class TimetableDetailSerializer(TimetableSerializer):
    slots = TimetableSlotSerializer(many=True, read_only=True)

    class Meta(TimetableSerializer.Meta):
        fields = TimetableSerializer.Meta.fields + ['slots']
