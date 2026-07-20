from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.conf import settings
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import User
from .email import send_email, render_reset_email, render_verify_email

token_generator = PasswordResetTokenGenerator()


class RequestPasswordResetView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '')
        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            return Response({'message': 'If that email exists, a reset link has been sent.'})

        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        token = token_generator.make_token(user)
        reset_link = f"{settings.FRONTEND_URL}/reset-password?uidb64={uidb64}&token={token}"

        send_email(
            to=user.email,
            subject='Reset Your Madrasah LMS Password',
            html_body=render_reset_email(reset_link, user.get_full_name()),
        )

        return Response({'message': 'If that email exists, a reset link has been sent.'})


class ConfirmPasswordResetView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uidb64 = request.data.get('uidb64', '')
        token = request.data.get('token', '')
        new_password = request.data.get('new_password', '')

        if not all([uidb64, token, new_password]):
            return Response({'error': 'uidb64, token, and new_password are required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError as DjangoValidationError
        try:
            validate_password(new_password)
        except DjangoValidationError as e:
            return Response({'error': list(e.messages)}, status=status.HTTP_400_BAD_REQUEST)

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid, is_active=True)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            return Response({'error': 'Invalid reset link.'}, status=status.HTTP_400_BAD_REQUEST)

        if not token_generator.check_token(user, token):
            return Response({'error': 'Invalid or expired reset link.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        return Response({'message': 'Password reset successfully.'})


class RequestEmailVerificationView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '')
        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            return Response({'message': 'If that email exists, a verification link has been sent.'})

        if user.email_verified:
            return Response({'message': 'Email is already verified.'})

        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        token = token_generator.make_token(user)
        verify_link = f"{settings.FRONTEND_URL}/verify-email?uidb64={uidb64}&token={token}"

        send_email(
            to=user.email,
            subject='Verify Your Madrasah LMS Email',
            html_body=render_verify_email(verify_link, user.get_full_name()),
        )

        return Response({'message': 'If that email exists, a verification link has been sent.'})


class ConfirmEmailVerificationView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uidb64 = request.data.get('uidb64', '')
        token = request.data.get('token', '')

        if not all([uidb64, token]):
            return Response({'error': 'uidb64 and token are required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid, is_active=True)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            return Response({'error': 'Invalid verification link.'}, status=status.HTTP_400_BAD_REQUEST)

        if not token_generator.check_token(user, token):
            return Response({'error': 'Invalid or expired verification link.'}, status=status.HTTP_400_BAD_REQUEST)

        user.email_verified = True
        user.save()

        return Response({'message': 'Email verified successfully.'})
