from django.utils import timezone
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Question, Quiz, QuizAttempt
from .serializers import (
    QuestionSerializer, QuestionListSerializer,
    QuizSerializer, QuizListSerializer,
    QuizAttemptSerializer, QuizAttemptDetailSerializer
)
from .grading import grade_quiz


class QuestionListView(generics.ListCreateAPIView):
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return QuestionSerializer
        return QuestionListSerializer

    def get_queryset(self):
        qs = Question.objects.filter(madrasah=self.request.user.madrasah)
        ids = self.request.query_params.get('ids')
        topic_id = self.request.query_params.get('topic')
        q_type = self.request.query_params.get('type')
        difficulty = self.request.query_params.get('difficulty')
        search = self.request.query_params.get('search')

        if ids:
            id_list = [int(i) for i in ids.split(',') if i.strip().isdigit()]
            qs = qs.filter(id__in=id_list)
        if topic_id:
            qs = qs.filter(topic_id=topic_id)
        if q_type:
            qs = qs.filter(question_type=q_type)
        if difficulty:
            qs = qs.filter(difficulty=difficulty)
        if search:
            qs = qs.filter(question_text__icontains=search)
        return qs

    def perform_create(self, serializer):
        serializer.save(madrasah=self.request.user.madrasah, created_by=self.request.user)


class QuestionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = QuestionSerializer

    def get_queryset(self):
        return Question.objects.filter(madrasah=self.request.user.madrasah)


class QuizListView(generics.ListCreateAPIView):
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return QuizSerializer
        return QuizListSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Quiz.objects.filter(madrasah=user.madrasah)

        if user.role == 'student':
            qs = qs.filter(is_published=True)
        elif user.role == 'ustaadh':
            qs = qs.filter(created_by=user)
        return qs

    def perform_create(self, serializer):
        serializer.save(madrasah=self.request.user.madrasah, created_by=self.request.user)


class QuizDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = QuizSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':
            return Quiz.objects.filter(madrasah=user.madrasah, is_published=True)
        return Quiz.objects.filter(madrasah=user.madrasah)


class QuizPublishView(APIView):
    def post(self, request, pk):
        try:
            quiz = Quiz.objects.get(pk=pk, madrasah=request.user.madrasah)
        except Quiz.DoesNotExist:
            return Response({'error': 'Quiz not found'}, status=status.HTTP_404_NOT_FOUND)

        quiz.is_published = not quiz.is_published
        quiz.save()
        return Response({
            'message': f'Quiz {"published" if quiz.is_published else "unpublished"}',
            'is_published': quiz.is_published
        })


class QuizAttemptCreateView(APIView):
    def post(self, request):
        quiz_id = request.data.get('quiz')
        try:
            quiz = Quiz.objects.get(pk=quiz_id, is_published=True, madrasah=request.user.madrasah)
        except Quiz.DoesNotExist:
            return Response({'error': 'Quiz not found or not published'}, status=status.HTTP_404_NOT_FOUND)

        existing_attempts = QuizAttempt.objects.filter(
            quiz=quiz, student=request.user
        ).count()

        attempt = QuizAttempt.objects.create(
            quiz=quiz,
            student=request.user,
            attempt_number=existing_attempts + 1
        )

        return Response(QuizAttemptSerializer(attempt).data, status=status.HTTP_201_CREATED)


class QuizAttemptSubmitView(APIView):
    def put(self, request, pk):
        try:
            attempt = QuizAttempt.objects.get(pk=pk, student=request.user)
        except QuizAttempt.DoesNotExist:
            return Response({'error': 'Attempt not found'}, status=status.HTTP_404_NOT_FOUND)

        if attempt.submitted_at:
            return Response({'error': 'Attempt already submitted'}, status=status.HTTP_400_BAD_REQUEST)

        attempt.answers = request.data.get('answers', {})
        attempt.submitted_at = timezone.now()
        attempt.save()

        grading_result = grade_quiz(attempt)

        attempt.refresh_from_db()

        return Response({
            'attempt': QuizAttemptSerializer(attempt).data,
            'grading': grading_result,
        })


class QuizAttemptDetailView(APIView):
    def get(self, request, pk):
        try:
            attempt = QuizAttempt.objects.get(pk=pk, quiz__madrasah=request.user.madrasah)
        except QuizAttempt.DoesNotExist:
            return Response({'error': 'Attempt not found'}, status=status.HTTP_404_NOT_FOUND)

        if request.user.role == 'student' and attempt.student != request.user:
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

        return Response(QuizAttemptDetailSerializer(attempt).data)


class StudentQuizAttemptsView(APIView):
    def get(self, request):
        attempts = QuizAttempt.objects.filter(student=request.user)
        serializer = QuizAttemptSerializer(attempts, many=True)
        return Response(serializer.data)
