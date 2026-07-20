from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from curriculum.models import Enrollment, SchoolClass, Subject
from users.models import User

from .models import Application, ApplicationDocument
from .serializers import (
    ApplicationSerializer,
    ApplicationDocumentSerializer,
    ApplicationListSerializer,
)


class ApplicationListView(generics.ListCreateAPIView):
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ApplicationSerializer
        return ApplicationListSerializer

    def get_queryset(self):
        qs = Application.objects.filter(madrasah=self.request.user.madrasah)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def perform_create(self, serializer):
        serializer.save(madrasah=self.request.user.madrasah)


class ApplicationDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ApplicationSerializer

    def get_queryset(self):
        return Application.objects.filter(madrasah=self.request.user.madrasah)


class ApplicationAcceptView(APIView):
    def post(self, request, pk):
        application = Application.objects.filter(
            pk=pk, madrasah=request.user.madrasah
        ).first()
        if not application:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        if application.status == 'rejected':
            return Response(
                {'detail': 'Cannot accept a rejected application.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        application.status = 'accepted'
        application.accepted_at = timezone.now()
        application.save()
        return Response(ApplicationSerializer(application).data)


class ApplicationRejectView(APIView):
    def post(self, request, pk):
        application = Application.objects.filter(
            pk=pk, madrasah=request.user.madrasah
        ).first()
        if not application:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        reason = request.data.get('reason', '')
        application.status = 'rejected'
        application.rejected_reason = reason
        application.save()
        return Response(ApplicationSerializer(application).data)


class ApplicationEnrollView(APIView):
    def post(self, request, pk):
        application = Application.objects.filter(
            pk=pk, madrasah=request.user.madrasah
        ).first()
        if not application:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        if application.status == 'rejected':
            return Response(
                {'detail': 'Cannot enroll a rejected application.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        madrasah = request.user.madrasah

        user = User.objects.create_user(
            email=application.email,
            password=User.objects.make_random_password(),
            first_name=application.first_name,
            last_name=application.last_name,
            role='student',
            madrasah=madrasah,
        )

        subjects = Subject.objects.filter(madrasah=madrasah)
        school_class = application.applying_for_class
        for subject in subjects:
            Enrollment.objects.get_or_create(
                student=user,
                subject=subject,
                madrasah=madrasah,
                defaults={'school_class': school_class},
            )

        application.status = 'enrolled'
        application.enrolled_at = timezone.now()
        application.save()

        return Response(
            {
                'detail': 'Student enrolled successfully.',
                'application': ApplicationSerializer(application).data,
                'student_id': user.id,
                'email': user.email,
            },
            status=status.HTTP_201_CREATED,
        )


class ApplicationDocumentListCreateView(generics.ListCreateAPIView):
    serializer_class = ApplicationDocumentSerializer

    def get_queryset(self):
        return ApplicationDocument.objects.filter(
            application_id=self.kwargs['pk'],
            application__madrasah=self.request.user.madrasah,
        )

    def perform_create(self, serializer):
        application = Application.objects.filter(
            pk=self.kwargs['pk'], madrasah=self.request.user.madrasah
        ).first()
        if not application:
            from rest_framework.exceptions import NotFound
            raise NotFound
        serializer.save(application=application)


class ApplicationDocumentDeleteView(generics.DestroyAPIView):
    serializer_class = ApplicationDocumentSerializer

    def get_queryset(self):
        return ApplicationDocument.objects.filter(
            pk=self.kwargs['doc_pk'],
            application__pk=self.kwargs['pk'],
            application__madrasah=self.request.user.madrasah,
        )
