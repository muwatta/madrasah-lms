import logging
from datetime import datetime, timezone

from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from config.permissions import IsMudeer
from .models import User, Madrasah, StudentParent, RefreshToken
from .serializers import (
    UserSerializer, RegisterSerializer, LoginSerializer, AdminCreateUserSerializer,
    ChangePasswordSerializer, MadrasahSerializer, StudentParentSerializer,
    GuestApprovalSerializer, ProfileUpdateSerializer,
)
from .authentication import generate_tokens
from .throttles import AuthAnonRateThrottle

logger = logging.getLogger(__name__)


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthAnonRateThrottle]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            tokens = generate_tokens(user)
            logger.info("New user registered: %s (role=%s)", user.id, user.role)
            return Response({
                'user': UserSerializer(user).data,
                'tokens': tokens,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthAnonRateThrottle]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = authenticate(
                email=serializer.validated_data['email'],
                password=serializer.validated_data['password']
            )
            if user:
                tokens = generate_tokens(user)
                logger.info("User %s logged in successfully", user.id)
                return Response({
                    'user': UserSerializer(user).data,
                    'tokens': tokens,
                })
            logger.warning("Failed login attempt for %s", serializer.validated_data.get('email', ''))
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RefreshTokenView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthAnonRateThrottle]

    def post(self, request):
        import jwt
        from django.conf import settings
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'error': 'Refresh token required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payload = jwt.decode(refresh_token, settings.JWT_SECRET, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Refresh token expired'}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)

        if payload.get('type') != 'refresh':
            return Response({'error': 'Invalid token type'}, status=status.HTTP_400_BAD_REQUEST)

        jti = payload.get('jti')
        if not jti:
            return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            token_record = RefreshToken.objects.select_for_update().get(jti=jti)
        except RefreshToken.DoesNotExist:
            return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)

        if token_record.is_revoked:
            token_record.user.refresh_tokens.update(is_revoked=True)
            return Response(
                {'error': 'Token reuse detected. Please log in again.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if token_record.expires_at < datetime.now(timezone.utc):
            return Response({'error': 'Refresh token expired'}, status=status.HTTP_401_UNAUTHORIZED)

        user = token_record.user
        if not user.is_active:
            return Response({'error': 'User is inactive'}, status=status.HTTP_401_UNAUTHORIZED)

        token_record.is_revoked = True
        token_record.save(update_fields=['is_revoked'])

        tokens = generate_tokens(user)
        return Response({'tokens': tokens})


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            logger.info("User %s updated their profile", request.user.id)
            return Response(UserSerializer(request.user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    patch = put


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            request.user.set_password(serializer.validated_data['new_password'])
            request.user.save()
            request.user.refresh_tokens.update(is_revoked=True)
            logger.info("Password changed for user %s", request.user.id)
            return Response({'message': 'Password changed successfully'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsMudeer]

    def get_queryset(self):
        qs = User.objects.filter(madrasah=self.request.user.madrasah).select_related('madrasah')
        role = self.request.query_params.get('role')
        if role:
            qs = qs.filter(role=role)
        return qs


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsMudeer]

    def get_queryset(self):
        return User.objects.filter(madrasah=self.request.user.madrasah).select_related('madrasah')


class AdminCreateUserView(APIView):
    permission_classes = [IsMudeer]

    def post(self, request):
        serializer = AdminCreateUserSerializer(
            data=request.data,
            context={'request': request},
        )
        if serializer.is_valid():
            user = serializer.save()
            logger.info("Admin %s created user %s (role=%s)", request.user.id, user.id, user.role)
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ApproveGuestView(APIView):
    permission_classes = [IsMudeer]

    def post(self, request, pk):
        try:
            guest = User.objects.get(pk=pk, madrasah=request.user.madrasah, role='guest')
        except User.DoesNotExist:
            return Response({'error': 'Guest not found'}, status=status.HTTP_404_NOT_FOUND)

        if not guest.email_verified:
            return Response(
                {'error': 'Cannot approve a guest until their email is verified.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = GuestApprovalSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        guest.role = serializer.validated_data['role']
        guest.is_active = True
        guest.save(update_fields=['role', 'is_active'])

        logger.info("Guest %s approved as %s by %s", guest.id, guest.role, request.user.id)
        return Response(UserSerializer(guest).data)


class MadrasahListView(generics.ListCreateAPIView):
    serializer_class = MadrasahSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Madrasah.objects.filter(id=self.request.user.madrasah_id)
        return Madrasah.objects.none()


class StudentParentListCreateView(generics.ListCreateAPIView):
    serializer_class = StudentParentSerializer

    def get_queryset(self):
        user = self.request.user
        qs = StudentParent.objects.select_related('student', 'parent')
        if user.role == 'parent':
            return qs.filter(parent=user)
        elif user.role == 'student':
            return qs.filter(student=user)
        return qs.filter(student__madrasah=user.madrasah)


class StudentParentDeleteView(generics.DestroyAPIView):
    serializer_class = StudentParentSerializer

    def get_queryset(self):
        return StudentParent.objects.filter(student__madrasah=self.request.user.madrasah)
