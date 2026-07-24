from django.db.models import Q, CharField, TextField
from django.utils.html import strip_tags
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from users.models import User
from curriculum.models import Subject, SchoolClass, Topic
from school_ops.models import Announcement, FeeStructure, Fee
from lessons.models import Homework, LessonPlan, SchemeOfWork
from quizzes.models import Quiz, Question


def _preview(text: str, length: int = 120) -> str:
    if not text:
        return ''
    clean = strip_tags(text)
    return clean[:length].strip() + ('…' if len(clean) > length else '')


def _build_result(model_name, instance, preview_text, url, subtitle=''):
    return {
        'model': model_name,
        'id': instance.pk,
        'title': str(instance),
        'subtitle': subtitle,
        'preview': preview_text,
        'url': url,
    }


class GlobalSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        q = (request.query_params.get('q') or '').strip()
        if len(q) < 2:
            return Response([])

        user = request.user
        school = user.madrasah
        results = []
        cap = 5  # per category

        # ── Users ──
        people = User.objects.filter(
            madrasah=school,
            is_active=True,
        ).filter(
            Q(first_name__icontains=q) |
            Q(last_name__icontains=q) |
            Q(email__icontains=q)
        )[:cap]
        for u in people:
            results.append(_build_result(
                'user', u, u.email,
                f'/users/{u.id}',
                f'{u.get_role_display()} · {u.get_full_name()}',
            ))

        # ── Subjects ──
        subjects = Subject.objects.filter(madrasah=school).filter(
            Q(name_ar__icontains=q) |
            Q(name_en__icontains=q) |
            Q(code__icontains=q) |
            Q(description__icontains=q)
        )[:cap]
        for s in subjects:
            results.append(_build_result(
                'subject', s, _preview(s.description),
                f'/curriculum/subjects/{s.id}',
                s.code or '',
            ))

        # ── Classes ──
        classes = SchoolClass.objects.filter(madrasah=school).filter(
            Q(name_ar__icontains=q) |
            Q(name_en__icontains=q)
        )[:cap]
        for c in classes:
            results.append(_build_result(
                'school_class', c, '',
                f'/curriculum/classes/{c.id}',
                c.name_en,
            ))

        # ── Announcements ──
        announcements = Announcement.objects.filter(madrasah=school).filter(
            Q(title__icontains=q) |
            Q(title_ar__icontains=q) |
            Q(message__icontains=q)
        )[:cap]
        for a in announcements:
            results.append(_build_result(
                'announcement', a, _preview(a.message),
                f'/school/announcements/{a.id}',
                f'{a.get_audience_display()}',
            ))

        # ── Quizzes ──
        quizzes = Quiz.objects.filter(madrasah=school).filter(
            Q(title__icontains=q) |
            Q(description__icontains=q)
        )[:cap]
        for qu in quizzes:
            results.append(_build_result(
                'quiz', qu, _preview(qu.description),
                f'/quizzes/{qu.uuid}',
                f'{qu.subject} · {qu.get_status_display()}',
            ))

        # ── Questions ──
        questions = Question.objects.filter(madrasah=school).filter(
            Q(question_text__icontains=q) |
            Q(question_text_ar__icontains=q)
        )[:cap]
        for qu in questions:
            results.append(_build_result(
                'question', qu, _preview(qu.question_text),
                f'/quizzes/questions/{qu.uuid}',
                f'{qu.subject} · {qu.get_question_type_display()}',
            ))

        # ── Homework ──
        homeworks = Homework.objects.filter(madrasah=school).filter(
            Q(title__icontains=q) |
            Q(description__icontains=q)
        )[:cap]
        for h in homeworks:
            results.append(_build_result(
                'homework', h, _preview(h.description),
                f'/lessons/homework/{h.id}',
                f'{h.subject} · Due {h.due_date.strftime("%d %b %Y")}',
            ))

        # ── Lesson Plans ──
        plans = LessonPlan.objects.filter(madrasah=school).filter(
            Q(title__icontains=q) |
            Q(prior_knowledge__icontains=q) |
            Q(introduction__icontains=q) |
            Q(lesson_development__icontains=q)
        )[:cap]
        for lp in plans:
            results.append(_build_result(
                'lesson_plan', lp, _preview(lp.lesson_development or lp.introduction),
                f'/lessons/lesson-plans/{lp.uuid}',
                f'{lp.subject} · {lp.lesson_date.strftime("%d %b %Y")}',
            ))

        # ── Schemes of Work ──
        schemes = SchemeOfWork.objects.filter(madrasah=school).filter(
            Q(title__icontains=q) |
            Q(description__icontains=q)
        )[:cap]
        for s in schemes:
            results.append(_build_result(
                'scheme', s, _preview(s.description),
                f'/lessons/schemes/{s.id}',
                f'{s.subject}',
            ))

        # ── Fee Structures ──
        fees = FeeStructure.objects.filter(madrasah=school).filter(
            Q(name__icontains=q) |
            Q(name_ar__icontains=q) |
            Q(description__icontains=q)
        )[:cap]
        for f in fees:
            results.append(_build_result(
                'fee_structure', f, f'₦{f.amount}',
                f'/school/fee-structures/{f.id}',
                f.description or '',
            ))

        # ── Topics ──
        topics = Topic.objects.filter(subject__madrasah=school).filter(
            Q(name__icontains=q) |
            Q(description__icontains=q)
        )[:cap]
        for t in topics:
            results.append(_build_result(
                'topic', t, _preview(t.description),
                f'/curriculum/subjects/{t.subject_id}',
                t.subject.name_ar if t.subject else '',
            ))

        return Response(results)
