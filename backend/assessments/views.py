import random

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


class QuestionGeneratorView(APIView):
    permission_classes = [IsAuthenticated]

    MCQ_TEMPLATES = [
        "What is the main concept of {topic}?",
        "Which of the following best describes {topic}?",
        "What is the primary purpose of {topic}?",
        "{topic} is most closely related to which of the following?",
        "In the context of {topic}, which statement is true?",
        "Which characteristic is most essential to {topic}?",
        "What does the term '{topic}' primarily refer to?",
        "Which of the following is a direct application of {topic}?",
    ]

    THEORY_TEMPLATES = [
        "Explain the concept of {topic} in your own words.",
        "Describe the importance of {topic} and give two examples.",
        "Compare and contrast {topic} with a related concept.",
        "What are the key principles of {topic}? Discuss each.",
        "How does {topic} apply to real-world situations? Provide examples.",
        "Analyze the role of {topic} in modern practice.",
        "What challenges arise when studying {topic}? How would you address them?",
        "Trace the development of {topic} and its impact on the field.",
    ]

    TRUE_FALSE_TEMPLATES = [
        "{topic} is a fundamental concept in this subject.",
        "The principles of {topic} were first discovered in the 20th century.",
        "Understanding {topic} requires knowledge of prerequisite concepts.",
        "{topic} is only applicable in theoretical contexts.",
        "Mastery of {topic} is essential for advanced study in this field.",
        "The core ideas of {topic} have remained unchanged since their discovery.",
        "{topic} plays a minimal role in practical applications.",
        "Knowledge of {topic} builds upon previously established theories.",
    ]

    FILL_BLANK_TEMPLATES = [
        "The study of {topic} involves understanding its core ______.",
        "______ is a key application of {topic} in practice.",
        "Students learning {topic} must first master ______ concepts.",
        "The term '{topic}' refers to the ______ of related ideas.",
        "One of the main challenges in {topic} is ______.",
        "A thorough grasp of {topic} requires ______ thinking.",
        "The foundation of {topic} rests on the principle of ______.",
        "Practitioners of {topic} must develop strong ______ skills.",
    ]

    CORRECT_ANSWERS = {
        # (template_index, difficulty) -> correct_answer
        # For MCQ, answer refers to option label; for TF, True/False; for Fill, fill word(s)
    }

    FILL_ANSWERS = [
        "principles", "application", "foundational", "study", "complexity",
        "critical", "consistency", "analytical",
    ]

    THEORY_KEYWORDS = [
        "principles", "frameworks", "methodologies", "core ideas",
        "applications", "theories", "foundations", "practices",
    ]

    def post(self, request):
        topic = request.data.get('topic', '')
        subject_id = request.data.get('subject')
        difficulty = request.data.get('difficulty', 'medium')
        question_types = request.data.get('types', ['mcq'])
        count = min(int(request.data.get('count', 5)), 20)

        if not topic:
            return Response({'error': 'topic is required'}, status=status.HTTP_400_BAD_REQUEST)

        questions = self._generate_questions(topic, subject_id, difficulty, question_types, count)

        return Response({'questions': questions, 'count': len(questions)})

    def _generate_questions(self, topic, subject_id, difficulty, types, count):
        questions = []
        # Build weighted type pool to hit requested types
        type_pool = []
        for t in types:
            type_pool.extend([t] * max(1, count // len(types)))
        # fill remainder with first type
        while len(type_pool) < count:
            type_pool.append(types[0])
        random.shuffle(type_pool)

        used_texts = set()
        type_index = {t: 0 for t in ['mcq', 'essay', 'true_false', 'fill_blank']}

        for qtype in type_pool[:count]:
            generator = {
                'mcq': self._make_mcq,
                'essay': self._make_theory,
                'true_false': self._make_true_false,
                'fill_blank': self._make_fill_blank,
            }.get(qtype)

            if not generator:
                continue

            idx = type_index[qtype]
            template_list = {
                'mcq': self.MCQ_TEMPLATES,
                'essay': self.THEORY_TEMPLATES,
                'true_false': self.TRUE_FALSE_TEMPLATES,
                'fill_blank': self.FILL_BLANK_TEMPLATES,
            }[qtype]

            template = template_list[idx % len(template_list)]
            type_index[qtype] += 1

            question = generator(topic, template, idx, difficulty)
            if question['question_text'] not in used_texts:
                used_texts.add(question['question_text'])
                questions.append(question)

        return questions

    def _make_mcq(self, topic, template, idx, difficulty):
        text = template.format(topic=topic)
        distractors = self._generate_distractors(topic, difficulty)
        correct_idx = random.randint(0, 3)
        labels = ['A', 'B', 'C', 'D']
        options = []
        for i in range(4):
            label = labels[i]
            if i == correct_idx:
                options.append(f"{label}. {distractors[0]}")
            else:
                options.append(f"{label}. {distractors[i + 1]}")
        correct_answer = labels[correct_idx]
        return {
            'question_text': text,
            'question_type': 'mcq',
            'options': options,
            'correct_answer': correct_answer,
            'difficulty': difficulty,
            'topic': topic,
        }

    def _generate_distractors(self, topic, difficulty):
        prefixes = ["Mis", "Pre", "Post", "Anti", "Non", "Proto", "Neo", "Pseudo"]
        suffixes = ["ism", "ology", "ics", "tion", "ance", "ment", "ity", "al"]

        correct = f"The correct definition or explanation of {topic}"

        if difficulty == 'easy':
            d1 = f"{random.choice(prefixes)}{topic}"
            d2 = f"{topic}{random.choice(suffixes)}"
            d3 = f"Reversed {topic}"
            d4 = f"Alternative {topic} theory"
        elif difficulty == 'medium':
            d1 = f"A related but distinct concept similar to {topic}"
            d2 = f"An opposing viewpoint to {topic}"
            d3 = f"The historical predecessor of {topic}"
            d4 = f"A secondary aspect of {topic}"
        else:
            d1 = f"The nuanced interpretation of {topic} within a specific subfield"
            d2 = f"A competing framework that challenges {topic}"
            d3 = f"The synthesis of {topic} with adjacent disciplines"
            d4 = f"The critical analysis of {topic} through alternative lenses"

        choices = [correct, d1, d2, d3, d4]
        random.shuffle(choices)
        return choices

    def _make_theory(self, topic, template, idx, difficulty):
        text = template.format(topic=topic)
        keyword = self.THEORY_KEYWORDS[idx % len(self.THEORY_KEYWORDS)]

        if difficulty == 'easy':
            answer = f"Answer should cover the basic definition of {topic}, including its main {keyword} and purpose."
        elif difficulty == 'medium':
            answer = f"Answer should explain {topic} in detail, discussing its {keyword}, real-world examples, and significance."
        else:
            answer = f"Answer should provide a comprehensive analysis of {topic}, critically evaluating its {keyword}, limitations, and broader implications."

        return {
            'question_text': text,
            'question_type': 'essay',
            'options': None,
            'correct_answer': answer,
            'difficulty': difficulty,
            'topic': topic,
        }

    def _make_true_false(self, topic, template, idx, difficulty):
        text = template.format(topic=topic)
        # Deterministic but varied: mix of true/false based on template index
        is_true = idx % 2 == 0
        correct_answer = 'True' if is_true else 'False'

        # For harder difficulties, make the statement less obvious
        if difficulty == 'hard' and random.random() < 0.5:
            correct_answer = 'True' if correct_answer == 'False' else 'False'

        return {
            'question_text': text,
            'question_type': 'true_false',
            'options': ['A. True', 'B. False'],
            'correct_answer': 'A' if correct_answer == 'True' else 'B',
            'difficulty': difficulty,
            'topic': topic,
        }

    def _make_fill_blank(self, topic, template, idx, difficulty):
        text = template.format(topic=topic)
        answer = self.FILL_ANSWERS[idx % len(self.FILL_ANSWERS)]

        if difficulty == 'hard':
            answer = f"in-depth understanding of {answer}"

        return {
            'question_text': text,
            'question_type': 'fill_blank',
            'options': None,
            'correct_answer': answer,
            'difficulty': difficulty,
            'topic': topic,
        }
