from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, Madrasah, StudentParent


class MadrasahSerializer(serializers.ModelSerializer):
    class Meta:
        model = Madrasah
        fields = ['id', 'name', 'address', 'city', 'phone', 'email', 'created_at']


class UserSerializer(serializers.ModelSerializer):
    madrasah_name = serializers.CharField(source='madrasah.name', read_only=True)
    full_name = serializers.CharField(source='get_full_name', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name', 'phone',
            'gender', 'address',
            'role', 'madrasah', 'madrasah_name', 'is_active', 'email_verified',
            'date_of_birth', 'date_joined'
        ]
        read_only_fields = ['id', 'date_joined', 'madrasah', 'email_verified']


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Self-service profile fields.

    A user may edit their own basic details and email. Changing the email
    clears verification for the new address; role and madrasah remain
    admin-managed.
    """
    email = serializers.EmailField(required=False)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone', 'gender', 'address',
                  'date_of_birth', 'email']

    def validate_email(self, value):
        user = self.instance
        if value and user is not None and value != user.email:
            if User.objects.filter(email__iexact=value).exclude(pk=user.pk).exists():
                raise serializers.ValidationError('This email is already in use.')
        return value

    def update(self, instance, validated_data):
        email = validated_data.pop('email', None)
        if email and email != instance.email:
            instance.email = email
            instance.email_verified = False
        return super().update(instance, validated_data)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'password', 'password_confirm', 'first_name', 'last_name', 'madrasah']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        validated_data['role'] = 'guest'
        validated_data['is_staff'] = False
        validated_data['is_superuser'] = False
        user = User.objects.create_user(**validated_data)
        return user


class AdminCreateUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=['ustaadh', 'mudeer', 'idaarah', 'student', 'parent'])

    class Meta:
        model = User
        fields = ['email', 'password', 'password_confirm', 'first_name', 'last_name', 'role']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        madrasah = self.context['request'].user.madrasah
        user = User.objects.create_user(**validated_data, madrasah=madrasah)
        return user


class GuestApprovalSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=['ustaadh', 'mudeer', 'idaarah', 'student', 'parent'])


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField()
    new_password = serializers.CharField(validators=[validate_password])

    def validate_old_password(self, value):
        if not self.context['request'].user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect')
        return value


class StudentParentSerializer(serializers.ModelSerializer):
    student_email = serializers.CharField(source='student.email', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    parent_email = serializers.CharField(source='parent.email', read_only=True)
    parent_name = serializers.CharField(source='parent.get_full_name', read_only=True)

    class Meta:
        model = StudentParent
        fields = ['id', 'student', 'student_email', 'student_name',
                  'parent', 'parent_email', 'parent_name', 'relationship']
