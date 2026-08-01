from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from curriculum.models import Subject, SchoolClass
from academic.models import Session, Term
from quizzes.models import QuizAttempt
from quizzes.serializers import QuestionSerializer, QuizSerializer

from .models import QuestionBank
from .serializers import QuestionBankSerializer
from .services import QuestionBankService, GapAnalysisService


class CanManageQuestionBanks:
    """ustaadh, mudeer and idaarah can manage question banks."""

    def has_permission(self, request, view):
        return getattr(request.user, 'role', None) in ('ustaadh', 'mudeer', 'idaarah')

    def has_object_permission(self, request, view, obj):
        role = getattr(request.user, 'role', None)
        if role in ('mudeer', 'idaarah'):
            return obj.madrasah_id == request.user.madrasah_id
        return obj.created_by_id == request.user.id and obj.madrasah_id == request.user.madrasah_id


class QuestionBankListCreateView(generics.ListCreateAPIView):
    serializer_class = QuestionBankSerializer
    permission_classes = [IsAuthenticated, CanManageQuestionBanks]

    def get_queryset(self):
        qs = QuestionBank.objects.filter(
            madrasah=self.request.user.madrasah
        ).select_related(
            'subject', 'school_class', 'session', 'term', 'created_by'
        ).order_by('-session__start_date', 'term__term_number', '-created_at')

        session = self.request.query_params.get('session')
        subject = self.request.query_params.get('subject')
        school_class = self.request.query_params.get('school_class')
        term = self.request.query_params.get('term')
        if session:
            qs = qs.filter(session_id=session)
        if subject:
            qs = qs.filter(subject_id=subject)
        if school_class:
            qs = qs.filter(school_class_id=school_class)
        if term:
            qs = qs.filter(term_id=term)
        return qs

    def create(self, request, *args, **kwargs):
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        name = file.name.lower()
        if name.endswith('.docx'):
            file_type = 'docx'
        elif name.endswith('.pdf'):
            file_type = 'pdf'
        else:
            return Response(
                {'error': 'Unsupported file type. Upload a .docx or .pdf file.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            subject = get_object_or_404(Subject, pk=request.data.get('subject'), madrasah=request.user.madrasah)
            school_class = get_object_or_404(SchoolClass, pk=request.data.get('school_class'), madrasah=request.user.madrasah)
            session = get_object_or_404(Session, pk=request.data.get('session'), madrasah=request.user.madrasah)
            term = get_object_or_404(Term, pk=request.data.get('term'), madrasah=request.user.madrasah, session=session)
        except Exception:
            return Response({'error': 'Invalid subject, class, session or term.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            bank = QuestionBankService.upload(
                madrasah=request.user.madrasah,
                created_by=request.user,
                subject=subject,
                school_class=school_class,
                session=session,
                term=term,
                title=request.data.get('title', ''),
                description=request.data.get('description', ''),
                file=file,
                file_type=file_type,
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            QuestionBankSerializer(bank, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class QuestionBankDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = QuestionBankSerializer
    permission_classes = [IsAuthenticated, CanManageQuestionBanks]

    def get_queryset(self):
        return QuestionBank.objects.filter(madrasah=self.request.user.madrasah)

    def perform_destroy(self, instance):
        instance.bank_questions.update(question_bank=None)
        instance.delete()


class QuestionBankConvertView(APIView):
    permission_classes = [IsAuthenticated, CanManageQuestionBanks]

    def post(self, request, pk):
        bank = get_object_or_404(
            QuestionBank, pk=pk, madrasah=request.user.madrasah)
        try:
            quiz = QuestionBankService.convert_to_quiz(bank=bank, created_by=request.user)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(QuizSerializer(quiz, context={'request': request}).data)


class QuestionBankQuestionsView(generics.ListAPIView):
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated, CanManageQuestionBanks]

    def get_queryset(self):
        bank = get_object_or_404(
            QuestionBank, pk=self.kwargs['pk'], madrasah=self.request.user.madrasah)
        return bank.bank_questions.select_related('subject', 'topic', 'school_class', 'created_by').order_by('id')


class QuestionBankGapAnalysisView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, attempt_uuid):
        bank = get_object_or_404(
            QuestionBank, pk=pk, madrasah=request.user.madrasah)
        attempt = get_object_or_404(
            QuizAttempt, uuid=attempt_uuid, madrasah=request.user.madrasah)

        if request.user.role == 'student' and attempt.student_id != request.user.id:
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

        analysis, cached = GapAnalysisService.get_or_create(
            bank=bank, student=attempt.student, attempt=attempt)

        wrong_count = sum(
            1 for a in attempt.answers.all()
            if a.is_correct is not None and not a.is_correct
        )
        return Response({
            'analysis': analysis.content,
            'cached': cached,
            'wrong_count': wrong_count,
            'attempt': attempt_uuid,
        })
