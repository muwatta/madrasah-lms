from rest_framework import generics
from .models import Subject, Topic, SchoolClass
from .serializers import SubjectSerializer, SubjectListSerializer, TopicSerializer, SchoolClassSerializer


class SchoolClassListView(generics.ListCreateAPIView):
    serializer_class = SchoolClassSerializer

    def get_queryset(self):
        return SchoolClass.objects.filter(madrasah=self.request.user.madrasah)

    def perform_create(self, serializer):
        serializer.save(madrasah=self.request.user.madrasah)


class SubjectListView(generics.ListCreateAPIView):
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return SubjectSerializer
        return SubjectListSerializer

    def get_queryset(self):
        return Subject.objects.filter(madrasah=self.request.user.madrasah).prefetch_related('topics')

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
        serializer.save(subject_id=subject_id)


class TopicDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TopicSerializer

    def get_queryset(self):
        return Topic.objects.filter(subject__madrasah=self.request.user.madrasah)
