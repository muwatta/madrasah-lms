from rest_framework import serializers
from .models import FeeStructure, Fee, FeePayment, Attendance, Announcement, Notification


class FeeStructureSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeStructure
        fields = ['id', 'madrasah', 'name', 'name_ar', 'amount', 'description', 'is_active', 'created_at']
        read_only_fields = ['madrasah']


class FeePaymentSerializer(serializers.ModelSerializer):
    recorded_by_name = serializers.CharField(source='recorded_by.get_full_name', read_only=True, default=None)

    class Meta:
        model = FeePayment
        fields = ['id', 'fee', 'amount_paid', 'payment_date', 'payment_method', 'transaction_id', 'notes', 'recorded_by', 'recorded_by_name', 'created_at']
        read_only_fields = ['recorded_by', 'created_at']


class FeeSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    balance = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    payments = FeePaymentSerializer(many=True, read_only=True)
    fee_structure_name = serializers.CharField(source='fee_structure.name', read_only=True, default=None)

    class Meta:
        model = Fee
        fields = ['id', 'madrasah', 'student', 'student_name', 'fee_structure', 'fee_structure_name', 'amount', 'amount_paid', 'balance', 'due_date', 'description', 'status', 'payments', 'created_at']
        read_only_fields = ['madrasah', 'amount_paid']


class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    marked_by_name = serializers.CharField(source='marked_by.get_full_name', read_only=True, default=None)

    class Meta:
        model = Attendance
        fields = ['id', 'madrasah', 'student', 'student_name', 'date', 'status', 'marked_by', 'marked_by_name', 'notes', 'marked_at']
        read_only_fields = ['madrasah', 'marked_by', 'marked_at']


class AnnouncementSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = Announcement
        fields = ['id', 'madrasah', 'created_by', 'created_by_name', 'title', 'title_ar', 'message', 'audience', 'is_pinned', 'created_at']
        read_only_fields = ['madrasah', 'created_by']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'recipient', 'notification_type', 'title', 'message', 'link', 'is_read', 'created_at']
        read_only_fields = ['recipient']