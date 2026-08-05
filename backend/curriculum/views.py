from django.db.models import Count
from rest_framework import generics
from rest_framework.exceptions import NotFound, PermissionDenied
from config.permissions import IsMudeer, CanManageClassSubjects
from .models import Subject, Topic, SchoolClass, ClassSubject, Enrollment
from .serializers import (
    SubjectSerializer,
    SubjectListSerializer,
    TopicSerializer,
    SchoolClassSerializer,
    ClassSubjectSerializer,
)


class SchoolClassListView(generics.ListCreateAPIView):
    serializer_class = SchoolClassSerializer

    def get_queryset(self):
        return SchoolClass.objects.filter(madrasah=self.request.user.madrasah).select_related('class_teacher')

    def perform_create(self, serializer):
        serializer.save(madrasah=self.request.user.madrasah)


class SchoolClassDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SchoolClassSerializer
    permission_classes = [IsMudeer]

    def get_queryset(self):
        return SchoolClass.objects.filter(madrasah=self.request.user.madrasah).select_related('class_teacher')


class ClassSubjectListCreateView(generics.ListCreateAPIView):
    serializer_class = ClassSubjectSerializer
    permission_classes = [CanManageClassSubjects]

    def get_queryset(self):
        user = self.request.user
        qs = ClassSubject.objects.filter(madrasah=user.madrasah).select_related('school_class', 'subject')
        class_id = self.request.query_params.get('school_class')
        if class_id:
            qs = qs.filter(school_class_id=class_id)
        if user.role not in ('mudeer', 'idaarah'):
            qs = qs.filter(school_class__class_teacher=user)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        school_class = serializer.validated_data.get('school_class')
        if user.role not in ('mudeer', 'idaarah'):
            if school_class is None or school_class.class_teacher_id != user.id:
                raise PermissionDenied('Only the class teacher can manage this class.')
        serializer.save(madrasah=user.madrasah)


class ClassSubjectDestroyView(generics.DestroyAPIView):
    serializer_class = ClassSubjectSerializer
    permission_classes = [CanManageClassSubjects]

    def get_queryset(self):
        user = self.request.user
        qs = ClassSubject.objects.filter(madrasah=user.madrasah)
        if user.role not in ('mudeer', 'idaarah'):
            qs = qs.filter(school_class__class_teacher=user)
        return qs

    def perform_destroy(self, instance):
        # Dropping a subject from a class also removes those students' enrollments
        # so enrollments always stay within the class's attached subjects.
        Enrollment.objects.filter(
            madrasah=instance.madrasah,
            school_class=instance.school_class,
            subject=instance.subject,
        ).delete()
        instance.delete()


class SubjectListView(generics.ListCreateAPIView):
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return SubjectSerializer
        return SubjectListSerializer

    def get_queryset(self):
        return Subject.objects.filter(madrasah=self.request.user.madrasah).annotate(topic_count=Count('topics')).order_by('id')

    def perform_create(self, serializer):
        serializer.save(madrasah=self.request.user.madrasah)


class SubjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SubjectSerializer

    def get_queryset(self):
        return Subject.objects.filter(madrasah=self.request.user.madrasah).prefetch_related('topics')


class TopicListView(generics.ListCreateAPIView):
    serializer_class = TopicSerializer

    def get_queryset(self):
        subject_id = self.kwargs.get('subject_pk')
        return Topic.objects.filter(subject_id=subject_id, subject__madrasah=self.request.user.madrasah)

    def perform_create(self, serializer):
        subject_id = self.kwargs.get('subject_pk')
        if not Subject.objects.filter(pk=subject_id, madrasah=self.request.user.madrasah).exists():
            raise NotFound('Subject not found')
        serializer.save(subject_id=subject_id)


class TopicDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TopicSerializer

    def get_queryset(self):
        return Topic.objects.filter(subject__madrasah=self.request.user.madrasah)
