from __future__ import annotations

import json
import logging
from collections import defaultdict
from decimal import Decimal, ROUND_HALF_UP

from django.conf import settings
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
    def create_plan(*, madrasah, teacher, title, lesson_date,
                    subject=None, school_class=None,
                    subject_id=None, school_class_id=None,
                    status='draft', **kwargs):
        from curriculum.models import Subject, SchoolClass

        if subject is None and subject_id:
            subject = Subject.objects.get(pk=subject_id)
        if school_class is None and school_class_id:
            school_class = SchoolClass.objects.get(pk=school_class_id)

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
        if homework.late_submission_allowed is False and homework.due_date < now():
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

        avg_duration = Decimal(str(delivered_qs.aggregate(
            avg=Avg('actual_duration_minutes'))['avg'] or 0))

        reflections = LessonReflection.objects.filter(
            lesson__teacher=teacher,
            lesson__subject=subject,
            lesson__school_class=school_class,
        )
        avg_rating = Decimal(str(reflections.aggregate(
            avg=Avg('self_rating'))['avg'] or 0))

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


# ──────────────────────────────────────────────────────
#  AI Generation Service
# ──────────────────────────────────────────────────────


LESSON_PLAN_SYSTEM_PROMPT = """\
You are an expert Islamic school lesson planner. Generate detailed, structured lesson plans \
that align with Islamic educational values. Always respond with valid JSON only — no markdown, \
no commentary outside the JSON.

Return a JSON object with these keys:
{
  "title": "string - lesson title",
  "learning_objectives": ["string"],
  "success_criteria": ["string"],
  "keywords": ["string"],
  "prior_knowledge": "string - what students should already know",
  "teaching_materials": ["string"],
  "references": ["string"],
  "teaching_methods": ["string"],
  "introduction": "string - lesson opener (5-10 min)",
  "lesson_development": "string - main teaching phase with clear stages",
  "student_activities": ["string"],
  "differentiation": "string - support for struggling students and extension for advanced",
  "assessment": "string - how to check understanding",
  "homework": "string - suggested homework task",
  "resources": "string - additional resources"
}
"""

SCHEME_OF_WORK_SYSTEM_PROMPT = """\
You are an expert Islamic school curriculum planner. Generate a comprehensive scheme of work. \
Always respond with valid JSON only — no markdown.

Return a JSON object:
{
  "title": "string - scheme title",
  "description": "string - overview",
  "weeks": [
    {
      "week_number": 1,
      "topic": "string",
      "subtopic": "string",
      "learning_outcomes": ["string"],
      "reference_materials": ["string"],
      "lesson_count": 2
    }
  ]
}
"""

HOMEWORK_SYSTEM_PROMPT = """\
You are an expert Islamic school teacher. Generate homework assignments that are \
educational, age-appropriate, and reinforce lesson learning. Respond with valid JSON only.

Return a JSON object:
{
  "title": "string",
  "description": "string - clear instructions for students",
  "total_marks": 20,
  "tasks": [
    {"task_number": 1, "instruction": "string", "marks": 5},
    {"task_number": 2, "instruction": "string", "marks": 10},
    {"task_number": 3, "instruction": "string", "marks": 5}
  ]
}
"""


