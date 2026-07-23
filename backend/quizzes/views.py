from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Quiz, Question, QuizAttempt, QuizAnswer, ViolationLog
from .serializers import (
    QuestionSerializer, QuestionWriteSerializer,
    QuizSerializer, QuizWriteSerializer, QuizQuestionSerializer,
    QuizAttemptSerializer, QuizAnswerSerializer,
    StartAttemptSerializer, SaveAnswerSerializer, FlagQuestionSerializer,
    ViolationLogSerializer,
)
from .permissions import (
    CanManageQuizzes, CanViewQuiz, CanTakeQuiz,
    CanManageQuestions, CanViewQuestionBank, CanViewResults, CanManageViolations,
)
from .services import QuizService, QuestionService, AttemptService, ViolationService
from .selectors import (
    get_quizzes, get_quiz_by_id, get_quiz_with_questions,
    get_questions, get_question_by_id,
    get_student_quizzes, get_attempts_for_quiz, get_student_attempt,
    get_quiz_stats, get_question_analysis,
)


# ─── Question Bank ───────────────────────────────────────────────────────────

class QuestionListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, CanViewQuestionBank]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return QuestionWriteSerializer
        return QuestionSerializer

    def get_queryset(self):
        return get_questions(
            madrasah=self.request.user.madrasah,
            subject=self.request.query_params.get('subject'),
            topic=self.request.query_params.get('topic'),
            school_class=self.request.query_params.get('school_class'),
            question_type=self.request.query_params.get('question_type'),
            difficulty=self.request.query_params.get('difficulty'),
            search=self.request.query_params.get('search'),
        )

    def perform_create(self, serializer):
        data = serializer.validated_data
        question = QuestionService.create_question(
            madrasah=self.request.user.madrasah,
            created_by=self.request.user,
            subject_id=data['subject'],
            topic_id=data.get('topic'),
            school_class_id=data.get('school_class'),
            question_type=data['question_type'],
            difficulty=data['difficulty'],
            marks=data['marks'],
            question_text=data['question_text'],
            question_text_ar=data.get('question_text_ar', ''),
            options=data.get('options'),
            correct_answer=data['correct_answer'],
            explanation=data.get('explanation', ''),
            explanation_ar=data.get('explanation_ar', ''),
        )
        self._created_question = question

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        output = QuestionSerializer(self._created_question, context={'request': request})
        return Response(output.data, status=status.HTTP_201_CREATED)


class QuestionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated, CanManageQuestions]

    def get_queryset(self):
        return get_questions(madrasah=self.request.user.madrasah)


class QuestionDuplicateView(APIView):
    permission_classes = [IsAuthenticated, CanManageQuestions]

    def post(self, request, pk):
        question = get_question_by_id(question_id=pk, madrasah=request.user.madrasah)
        if not question:
            return Response({'error': 'Question not found'}, status=404)
        dup = QuestionService.duplicate_question(
            question=question, created_by=request.user)
        return Response(QuestionSerializer(dup).data, status=201)


# ─── Quiz CRUD ───────────────────────────────────────────────────────────────

class QuizListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, CanViewQuiz]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return QuizWriteSerializer
        return QuizSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':
            return get_student_quizzes(student=user, madrasah=user.madrasah)
        qs = get_quizzes(
            madrasah=user.madrasah,
            status=self.request.query_params.get('status'),
            subject=self.request.query_params.get('subject'),
            school_class=self.request.query_params.get('school_class'),
        )
        if user.role == 'ustaadh':
            qs = qs.filter(created_by=user)
        return qs

    def perform_create(self, serializer):
        data = serializer.validated_data
        from curriculum.models import Subject, SchoolClass
        from academic.models import Session, Term
        subject = get_object_or_404(Subject, pk=data['subject'], madrasah=self.request.user.madrasah)
        school_class = get_object_or_404(SchoolClass, pk=data['school_class'], madrasah=self.request.user.madrasah)
        session = get_object_or_404(Session, pk=data['session'], madrasah=self.request.user.madrasah) if data.get('session') else None
        term = get_object_or_404(Term, pk=data['term'], madrasah=self.request.user.madrasah) if data.get('term') else None

        quiz = QuizService.create_quiz(
            madrasah=self.request.user.madrasah,
            created_by=self.request.user,
            title=data['title'],
            description=data.get('description', ''),
            instructions=data.get('instructions', ''),
            subject=subject,
            school_class=school_class,
            session=session,
            term=term,
            difficulty=data.get('difficulty', 2),
            estimated_duration_minutes=data.get('estimated_duration_minutes', 30),
            available_from=data.get('available_from'),
            available_until=data.get('available_until'),
            time_limit_minutes=data.get('time_limit_minutes', 30),
            grace_period_minutes=data.get('grace_period_minutes', 5),
            max_attempts=data.get('max_attempts', 1),
            passing_score=data.get('passing_score', 60.00),
            marks_per_question=data.get('marks_per_question', 1.00),
            negative_marking=data.get('negative_marking', False),
            negative_mark_fraction=data.get('negative_mark_fraction', 0.25),
            randomize_questions=data.get('randomize_questions', False),
            randomize_options=data.get('randomize_options', False),
            one_question_per_page=data.get('one_question_per_page', True),
            allow_review=data.get('allow_review', True),
            allow_back_navigation=data.get('allow_back_navigation', True),
            show_question_numbers=data.get('show_question_numbers', True),
            auto_save=data.get('auto_save', True),
            grading_mode=data.get('grading_mode', 'auto_release_later'),
            require_fullscreen=data.get('require_fullscreen', False),
            max_violations=data.get('max_violations', 5),
            auto_submit_on_violations=data.get('auto_submit_on_violations', True),
            question_ids=data.get('question_ids', []),
        )

        class_ids = data.get('assignment_class_ids', [])
        if class_ids:
            QuizService.assign_quiz(quiz=quiz, school_class_ids=class_ids)

        self._quiz = quiz

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(QuizSerializer(self._quiz).data, status=201)


class QuizDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = QuizSerializer
    permission_classes = [IsAuthenticated, CanViewQuiz]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':
            return get_student_quizzes(student=user, madrasah=user.madrasah)
        return get_quizzes(madrasah=user.madrasah)


class QuizPublishView(APIView):
    permission_classes = [IsAuthenticated, CanManageQuizzes]

    def post(self, request, pk):
        quiz = get_quiz_by_id(quiz_id=pk, madrasah=request.user.madrasah)
        if not quiz:
            return Response({'error': 'Quiz not found'}, status=404)
        try:
            quiz = QuizService.publish_quiz(quiz=quiz)
            return Response(QuizSerializer(quiz).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=400)


class QuizArchiveView(APIView):
    permission_classes = [IsAuthenticated, CanManageQuizzes]

    def post(self, request, pk):
        quiz = get_quiz_by_id(quiz_id=pk, madrasah=request.user.madrasah)
        if not quiz:
            return Response({'error': 'Quiz not found'}, status=404)
        quiz = QuizService.archive_quiz(quiz=quiz)
        return Response(QuizSerializer(quiz).data)


# ─── Quiz Questions (add/remove from quiz) ──────────────────────────────────

class QuizQuestionsView(generics.RetrieveAPIView):
    serializer_class = QuizQuestionSerializer
    permission_classes = [IsAuthenticated, CanViewQuiz]

    def get_object(self):
        quiz = get_quiz_with_questions(quiz_id=self.kwargs['pk'], madrasah=self.request.user.madrasah)
        if not quiz:
            return None
        return quiz.quiz_questions.select_related('question').order_by('sort_order')


class QuizAddQuestionView(APIView):
    permission_classes = [IsAuthenticated, CanManageQuizzes]

    def post(self, request, pk):
        quiz = get_quiz_by_id(quiz_id=pk, madrasah=request.user.madrasah)
        if not quiz:
            return Response({'error': 'Quiz not found'}, status=404)
        question_id = request.data.get('question_id')
        if not question_id:
            return Response({'error': 'question_id required'}, status=400)
        question = get_question_by_id(question_id=question_id, madrasah=request.user.madrasah)
        if not question:
            return Response({'error': 'Question not found'}, status=404)
        from .models import QuizQuestion
        qq, created = QuizQuestion.objects.get_or_create(
            quiz=quiz, question=question,
            defaults={'sort_order': quiz.question_count, 'marks': quiz.marks_per_question})
        if not created:
            return Response({'error': 'Question already in quiz'}, status=400)
        return Response(QuizQuestionSerializer(qq).data, status=201)


class QuizRemoveQuestionView(APIView):
    permission_classes = [IsAuthenticated, CanManageQuizzes]

    def delete(self, request, pk, question_pk):
        quiz = get_quiz_by_id(quiz_id=pk, madrasah=request.user.madrasah)
        if not quiz:
            return Response({'error': 'Quiz not found'}, status=404)
        from .models import QuizQuestion
        deleted, _ = QuizQuestion.objects.filter(quiz=quiz, question_id=question_pk).delete()
        if deleted:
            return Response(status=204)
        return Response({'error': 'Question not in quiz'}, status=404)


# ─── Student: Start / Answer / Submit ───────────────────────────────────────

class StartQuizView(APIView):
    permission_classes = [IsAuthenticated, CanTakeQuiz]

    def post(self, request):
        serializer = StartAttemptSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        quiz = get_quiz_by_id(quiz_id=serializer.validated_data['quiz_id'], madrasah=request.user.madrasah)
        if not quiz:
            return Response({'error': 'Quiz not found'}, status=404)
        try:
            attempt = AttemptService.start_attempt(
                quiz=quiz,
                student=request.user,
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
            )
            return Response(QuizAttemptSerializer(attempt).data, status=201)
        except ValueError as e:
            return Response({'error': str(e)}, status=400)

    def _get_client_ip(self, request):
        xff = request.META.get('HTTP_X_FORWARDED_FOR')
        return xff.split(',')[0].strip() if xff else request.META.get('REMOTE_ADDR')


