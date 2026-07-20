import logging

from rest_framework import generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import FileResponse
from django.shortcuts import get_object_or_404

from .models import Certificate
from .serializers import CertificateSerializer, CertificateGenerateSerializer
from .services import generate_certificate
from users.models import User

logger = logging.getLogger(__name__)


class CertificateListCreateView(generics.ListCreateAPIView):
    serializer_class = CertificateSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        user = self.request.user
        qs = Certificate.objects.filter(madrasah=user.madrasah).select_related('student')
        if user.role == 'student':
            qs = qs.filter(student=user)
        return qs

    def perform_create(self, serializer):
        student_id = self.request.data.get('student') or self.request.user.id
        if not User.objects.filter(id=student_id, madrasah=self.request.user.madrasah, role='student').exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'error': 'Student not found in this madrasah'})
        serializer.save(
            madrasah=self.request.user.madrasah,
            student_id=student_id,
        )
        logger.info("Certificate created for student %s by user %s", student_id, self.request.user.id)


class CertificateDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = CertificateSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Certificate.objects.filter(madrasah=user.madrasah).select_related('student')
        if user.role == 'student':
            qs = qs.filter(student=user)
        return qs


class CertificateGenerateView(generics.CreateAPIView):
    serializer_class = CertificateGenerateSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        student_id = request.data.get('student') or request.user.id
        if not User.objects.filter(id=student_id, madrasah=request.user.madrasah, role='student').exists():
            return Response({'error': 'Student not found in this madrasah'}, status=status.HTTP_400_BAD_REQUEST)
        cert = Certificate.objects.create(
            madrasah=request.user.madrasah,
            student_id=student_id,
            certificate_type=serializer.validated_data['certificate_type'],
            title=serializer.validated_data['title'],
            description=serializer.validated_data.get('description', ''),
            metadata=serializer.validated_data.get('metadata', {}),
        )

        try:
            pdf_buf = generate_certificate(cert)
            filename = f'certificate_{cert.certificate_number}.pdf'
            cert.file.save(filename, FileContent(pdf_buf), save=True)
        except Exception as e:
            return Response({'error': f'PDF generation failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        logger.info("Certificate %s generated for student %s by user %s", cert.id, student_id, request.user.id)
        out = CertificateSerializer(cert)
        return Response(out.data, status=status.HTTP_201_CREATED)


class CertificateDownloadView(generics.GenericAPIView):
    def get(self, request, pk):
        cert = get_object_or_404(Certificate.objects.filter(madrasah=request.user.madrasah), pk=pk)
        if request.user.role == 'student' and cert.student != request.user:
            return Response({'error': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        if not cert.file:
            return Response({'error': 'Certificate PDF not generated yet'}, status=status.HTTP_404_NOT_FOUND)
        return FileResponse(cert.file.open('rb'), content_type='application/pdf',
                            filename=f'{cert.certificate_number}.pdf')


class FileContent:
    def __init__(self, buf):
        self.buf = buf

    def read(self, *args, **kwargs):
        return self.buf.read(*args, **kwargs)

    def seek(self, *args, **kwargs):
        return self.buf.seek(*args, **kwargs)

    def __len__(self):
        return len(self.buf.getvalue())

    def open(self, *args, **kwargs):
        return self

    def close(self):
        pass

    @property
    def size(self):
        return len(self.buf.getvalue())