class AIGenerationService:
    """AI-powered content generation for lesson plans, schemes of work, and homework."""

    def __init__(self):
        self.api_key = getattr(settings, 'OPENAI_API_KEY', '')
        self.base_url = getattr(settings, 'OPENAI_BASE_URL', None)
        self.model = getattr(settings, 'OPENAI_MODEL', 'gpt-3.5-turbo')
        self.max_tokens = getattr(settings, 'OPENAI_MAX_TOKENS', 2048)
        self.temperature = getattr(settings, 'OPENAI_TEMPERATURE', 0.7)
        self._client = None

    @property
    def client(self):
        if self._client is None and self.api_key:
            from openai import OpenAI
            kwargs = {'api_key': self.api_key}
            if self.base_url:
                kwargs['base_url'] = self.base_url
            self._client = OpenAI(**kwargs)
        return self._client

    def _call_ai(self, system_prompt, user_prompt):
        if not self.client:
            return None
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature,
            )
            content = response.choices[0].message.content.strip()
            if content.startswith('```'):
                content = content.split('\n', 1)[1].rsplit('```', 1)[0].strip()
            return json.loads(content)
        except json.JSONDecodeError:
            logger.warning("AI response was not valid JSON")
            return None
        except Exception as e:
            logger.error("AI generation failed: %s", e)
            return None

    def generate_lesson_plan(self, *, subject_name, topic, school_class_name,
                              term_name=None, duration_minutes=45,
                              teaching_methods=None, language='ar'):
        method_hint = ''
        if teaching_methods:
            method_hint = f"Preferred teaching methods: {', '.join(teaching_methods)}."

        lang_note = 'Respond in Arabic.' if language == 'ar' else 'Respond in English.'

        user_prompt = f"""\
Generate a detailed lesson plan for:
- Subject: {subject_name}
- Topic: {topic}
- Class: {school_class_name}
- Duration: {duration_minutes} minutes
{method_hint}
{lang_note}

Include an engaging introduction, structured development with 2-3 phases, student activities, \
formative assessment, differentiation strategies, and a homework suggestion."""

        result = self._call_ai(LESSON_PLAN_SYSTEM_PROMPT, user_prompt)
        if not result:
            return None

        return {
            'title': result.get('title', topic),
            'learning_objectives': result.get('learning_objectives', []),
            'success_criteria': result.get('success_criteria', []),
            'keywords': result.get('keywords', []),
            'prior_knowledge': result.get('prior_knowledge', ''),
            'teaching_materials': result.get('teaching_materials', []),
            'references': result.get('references', []),
            'teaching_methods': result.get('teaching_methods', []),
            'introduction': result.get('introduction', ''),
            'lesson_development': result.get('lesson_development', ''),
            'student_activities': result.get('student_activities', []),
            'differentiation': result.get('differentiation', ''),
            'assessment': result.get('assessment', ''),
            'homework': result.get('homework', ''),
            'resources': result.get('resources', ''),
        }

    def generate_scheme_of_work(self, *, subject_name, school_class_name,
                                 term_weeks=12, topic_areas=None,
                                 language='ar'):
        topics_hint = ''
        if topic_areas:
            topics_hint = f"Focus areas: {', '.join(topic_areas)}."

        lang_note = 'Respond in Arabic.' if language == 'ar' else 'Respond in English.'

        user_prompt = f"""\
Generate a {term_weeks}-week scheme of work for:
- Subject: {subject_name}
- Class: {school_class_name}
- Term duration: {term_weeks} weeks
{topics_hint}
{lang_note}

Include a clear title, description, and weekly breakdown with topics, subtopics, \
learning outcomes, reference materials, and lesson count per week."""

        result = self._call_ai(SCHEME_OF_WORK_SYSTEM_PROMPT, user_prompt)
        if not result:
            return None

        weeks = result.get('weeks', [])
        for i, week in enumerate(weeks):
            week.setdefault('week_number', i + 1)
            week.setdefault('lesson_count', 2)

        return {
            'title': result.get('title', f"{subject_name} - {school_class_name}"),
            'description': result.get('description', ''),
            'weeks': weeks,
        }

    def generate_homework(self, *, lesson_title, subject_name, topic_content,
                           total_marks=20, difficulty='medium',
                           language='ar'):
        lang_note = 'Respond in Arabic.' if language == 'ar' else 'Respond in English.'

        user_prompt = f"""\
Generate a homework assignment for:
- Lesson: {lesson_title}
- Subject: {subject_name}
- Topic covered: {topic_content}
- Total marks: {total_marks}
- Difficulty level: {difficulty}
{lang_note}

Include 3-5 tasks mixing recall, application, and creative thinking. \
Total marks should equal {total_marks}."""

        result = self._call_ai(HOMEWORK_SYSTEM_PROMPT, user_prompt)
        if not result:
            return None

        return {
            'title': result.get('title', f"HW - {lesson_title}"),
            'description': result.get('description', ''),
            'total_marks': result.get('total_marks', total_marks),
            'tasks': result.get('tasks', []),
        }

    def refine_lesson_plan(self, *, existing_plan_data, feedback,
                            language='ar'):
        lang_note = 'Respond in Arabic.' if language == 'ar' else 'Respond in English.'

        plan_text = json.dumps(existing_plan_data, ensure_ascii=False, indent=2)
        user_prompt = f"""\
Here is an existing lesson plan:
{plan_text}

Refinement instructions: {feedback}

{lang_note}

Return the improved lesson plan as JSON with the same structure. \
Apply the requested changes while keeping the good parts."""

        result = self._call_ai(LESSON_PLAN_SYSTEM_PROMPT, user_prompt)
        if not result:
            return None

        return {
            'title': result.get('title', existing_plan_data.get('title', '')),
            'learning_objectives': result.get('learning_objectives', existing_plan_data.get('learning_objectives', [])),
            'success_criteria': result.get('success_criteria', existing_plan_data.get('success_criteria', [])),
            'keywords': result.get('keywords', existing_plan_data.get('keywords', [])),
            'prior_knowledge': result.get('prior_knowledge', existing_plan_data.get('prior_knowledge', '')),
            'teaching_materials': result.get('teaching_materials', existing_plan_data.get('teaching_materials', [])),
            'references': result.get('references', existing_plan_data.get('references', [])),
            'teaching_methods': result.get('teaching_methods', existing_plan_data.get('teaching_methods', [])),
            'introduction': result.get('introduction', existing_plan_data.get('introduction', '')),
            'lesson_development': result.get('lesson_development', existing_plan_data.get('lesson_development', '')),
            'student_activities': result.get('student_activities', existing_plan_data.get('student_activities', [])),
            'differentiation': result.get('differentiation', existing_plan_data.get('differentiation', '')),
            'assessment': result.get('assessment', existing_plan_data.get('assessment', '')),
            'homework': result.get('homework', existing_plan_data.get('homework', '')),
            'resources': result.get('resources', existing_plan_data.get('resources', '')),
        }
