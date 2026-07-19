from rest_framework import generics
from .models import Subject, Topic
from .serializers import SubjectSerializer, SubjectListSerializer, TopicSerializer


class SubjectListView(generics.ListCreateAPIView):
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return SubjectSerializer
        return SubjectListSerializer

    def get_queryset(self):
        return Subject.objects.filter(madrasah=self.request.user.madrasah)

    def perform_create(self, serializer):
        serializer.save(madrasah=self.request.user.madrasah)


class SubjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SubjectSerializer

    def get_queryset(self):
        return Subject.objects.filter(madrasah=self.request.user.madrasah)


class TopicListView(generics.ListCreateAPIView):
    serializer_class = TopicSerializer

    def get_queryset(self):
        subject_id = self.kwargs.get('subject_pk')
        return Topic.objects.filter(subject_id=subject_id)

    def perform_create(self, serializer):
        serializer.save()


class TopicDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TopicSerializer

    def get_queryset(self):
        return Topic.objects.filter(subject__madrasah=self.request.user.madrasah)
