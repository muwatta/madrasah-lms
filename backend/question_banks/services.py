import logging
from decimal import Decimal

from django.db import IntegrityError, transaction

from .models import QuestionBank, GapAnalysis
from .parsing import parse_document

logger = logging.getLogger(__name__)


class QuestionBankService:
    @staticmethod
    @transaction.atomic
    def upload(*, madrasah, created_by, subject, school_class, session, term,
               title, description='', file=None, file_type=None):
        if file_type is None:
            file_type = 'docx' if file.name.lower().endswith('.docx') else 'pdf'

        if QuestionBank.objects.filter(
            madrasah=madrasah, subject=subject, school_class=school_class, term=term
        ).exists():
            raise ValueError(
                "You already uploaded a question bank for this subject, class and term. "
                "Delete the existing one before uploading another."
            )

        original_size = file.size if file else 0
        bank = QuestionBank.objects.create(
            madrasah=madrasah,
            created_by=created_by,
            subject=subject,
            school_class=school_class,
            session=session,
            term=term,
            title=title,
            description=description,
            file=file,
            file_type=file_type,
            original_size=original_size,
            status='processing',
        )
        bank.stored_size = bank.file.size if bank.file else 0
        bank.save(update_fields=['stored_size'])

        try:
            if file is not None:
                file.seek(0)
                questions = parse_document(file, file_type)
            else:
                questions = []
        except Exception as e:
            logger.exception("Failed to parse question bank %s", bank.id)
            bank.status = 'failed'
            bank.error_message = f"Could not parse the file: {e}"
            bank.save(update_fields=['status', 'error_message'])
            return bank

        if not questions:
            bank.status = 'failed'
            bank.error_message = "No questions were found in the file."
            bank.save(update_fields=['status', 'error_message'])
            return bank

        from quizzes.models import Question
        created = []
        for i, q in enumerate(questions):
            q_type = q['question_type']
            options = q['options'] if q_type in ('mcq', 'true_false') else []
            if q_type == 'true_false':
                options = [
                    {'key': 'A', 'text': 'True', 'text_ar': 'صحيح'},
                    {'key': 'B', 'text': 'False', 'text_ar': 'خطأ'},
                ]
            question = Question.objects.create(
                madrasah=madrasah,
                created_by=created_by,
                subject=subject,
                school_class=school_class,
                question_type=q_type,
                difficulty=2,
                marks=Decimal('1.00'),
                question_text=q['question_text'],
                options=options,
                correct_answer=q['correct_answer'],
                explanation=q.get('explanation', ''),
                question_bank=bank,
            )
            created.append(question.id)

        bank.status = 'ready'
        bank.error_message = ''
        bank.save(update_fields=['status', 'error_message'])
        logger.info("Parsed %d questions into bank %s", len(created), bank.id)
        return bank

    @staticmethod
    @transaction.atomic
    def convert_to_quiz(*, bank, created_by):
        from quizzes.models import Quiz
        if bank.converted_quiz_id:
            return bank.converted_quiz

        questions = list(bank.bank_questions.order_by('id'))
        if not questions:
            raise ValueError("This question bank has no questions.")

        missing = [q.id for q in questions if not q.correct_answer]
        if missing:
            raise ValueError(
                f"{len(missing)} question(s) are missing a correct answer. "
                "Edit the questions and set answers before converting to a quiz."
            )

        from quizzes.services import QuizService

        term_label = bank.term.name
        session_label = bank.session.name
        title = bank.title or f"{bank.subject.name_ar} - {term_label} ({session_label})"
        quiz = QuizService.create_quiz(
            madrasah=bank.madrasah,
            created_by=created_by,
            title=title,
            description=bank.description or f"Term exam: {term_label} - {session_label}",
            instructions="",
            subject=bank.subject,
            school_class=bank.school_class,
            session=bank.session,
            term=bank.term,
            grading_mode='auto_immediate',
            max_attempts=2,
            question_ids=[q.id for q in questions],
        )
        quiz.status = 'published'
        quiz.is_published = True
        quiz.source_bank = bank
        quiz.save(update_fields=['status', 'is_published', 'source_bank'])

        QuizService.assign_quiz(quiz=quiz, school_class_ids=[bank.school_class_id])

        bank.converted_quiz = quiz
        bank.save(update_fields=['converted_quiz'])
        return quiz


class GapAnalysisService:
    @staticmethod
    def get_or_create(*, bank, student, attempt=None, request=None):
        existing = GapAnalysis.objects.filter(
            bank=bank, student=student, attempt=attempt
        ).first()
        if existing and existing.content:
            return existing, True

        wrong_questions = []
        if attempt is not None:
            for answer in attempt.answers.select_related('question').all():
                if answer.is_correct:
                    continue
                q = answer.question
                wrong_questions.append({
                    'question': q.question_text,
                    'your_answer': answer.selected_answer,
                    'correct_answer': q.correct_answer,
                    'explanation': q.explanation,
                })
        else:
            for q in bank.bank_questions.all():
                wrong_questions.append({
                    'question': q.question_text,
                    'correct_answer': q.correct_answer,
                    'explanation': q.explanation,
                })

        from guidance.services import AIService
        ai = AIService()
        content = ai.gap_analysis(
            student_name=student.get_full_name(),
            subject_name=bank.subject.name_en,
            wrong_questions=wrong_questions,
        )

        analysis, _ = GapAnalysis.objects.update_or_create(
            bank=bank, student=student, attempt=attempt,
            defaults={'content': content},
        )
        return analysis, False
