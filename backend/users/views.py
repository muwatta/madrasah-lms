import logging

from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from .models import User, Madrasah, StudentParent
from .serializers import (
    UserSerializer, RegisterSerializer, LoginSerializer,
    ChangePasswordSerializer, MadrasahSerializer, StudentParentSerializer
)
from .authentication import generate_tokens

logger = logging.getLogger(__name__)


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

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

    def post(self, request):
        import jwt
        from django.conf import settings
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'error': 'Refresh token required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payload = jwt.decode(refresh_token, settings.JWT_SECRET, algorithms=['HS256'])
            if payload.get('type') != 'refresh':
                return Response({'error': 'Invalid token type'}, status=status.HTTP_400_BAD_REQUEST)
            user = User.objects.get(id=payload['user_id'])
            tokens = generate_tokens(user)
            return Response({'tokens': tokens})
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Refresh token expired'}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)


class MeView(APIView):
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class ChangePasswordView(APIView):
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            request.user.set_password(serializer.validated_data['new_password'])
            request.user.save()
            logger.info("Password changed for user %s", request.user.id)
            return Response({'message': 'Password changed successfully'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer

    def get_queryset(self):
        return User.objects.filter(madrasah=self.request.user.madrasah).select_related('madrasah')


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserSerializer

    def get_queryset(self):
        return User.objects.filter(madrasah=self.request.user.madrasah).select_related('madrasah')


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
