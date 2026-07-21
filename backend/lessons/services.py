from __future__ import annotations

import logging
from collections import defaultdict
from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction
from django.db.models import Count, Q, Avg, F
from django.utils.timezone import now

from .models import (
    SchemeOfWork, SchemeWeek, LearningObjective, LessonPlan,
    LessonResource, LessonDelivery, LessonReflection, LessonAuditLog,
    Homework, HomeworkSubmission, LessonAnalyticsSnapshot,
    WORKFLOW_STATUS, DELIVERY_STATUS,
)

logger = logging.getLogger(__name__)


class AuditService:
    """Immutable audit trail for all lesson plan mutations."""

    VALID_ACTIONS = (
        'created', 'updated', 'status_changed', 'approved',
        'rejected', 'scheduled', 'delivered', 'completed',
        'resubmitted', 'archived',
    )

    @staticmethod
    @transaction.atomic
    def log(*, actor, action, model_name, object_id,
            previous_data=None, new_data=None, reason='', ip_address=None):
        if action not in AuditService.VALID_ACTIONS:
            raise ValueError(f"Invalid audit action: {action}")

        LessonAuditLog.objects.create(
            actor=actor,
            action=action,
            model_name=model_name,
            object_id=str(object_id),
            previous_data=previous_data or {},
            new_data=new_data or {},
            reason=reason,
            ip_address=ip_address,
        )


class SchemeOfWorkService:
    """CRUD and analytics for Scheme of Work."""

    @staticmethod
    @transaction.atomic
    def create_scheme(*, madrasah, teacher, term, subject, school_class,
                      title, description='', weeks_data=None):
        if SchemeOfWork.objects.filter(
            madrasah=madrasah, term=term, subject=subject, school_class=school_class
        ).exists():
            raise ValueError("A scheme already exists for this subject/class/term combination.")

        scheme = SchemeOfWork.objects.create(
            madrasah=madrasah,
            teacher=teacher,
            term=term,
            subject=subject,
            school_class=school_class,
            title=title,
            description=description,
            created_by=teacher,
        )

        if weeks_data:
            for w in weeks_data:
                SchemeWeek.objects.create(scheme=scheme, **w)

        return scheme

    @staticmethod
    @transaction.atomic
    def update_scheme(*, scheme, title=None, description=None, is_active=None, **kwargs):
        if title is not None:
            scheme.title = title
        if description is not None:
            scheme.description = description
        if is_active is not None:
            scheme.is_active = is_active
        scheme.save()
        return scheme

    @staticmethod
    @transaction.atomic
    def add_week(*, scheme, week_number, topic, subtopic='',
                 learning_outcomes='', reference_materials='', lesson_count=1):
        if SchemeWeek.objects.filter(scheme=scheme, week_number=week_number).exists():
            raise ValueError(f"Week {week_number} already exists in this scheme.")

        return SchemeWeek.objects.create(
            scheme=scheme,
            week_number=week_number,
            topic=topic,
            subtopic=subtopic,
            learning_outcomes=learning_outcomes,
            reference_materials=reference_materials,
            lesson_count=lesson_count,
        )

    @staticmethod
    @transaction.atomic
    def update_week_status(*, week, status):
        valid = dict(SchemeWeek.STATUS_CHOICES).keys()
        if status not in valid:
            raise ValueError(f"Invalid status: {status}. Must be one of: {valid}")
        week.status = status
        week.save()
        return week


class LessonPlanService:
    """Business logic for lesson plan lifecycle."""

    # Allowed state transitions
    TRANSITIONS = {
        'draft':      ('submitted',),
        'submitted':  ('under_review', 'approved', 'rejected'),
        'under_review': ('approved', 'rejected'),
        'rejected':   ('draft',),
        'approved':   ('scheduled', 'completed'),
        'scheduled':  ('delivered', 'completed'),
        'delivered':  ('completed',),
        'completed':  ('archived',),
        'archived':   (),
    }

    @staticmethod
    @transaction.atomic
    def create_plan(*, madrasah, teacher, subject, school_class,
                    title, lesson_date, status='draft', **kwargs):
        plan = LessonPlan(
            madrasah=madrasah,
            teacher=teacher,
            subject=subject,
            school_class=school_class,
            title=title,
            lesson_date=lesson_date,
            status=status,
        )
        for field, val in kwargs.items():
            if hasattr(plan, field):
                setattr(plan, field, val)
        plan.save()

        AuditService.log(
            actor=teacher, action='created', model_name='lessonplan',
            object_id=plan.pk, new_data={'title': title, 'lesson_date': str(lesson_date)},
        )
        return plan

    @staticmethod
    @transaction.atomic
    def update_plan(*, plan, actor, **kwargs):
        prev = {f: getattr(plan, f) for f in kwargs if hasattr(plan, f)}

        for field, val in kwargs.items():
            if hasattr(plan, field):
                setattr(plan, field, val)
        plan.save()

        AuditService.log(
            actor=actor, action='updated', model_name='lessonplan',
            object_id=plan.pk, previous_data=prev, new_data=kwargs,
        )
        return plan

    @classmethod
    def transition_status(cls, *, plan, target_status, actor, reason='', ip_address=None):
        allowed = cls.TRANSITIONS.get(plan.status, ())
        if target_status not in allowed:
            raise ValueError(
                f"Cannot transition from '{plan.status}' to '{target_status}'. "
                f"Allowed: {allowed}"
            )

        prev_status = plan.status
        plan.status = target_status
        now_ = now()

        if target_status == 'submitted':
            plan.submitted_at = now_
        elif target_status in ('approved',):
            plan.approved_by = actor
            plan.approved_at = now_
            if reason:
                plan.approval_notes = reason
        elif target_status == 'rejected':
            plan.approval_notes = reason
        plan.save()

        AuditService.log(
            actor=actor, action='status_changed', model_name='lessonplan',
            object_id=plan.pk,
            previous_data={'status': prev_status},
            new_data={'status': target_status},
            reason=reason, ip_address=ip_address,
        )
        return plan

    @staticmethod
    @transaction.atomic
    def add_resource(*, lesson, resource_type, title, url='', file=None,
                     description='', order=0):
        return LessonResource.objects.create(
            lesson=lesson,
            resource_type=resource_type,
            title=title,
            url=url,
            file=file,
            description=description,
            order=order,
        )

    @staticmethod
    @transaction.atomic
    def record_delivery(*, lesson, delivered_by, delivery_date,
                        delivery_status='completed', students_present=0,
                        students_absent=0, total_students=0,
                        homework_given=False, assessment_conducted=False,
                        actual_duration_minutes=None, challenges='',
                        recommendations=''):
        delivery, _ = LessonDelivery.objects.update_or_create(
            lesson=lesson,
            defaults={
                'delivered_by': delivered_by,
                'delivery_date': delivery_date,
                'delivery_status': delivery_status,
                'students_present': students_present,
                'students_absent': students_absent,
                'total_students': total_students,
                'homework_given': homework_given,
                'assessment_conducted': assessment_conducted,
                'actual_duration_minutes': actual_duration_minutes,
                'challenges': challenges,
                'recommendations': recommendations,
            },
        )
        return delivery

    @staticmethod
    @transaction.atomic
    def add_reflection(*, lesson, teacher, what_went_well='',
                       what_to_improve='', student_understanding='',
                       next_steps='', self_rating=3):
        return LessonReflection.objects.create(
            lesson=lesson,
            teacher=teacher,
            what_went_well=what_went_well,
            what_to_improve=what_to_improve,
            student_understanding=student_understanding,
            next_steps=next_steps,
            self_rating=self_rating,
        )


