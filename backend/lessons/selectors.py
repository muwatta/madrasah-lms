from __future__ import annotations

from django.db.models import Count, Prefetch
from django.utils.timezone import now

from .models import (
    SchemeOfWork, SchemeWeek, LearningObjective, LessonPlan,
    LessonResource, LessonDelivery, LessonReflection, LessonAuditLog,
    Homework, HomeworkSubmission, LessonAnalyticsSnapshot,
)


# ──────────────────────────────────────────────────────
#  Scheme of Work
# ──────────────────────────────────────────────────────


def get_schemes_for_teacher(*, teacher, term=None, subject=None, school_class=None):
    qs = SchemeOfWork.objects.filter(
        madrasah=teacher.madrasah,
        teacher=teacher,
    ).select_related('subject', 'school_class', 'term')
    if term:
        qs = qs.filter(term=term)
    if subject:
        qs = qs.filter(subject=subject)
    if school_class:
        qs = qs.filter(school_class=school_class)
    return qs.prefetch_related('weeks')


def get_scheme_by_id(*, scheme_id, madrasah):
    return SchemeOfWork.objects.select_related(
        'subject', 'school_class', 'term', 'teacher'
    ).prefetch_related('weeks').get(pk=scheme_id, madrasah=madrasah)


def get_schemes_for_madrasah(*, madrasah, term=None, subject=None, school_class=None):
    qs = SchemeOfWork.objects.filter(madrasah=madrasah).select_related(
        'subject', 'school_class', 'term', 'teacher')
    if term:
        qs = qs.filter(term=term)
    if subject:
        qs = qs.filter(subject=subject)
    if school_class:
        qs = qs.filter(school_class=school_class)
    return qs


# ──────────────────────────────────────────────────────
#  Lesson Plans
# ──────────────────────────────────────────────────────


def get_lesson_plans(*, madrasah, teacher=None, subject=None, school_class=None,
                     status=None, date_from=None, date_to=None,
                     scheme_week=None):
    qs = LessonPlan.objects.filter(madrasah=madrasah).select_related(
        'subject', 'school_class', 'class_arm', 'term', 'teacher',
        'scheme_week', 'timetable_slot', 'approved_by',
    )
    if teacher:
        qs = qs.filter(teacher=teacher)
    if subject:
        qs = qs.filter(subject=subject)
    if school_class:
        qs = qs.filter(school_class=school_class)
    if status:
        qs = qs.filter(status=status)
    if date_from:
        qs = qs.filter(lesson_date__gte=date_from)
    if date_to:
        qs = qs.filter(lesson_date__lte=date_to)
    if scheme_week:
        qs = qs.filter(scheme_week=scheme_week)
    return qs


def get_plan_by_id(*, plan_id, madrasah):
    return LessonPlan.objects.select_related(
        'subject', 'school_class', 'class_arm', 'term', 'teacher',
        'scheme_week', 'timetable_slot', 'approved_by',
    ).prefetch_related(
        Prefetch('resources_list', queryset=LessonResource.objects.order_by('order')),
        'reflections',
    ).get(pk=plan_id, madrasah=madrasah)


def get_pending_approvals(*, madrasah, subject=None, school_class=None):
    qs = LessonPlan.objects.filter(
        madrasah=madrasah,
        status__in=('submitted', 'under_review'),
    ).select_related('subject', 'school_class', 'teacher')
    if subject:
        qs = qs.filter(subject=subject)
    if school_class:
        qs = qs.filter(school_class=school_class)
    return qs


def get_teacher_subjects(*, teacher):
    return LessonPlan.objects.filter(
        madrasah=teacher.madrasah,
        teacher=teacher,
    ).values_list('subject__id', 'subject__name_ar', 'subject__name_en').distinct()


def get_teacher_classes(*, teacher):
    return LessonPlan.objects.filter(
        madrasah=teacher.madrasah,
        teacher=teacher,
    ).values_list(
        'school_class__id', 'school_class__name_ar', 'school_class__name_en'
    ).distinct()


def get_lesson_delivery(*, plan_id):
    try:
        return LessonDelivery.objects.get(lesson_id=plan_id)
    except LessonDelivery.DoesNotExist:
        return None


def get_lesson_reflections(*, plan_id):
    return LessonReflection.objects.filter(lesson_id=plan_id).select_related('teacher')


# ──────────────────────────────────────────────────────
#  Homework
# ──────────────────────────────────────────────────────


def get_homework_list(*, madrasah, teacher=None, subject=None, school_class=None,
                      is_published=None, overdue_only=False):
    qs = Homework.objects.filter(madrasah=madrasah).select_related(
        'subject', 'school_class', 'teacher', 'lesson_plan',
    ).annotate(submission_count=Count('submissions'))

    if teacher:
        qs = qs.filter(teacher=teacher)
    if subject:
        qs = qs.filter(subject=subject)
    if school_class:
        qs = qs.filter(school_class=school_class)
    if is_published is not None:
        qs = qs.filter(is_published=is_published)
    if overdue_only:
        qs = qs.filter(due_date__lt=now(), is_published=True)

    return qs


def get_homework_by_id(*, homework_id, madrasah):
    return Homework.objects.select_related(
        'subject', 'school_class', 'teacher', 'lesson_plan',
    ).annotate(
        submission_count=Count('submissions')
    ).get(pk=homework_id, madrasah=madrasah)


def get_submissions_for_homework(*, homework_id, madrasah):
    return HomeworkSubmission.objects.filter(
        homework_id=homework_id, madrasah=madrasah
    ).select_related('student', 'graded_by')


def get_pending_grading(*, madrasah):
    return HomeworkSubmission.objects.filter(
        madrasah=madrasah, status='submitted'
    ).select_related('homework', 'student', 'graded_by')


# ──────────────────────────────────────────────────────
#  Analytics
# ──────────────────────────────────────────────────────


def get_analytics_snapshot(*, teacher, subject, school_class, term):
    try:
        return LessonAnalyticsSnapshot.objects.get(
            teacher=teacher, subject=subject,
            school_class=school_class, term=term,
        )
    except LessonAnalyticsSnapshot.DoesNotExist:
        return None


# ──────────────────────────────────────────────────────
#  Audit Log
# ──────────────────────────────────────────────────────


def get_audit_logs(*, madrasah, model_name=None, object_id=None,
                   actor=None, limit=50):
    qs = LessonAuditLog.objects.select_related('actor')
    if madrasah:
        qs = qs.filter(actor__madrasah=madrasah)
    if model_name:
        qs = qs.filter(model_name=model_name)
    if object_id:
        qs = qs.filter(object_id=str(object_id))
    if actor:
        qs = qs.filter(actor=actor)
    return qs[:limit]