class SaveAnswerView(APIView):
    permission_classes = [IsAuthenticated, CanTakeQuiz]

    def post(self, request, attempt_uuid):
        attempt = get_object_or_404(
            QuizAttempt, uuid=attempt_uuid, student=request.user, status='in_progress')
        serializer = SaveAnswerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            answer = AttemptService.save_answer(
                attempt=attempt,
                question_id=serializer.validated_data['question_id'],
                selected_answer=serializer.validated_data['selected_answer'],
            )
            return Response(QuizAnswerSerializer(answer).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=400)


class FlagQuestionView(APIView):
    permission_classes = [IsAuthenticated, CanTakeQuiz]

    def post(self, request, attempt_uuid):
        attempt = get_object_or_404(
            QuizAttempt, uuid=attempt_uuid, student=request.user, status='in_progress')
        serializer = FlagQuestionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            answer = AttemptService.toggle_flag(
                attempt=attempt,
                question_id=serializer.validated_data['question_id'],
            )
            return Response(QuizAnswerSerializer(answer).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=400)


class SubmitQuizView(APIView):
    permission_classes = [IsAuthenticated, CanTakeQuiz]

    def post(self, request, attempt_uuid):
        attempt = get_object_or_404(
            QuizAttempt, uuid=attempt_uuid, student=request.user, status='in_progress')
        try:
            attempt = AttemptService.submit_attempt(attempt=attempt)
            return Response(QuizAttemptSerializer(attempt).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=400)


class MyAttemptView(APIView):
    permission_classes = [IsAuthenticated, CanTakeQuiz]

    def get(self, request, attempt_uuid):
        attempt = get_object_or_404(
            QuizAttempt, uuid=attempt_uuid, student=request.user)
        data = QuizAttemptSerializer(attempt).data
        # For in-progress: don't reveal correct answers
        if attempt.status == 'in_progress':
            for ans in data.get('answers', []):
                ans.pop('correct_answer', None)
                ans.pop('explanation', None)
                ans.pop('explanation_ar', None)
        return Response(data)


class ReportViolationView(APIView):
    permission_classes = [IsAuthenticated, CanTakeQuiz]

    def post(self, request, attempt_uuid):
        attempt = get_object_or_404(
            QuizAttempt, uuid=attempt_uuid, student=request.user, status='in_progress')
        v_type = request.data.get('violation_type')
        if not v_type:
            return Response({'error': 'violation_type required'}, status=400)
        log = ViolationService.log_violation(
            attempt=attempt, violation_type=v_type,
            details=request.data.get('details', {}))
        return Response(ViolationLogSerializer(log).data, status=201)


# ─── Results & Analytics ─────────────────────────────────────────────────────

class QuizResultsView(generics.ListAPIView):
    serializer_class = QuizAttemptSerializer
    permission_classes = [IsAuthenticated, CanViewResults]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':
            return QuizAttempt.objects.filter(
                student=user, status__in=('submitted', 'graded', 'released'),
            ).select_related('quiz', 'student').prefetch_related('answers__question')
        return get_attempts_for_quiz(
            quiz_id=self.kwargs['pk'], madrasah=user.madrasah)


class QuizStatsView(APIView):
    permission_classes = [IsAuthenticated, CanManageQuizzes]

    def get(self, request, pk):
        stats = get_quiz_stats(quiz_id=pk, madrasah=request.user.madrasah)
        return Response(stats)


class QuestionAnalysisView(APIView):
    permission_classes = [IsAuthenticated, CanManageQuizzes]

    def get(self, request, pk):
        analysis = get_question_analysis(quiz_id=pk, madrasah=request.user.madrasah)
        return Response(analysis)


class ViolationReportView(generics.ListAPIView):
    serializer_class = ViolationLogSerializer
    permission_classes = [IsAuthenticated, CanManageViolations]

    def get_queryset(self):
        return ViolationLog.objects.filter(
            attempt__quiz_id=self.kwargs['pk'],
            attempt__madrasah=self.request.user.madrasah,
        ).select_related('attempt', 'attempt__student')


# ─── Admin Dashboard Analytics ──────────────────────────────────────────────

class QuizOverviewView(APIView):
    permission_classes = [IsAuthenticated, CanManageQuizzes]

    def get(self, request):
        from django.db.models import Avg, Count
        user = request.user
        quizzes = Quiz.objects.filter(madrasah=user.madrasah)
        attempts = QuizAttempt.objects.filter(madrasah=user.madrasah)

        return Response({
            'total_quizzes': quizzes.count(),
            'published_quizzes': quizzes.filter(is_published=True).count(),
            'total_attempts': attempts.count(),
            'average_score': round(
                attempts.filter(percentage__isnull=False).aggregate(
                    avg=Avg('percentage'))['avg'] or 0, 1),
            'pass_rate': round(
                (attempts.filter(is_pass=True).count() / attempts.count() * 100)
                if attempts.count() else 0, 1),
        })
