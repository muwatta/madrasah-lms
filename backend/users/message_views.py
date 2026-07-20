from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Message, StudentParent, User
from .message_serializers import MessageSerializer


class MessageListView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer

    def get_queryset(self):
        user = self.request.user
        folder = self.request.query_params.get('folder', 'inbox')
        if folder == 'sent':
            return Message.objects.filter(sender=user, madrasah=user.madrasah)
        return Message.objects.filter(recipient=user, madrasah=user.madrasah)

    def perform_create(self, serializer):
        serializer.save(madrasah=self.request.user.madrasah, sender=self.request.user)


class MessageDetailView(generics.RetrieveAPIView):
    serializer_class = MessageSerializer

    def get_queryset(self):
        user = self.request.user
        return Message.objects.filter(madrasah=user.madrasah)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.recipient == request.user and not instance.is_read:
            instance.is_read = True
            instance.save(update_fields=['is_read'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class MessageUnreadCountView(APIView):
    def get(self, request):
        count = Message.objects.filter(recipient=request.user, is_read=False).count()
        return Response({'unread_count': count})


class ParentStudentsView(APIView):
    def get(self, request):
        links = StudentParent.objects.filter(parent=request.user).select_related('student')
        students = [link.student for link in links]
        return Response([{
            'id': s.id,
            'name': s.get_full_name(),
            'email': s.email,
        } for s in students])


class TeacherParentsView(APIView):
    def get(self, request):
        from curriculum.models import Enrollment
        student_ids = Enrollment.objects.filter(
            ustaadh=request.user
        ).values_list('student_id', flat=True).distinct()
        parent_ids = StudentParent.objects.filter(
            student_id__in=student_ids
        ).values_list('parent_id', flat=True).distinct()
        parents = User.objects.filter(id__in=parent_ids, role='parent')
        return Response([{
            'id': p.id,
            'name': p.get_full_name(),
            'email': p.email,
        } for p in parents])