class HomeworkService:
    """CRUD and grading logic for homework."""

    @staticmethod
    @transaction.atomic
    def create_homework(*, madrasah, teacher, subject, school_class,
                        title, description, due_date, total_marks=None,
                        lesson_plan=None, is_published=False,
                        late_submission_allowed=True, attachments=None,
                        file=None):
        hw = Homework.objects.create(
            madrasah=madrasah,
            teacher=teacher,
            subject=subject,
            school_class=school_class,
            title=title,
            description=description,
            due_date=due_date,
            total_marks=total_marks,
            lesson_plan=lesson_plan,
            is_published=is_published,
            late_submission_allowed=late_submission_allowed,
            attachments=attachments or [],
            file=file,
        )
        return hw

    @staticmethod
    @transaction.atomic
    def submit_homework(*, homework, student, madrasah, content='',
                        file=None, attachments=None):
        if homework.is_late_submission_allowed is False and homework.due_date < now():
            raise ValueError("Late submissions are not allowed for this homework.")

        is_late = now() > homework.due_date

        submission, created = HomeworkSubmission.objects.update_or_create(
            homework=homework,
            student=student,
            defaults={
                'madrasah': madrasah,
                'content': content,
                'file': file,
                'attachments': attachments or [],
                'is_late': is_late,
            },
        )
        if not created:
            submission.content = content
            if file:
                submission.file = file
            if attachments is not None:
                submission.attachments = attachments
            submission.is_late = is_late
            submission.save()

        return submission

    @staticmethod
    @transaction.atomic
    def grade_submission(*, submission, score, feedback='', graded_by):
        if submission.homework.total_marks and score > submission.homework.total_marks:
            raise ValueError(
                f"Score {score} exceeds total marks {submission.homework.total_marks}.")

        submission.score = score
        submission.feedback = feedback
        submission.graded_by = graded_by
        submission.graded_at = now()
        submission.status = 'graded'
        submission.save()
        return submission


class AnalyticsService:
    """Compute and cache analytics snapshots for lesson plans."""

    @staticmethod
    @transaction.atomic
    def compute_analytics(*, teacher, subject, school_class, term):
        plans = LessonPlan.objects.filter(
            madrasah=teacher.madrasah,
            teacher=teacher,
            subject=subject,
            school_class=school_class,
        )

        total_planned = plans.count()
        total_delivered = plans.filter(status__in=('delivered', 'completed')).count()
        total_missed = plans.filter(status='scheduled').count()

        delivered_qs = LessonDelivery.objects.filter(
            lesson__teacher=teacher,
            lesson__subject=subject,
            lesson__school_class=school_class,
        )

        avg_duration = delivered_qs.aggregate(
            avg=Avg('actual_duration_minutes'))['avg'] or 0

        reflections = LessonReflection.objects.filter(
            lesson__teacher=teacher,
            lesson__subject=subject,
            lesson__school_class=school_class,
        )
        avg_rating = reflections.aggregate(avg=Avg('self_rating'))['avg'] or 0

        completion_rate = (
            Decimal(total_delivered) / Decimal(total_planned) * 100
            if total_planned > 0 else Decimal(0)
        )

        snapshot, _ = LessonAnalyticsSnapshot.objects.update_or_create(
            teacher=teacher,
            subject=subject,
            school_class=school_class,
            term=term,
            defaults={
                'total_planned': total_planned,
                'total_delivered': total_delivered,
                'total_missed': total_missed,
                'completion_rate': completion_rate.quantize(
                    Decimal('0.01'), rounding=ROUND_HALF_UP),
                'avg_delivery_duration': avg_duration.quantize(
                    Decimal('0.0'), rounding=ROUND_HALF_UP),
                'avg_self_rating': avg_rating.quantize(
                    Decimal('0.0'), rounding=ROUND_HALF_UP),
            },
        )
        return snapshot
