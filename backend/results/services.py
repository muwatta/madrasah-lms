from __future__ import annotations

import math
from decimal import Decimal, ROUND_HALF_UP
from typing import Any

from django.db import transaction
from django.db.models import Avg, Count, Q, Sum, QuerySet
from django.utils.timezone import now

from academic.models import Session, Term
from curriculum.models import SchoolClass, Subject
from school_ops.models import Attendance
from users.models import User

from .models import (
    AUDIT_MODEL,
    AnnualResult,
    Assessment,
    AssessmentBlueprint,
    AssessmentScore,
    BlueprintComponent,
    GradeScale,
    ReportCard,
    ResultApproval,
    ResultAuditLog,
    ResultPublication,
    StudentRank,
    SubjectResult,
    TermResult,
)


# ── Audit Log Service ──────────────────────────────────────────────


class AuditService:
    """Immutable audit trail for result mutations."""

    @staticmethod
    @transaction.atomic
    def log(
        actor: User | None,
        action: str,
        model_name: str,
        object_id: str | int,
        previous_data: dict[str, Any] | None = None,
        new_data: dict[str, Any] | None = None,
        reason: str = '',
        ip: str | None = None,
    ) -> ResultAuditLog:
        """Create an immutable audit log entry.

        Args:
            actor: The user performing the action.
            action: Human-readable action description.
            model_name: Must match a value from AUDIT_MODEL choices.
            object_id: Primary key of the affected object.
            previous_data: Snapshot of the object before the change.
            new_data: Snapshot of the object after the change.
            reason: Free-text reason for the action.
            ip: Optional IP address of the actor.

        Returns:
            The created ``ResultAuditLog`` instance.

        Raises:
            ValueError: If *model_name* is not a valid choice.
        """
        valid_models = {choice[0] for choice in AUDIT_MODEL}
        if model_name not in valid_models:
            raise ValueError(
                f"Invalid model_name '{model_name}'. "
                f"Must be one of: {sorted(valid_models)}"
            )

        return ResultAuditLog.objects.create(
            actor=actor,
            action=action,
            model_name=model_name,
            object_id=str(object_id),
            previous_data=previous_data or {},
            new_data=new_data or {},
            reason=reason,
            ip_address=ip,
        )


# ── Scoring Service ────────────────────────────────────────────────


class ScoringService:
    """Handles score entry, recalculation, and assessment generation."""

    @staticmethod
    def _serialize_subject_result(sr: SubjectResult) -> dict[str, Any]:
        """Return a JSON-safe snapshot of a SubjectResult."""
        return {
            'total_score': str(sr.total_score),
            'grade': sr.grade,
            'grade_remark': sr.grade_remark,
            'gpa_points': str(sr.gpa_points),
            'status': sr.status,
        }

    @staticmethod
    @transaction.atomic
    def bulk_save_scores(
        assessment: Assessment,
        scores_data: list[dict[str, Any]],
        actor: User,
    ) -> list[AssessmentScore]:
        """Save scores for a single assessment component in bulk.

        Each entry in *scores_data* must contain:
            - ``student_id`` (int)
            - ``score`` (Decimal or numeric)
            - ``remarks`` (str, optional)

        Each score must be ``>= 0`` and ``<= assessment.max_score``.
        After saving, the corresponding ``SubjectResult`` for every
        affected student is recalculated.

        Args:
            assessment: The ``Assessment`` being scored.
            scores_data: List of score dicts.
            actor: The user entering the scores.

        Returns:
            List of created or updated ``AssessmentScore`` instances.

        Raises:
            ValueError: If any score exceeds ``assessment.max_score``,
                is negative, or if ``student_id`` is missing.
        """
        if not scores_data:
            return []

        max_score = assessment.max_score

        for entry in scores_data:
            if 'student_id' not in entry:
                raise ValueError(
                    "Each score entry must contain 'student_id'."
                )
            score = Decimal(str(entry['score']))
            if score < 0:
                raise ValueError(
                    f"Score for student_id={entry['student_id']} "
                    f"cannot be negative (got {score})."
                )
            if score > max_score:
                raise ValueError(
                    f"Score {score} for student_id={entry['student_id']} "
                    f"exceeds max_score {max_score} for assessment "
                    f"'{assessment.name}'."
                )

        created_or_updated: list[AssessmentScore] = []
        affected_student_ids: set[int] = set()

        for entry in scores_data:
            student_id = int(entry['student_id'])
            score = Decimal(str(entry['score']))
            remarks = entry.get('remarks', '')

            obj, _created = AssessmentScore.objects.update_or_create(
                assessment=assessment,
                student_id=student_id,
                defaults={
                    'score': score,
                    'remarks': remarks,
                    'entered_by': actor,
                },
            )
            created_or_updated.append(obj)
            affected_student_ids.add(student_id)

        for student_id in affected_student_ids:
            ScoringService.recalculate_subject_result(
                student=User.objects.get(pk=student_id),
                subject=assessment.subject,
                term=assessment.term,
                school_class=assessment.school_class,
                actor=actor,
            )

        return created_or_updated

    @staticmethod
    @transaction.atomic
    def recalculate_subject_result(
        student: User,
        subject: Subject,
        term: Term,
        school_class: SchoolClass,
        actor: User | None = None,
    ) -> SubjectResult:
        """Recalculate the weighted total for one student+subject+term.

        Algorithm:
            1. Fetch all ``Assessment`` objects for the subject+term+class.
            2. For each assessment where the student has a score, compute
               ``(score / max_score) * weight`` and sum the results.
            3. Look up the madrasah's default ``GradeScale`` to determine
               grade, remark, and GPA points.
            4. Create or update the ``SubjectResult`` record.

        Args:
            student: The student whose result is being recalculated.
            subject: The subject.
            term: The academic term.
            school_class: The class/section.
            actor: Optional user performing the recalculation.

        Returns:
            The created or updated ``SubjectResult``.
        """
        assessments = list(
            Assessment.objects
            .filter(subject=subject, term=term, school_class=school_class)
            .order_by('order', 'name')
        )

        score_queryset = (
            AssessmentScore.objects
            .filter(
                assessment__subject=subject,
                assessment__term=term,
                assessment__school_class=school_class,
                student=student,
            )
            .select_related('assessment')
        )
        scores_map: dict[int, Decimal] = {
            s.assessment_id: s.score for s in score_queryset
        }

        total_score = Decimal('0')
        for assessment in assessments:
            raw_score = scores_map.get(assessment.id)
            if raw_score is None:
                continue
            max_score = assessment.max_score
            weight = assessment.weight
            if max_score > 0:
                weighted = (raw_score / max_score) * weight
                total_score += weighted

        total_score = total_score.quantize(
            Decimal('0.01'), rounding=ROUND_HALF_UP
        )

        grade_scale = (
            GradeScale.objects
            .filter(madrasah=school_class.madrasah, is_default=True)
            .first()
        )
        grade_letter = ''
        grade_remark = ''
        gpa_points = Decimal('0.0')
        if grade_scale:
            grade_letter, grade_remark = grade_scale.get_grade(
                float(total_score), max_score=100.0
            )
            gpa_points = Decimal(
                str(grade_scale.get_gpa_points(float(total_score), max_score=100.0))
            )

        previous_data: dict[str, Any] = {}
        sr, created = SubjectResult.objects.get_or_create(
            student=student,
            subject=subject,
            term=term,
            defaults={
                'school_class': school_class,
                'total_score': total_score,
                'grade': grade_letter,
                'grade_remark': grade_remark,
                'gpa_points': gpa_points,
                'status': 'draft',
            },
        )

        if not created:
            previous_data = ScoringService._serialize_subject_result(sr)
            sr.total_score = total_score
            sr.grade = grade_letter
            sr.grade_remark = grade_remark
            sr.gpa_points = gpa_points
            sr.save(update_fields=[
                'total_score', 'grade', 'grade_remark',
                'gpa_points', 'updated_at',
            ])

        new_data = ScoringService._serialize_subject_result(sr)
        if previous_data != new_data:
            AuditService.log(
                actor=actor,
                action='recalculate',
                model_name='subjectresult',
                object_id=sr.pk,
                previous_data=previous_data,
                new_data=new_data,
            )

        return sr

    @staticmethod
    def recalculate_all_subject_results(
        term: Term,
        school_class: SchoolClass,
    ) -> int:
        """Recalculate every ``SubjectResult`` in a term+class.

        Args:
            term: The academic term.
            school_class: The class/section.

        Returns:
            Count of recalculated ``SubjectResult`` records.
        """
        subject_results = (
            SubjectResult.objects
            .filter(term=term, school_class=school_class)
            .select_related('student', 'subject')
        )
        count = 0
        for sr in subject_results:
            ScoringService.recalculate_subject_result(
                student=sr.student,
                subject=sr.subject,
                term=sr.term,
                school_class=sr.school_class,
            )
            count += 1
        return count

    @staticmethod
    @transaction.atomic
    def generate_assessments_from_blueprint(
        blueprint: AssessmentBlueprint,
        subject: Subject,
        term: Term,
        actor: User,
    ) -> list[Assessment]:
        """Create ``Assessment`` objects from blueprint components.

        For each ``BlueprintComponent`` in the blueprint, an
        ``Assessment`` is created (or updated if one already exists for
        the same subject+term+component_type+name).

        Args:
            blueprint: The ``AssessmentBlueprint`` template.
            subject: The subject to generate assessments for.
            term: The academic term.
            actor: The user generating the assessments.

        Returns:
            List of created or updated ``Assessment`` instances.

        Raises:
            ValueError: If the blueprint has no components.
        """
        components = list(
            blueprint.components.order_by('order', 'name')
        )
        if not components:
            raise ValueError(
                f"Blueprint '{blueprint.name}' has no components."
            )

        created: list[Assessment] = []
        for idx, component in enumerate(components):
            assessment, _created = (
                Assessment.objects
                .update_or_create(
                    madrasah=blueprint.madrasah,
                    subject=subject,
                    term=term,
                    school_class=blueprint.school_class,
                    blueprint_component=component,
                    defaults={
                        'component_type': component.component_type,
                        'name': component.name,
                        'max_score': component.max_score,
                        'weight': component.weight,
                        'order': component.order or idx,
                        'created_by': actor,
                    },
                )
            )
            created.append(assessment)

        return created


# ── Ranking Service ────────────────────────────────────────────────


class RankingService:
    """Calculates student ranks for subjects, classes, and sessions."""

    @staticmethod
    def _ordinal_suffix(n: int) -> str:
        """Return the ordinal string for an integer (e.g. 1st, 2nd)."""
        if not isinstance(n, int) or n < 1:
            raise ValueError(f"Expected a positive integer, got {n}.")
        if 11 <= (n % 100) <= 13:
            return f"{n}th"
        suffixes = {1: 'st', 2: 'nd', 3: 'rd'}
        return f"{n}{suffixes.get(n % 10, 'th')}"

    @staticmethod
    def _assign_ranks(
        students_with_scores: list[tuple[int, Decimal]],
        rank_type: str,
        term: Term,
        school_class: SchoolClass,
        subject: Subject | None = None,
    ) -> int:
        """Internal helper to assign ranks handling ties.

        *students_with_scores* is a list of ``(student_id, score)`` tuples
        sorted by score descending.

        Returns the number of ``StudentRank`` records created or updated.
        """
        if not students_with_scores:
            return 0

        total_students = len(students_with_scores)
        records_to_upsert: list[StudentRank] = []
        current_rank = 1
        idx = 0

        while idx < total_students:
            current_score = students_with_scores[idx][1]
            tied_ids: list[int] = []

            while (
                idx < total_students
                and students_with_scores[idx][1] == current_score
            ):
                tied_ids.append(students_with_scores[idx][0])
                idx += 1

            tied_with = [sid for sid in tied_ids if len(tied_ids) > 1]

            for student_id in tied_ids:
                rank_obj, _ = StudentRank.objects.update_or_create(
                    student_id=student_id,
                    term=term,
                    subject=subject,
                    rank_type=rank_type,
                    defaults={
                        'school_class': school_class,
                        'rank': current_rank,
                        'total_students': total_students,
                        'tied_with': tied_with,
                        'score': current_score,
                    },
                )
                records_to_upsert.append(rank_obj)

            current_rank += len(tied_ids)

        return len(records_to_upsert)

    @classmethod
    @transaction.atomic
    def calculate_subject_ranks(
        cls,
        term: Term,
        school_class: SchoolClass,
        subject: Subject | None = None,
    ) -> int:
        """Calculate ranks for students in one or all subjects.

        When *subject* is ``None``, ranks are computed independently
        for each subject taught in the class.

        Rank is stored in ``StudentRank`` with ``rank_type='subject'``.

        Args:
            term: The academic term.
            school_class: The class/section.
            subject: Optional specific subject.  If ``None``, all
                subjects are processed.

        Returns:
            Total number of ``StudentRank`` records created or updated.
        """
        subjects = [subject] if subject else list(
            Subject.objects.filter(
                subject_results__term=term,
                subject_results__school_class=school_class,
            ).distinct()
        )

        total_updated = 0
        for subj in subjects:
            results = (
                SubjectResult.objects
                .filter(
                    term=term,
                    school_class=school_class,
                    subject=subj,
                )
                .values_list('student_id', 'total_score')
                .order_by('-total_score')
            )
            students_with_scores = [
                (sid, Decimal(str(score)))
                for sid, score in results
            ]
            total_updated += cls._assign_ranks(
                students_with_scores=students_with_scores,
                rank_type='subject',
                term=term,
                school_class=school_class,
                subject=subj,
            )

        return total_updated

    @classmethod
    @transaction.atomic
    def calculate_class_ranks(
        cls,
        term: Term,
        school_class: SchoolClass,
    ) -> int:
        """Calculate overall class rank based on ``TermResult.average_score``.

        Stored in ``StudentRank`` with ``rank_type='class'``.

        Args:
            term: The academic term.
            school_class: The class/section.

        Returns:
            Total number of ``StudentRank`` records created or updated.
        """
        results = (
            TermResult.objects
            .filter(term=term, school_class=school_class)
            .values_list('student_id', 'average_score')
            .order_by('-average_score')
        )
        students_with_scores = [
            (sid, Decimal(str(avg)))
            for sid, avg in results
        ]
        return cls._assign_ranks(
            students_with_scores=students_with_scores,
            rank_type='class',
            term=term,
            school_class=school_class,
        )

    @classmethod
    @transaction.atomic
    def calculate_overall_ranks(
        cls,
        session: Session,
        school_class: SchoolClass,
    ) -> int:
        """Calculate overall rank across all terms in a session.

        Aggregates each student's ``average_score`` across terms and
        stores the result in ``StudentRank`` with ``rank_type='overall'``.

        Args:
            session: The academic session / year.
            school_class: The class/section.

        Returns:
            Total number of ``StudentRank`` records created or updated.
        """
        term_ids = list(
            Term.objects
            .filter(session=session)
            .values_list('id', flat=True)
        )
        if not term_ids:
            return 0

        aggregated = (
            TermResult.objects
            .filter(term_id__in=term_ids, school_class=school_class)
            .values('student_id')
            .annotate(avg_score=Avg('average_score'))
            .order_by('-avg_score')
        )
        students_with_scores = [
            (entry['student_id'], Decimal(str(entry['avg_score'] or 0)))
            for entry in aggregated
        ]

        terms_in_session = Term.objects.filter(session=session)
        total_updated = 0
        for term in terms_in_session:
            total_updated += cls._assign_ranks(
                students_with_scores=students_with_scores,
                rank_type='overall',
                term=term,
                school_class=school_class,
            )

        return total_updated


# ── Approval / Workflow Service ────────────────────────────────────


class ApprovalService:
    """Manages the result approval workflow and state transitions."""

    VALID_TRANSITIONS: dict[str, list[str]] = {
        'draft': ['submitted'],
        'submitted': ['under_review', 'rejected'],
        'under_review': ['approved', 'rejected'],
        'approved': ['published'],
        'published': ['locked'],
        'locked': ['archived'],
        'rejected': ['draft', 'submitted'],
        'archived': [],
    }

    _STATUS_TO_ACTION_MAP: dict[str, str] = {
        'submitted': 'submit',
        'approved': 'approve',
        'rejected': 'reject',
        'published': 'publish',
    }

    @classmethod
    @transaction.atomic
    def transition_status(
        cls,
        subject_result: SubjectResult,
        new_status: str,
        actor: User,
        comment: str = '',
    ) -> ResultApproval:
        """Transition a ``SubjectResult`` to a new workflow status.

        Validates that the transition is allowed from the current status.

        Args:
            subject_result: The result to transition.
            new_status: The target status.
            actor: The user performing the transition.
            comment: Optional comment explaining the transition.

        Returns:
            The created ``ResultApproval`` record.

        Raises:
            ValueError: If the transition is not allowed from the
                current status.
        """
        current_status = subject_result.status

        if new_status not in cls.VALID_TRANSITIONS.get(current_status, []):
            allowed = cls.VALID_TRANSITIONS.get(current_status, [])
            raise ValueError(
                f"Cannot transition from '{current_status}' to '{new_status}'. "
                f"Allowed transitions: {allowed}"
            )

        previous_data = ScoringService._serialize_subject_result(subject_result)

        subject_result.status = new_status
        update_fields: list[str] = ['status', 'updated_at']

        if new_status == 'published':
            subject_result.published_at = now()
            update_fields.append('published_at')

        if new_status == 'submitted':
            subject_result.submitted_by = actor
            subject_result.submitted_at = now()
            update_fields.extend(['submitted_by', 'submitted_at'])

        subject_result.save(update_fields=update_fields)

        action_label = cls._STATUS_TO_ACTION_MAP.get(new_status, new_status)

        approval = ResultApproval.objects.create(
            subject_result=subject_result,
            actor=actor,
            action=action_label,
            comment=comment,
            previous_status=current_status,
            new_status=new_status,
        )

        new_data = ScoringService._serialize_subject_result(subject_result)

        AuditService.log(
            actor=actor,
            action=f'transition_{new_status}',
            model_name='subjectresult',
            object_id=subject_result.pk,
            previous_data=previous_data,
            new_data=new_data,
            reason=comment,
        )

        return approval

    @classmethod
    @transaction.atomic
    def bulk_submit(
        cls,
        subject_ids: list[int],
        term_id: int,
        school_class_id: int,
        actor: User,
    ) -> int:
        """Transition all draft ``SubjectResult`` records to ``submitted``.

        Args:
            subject_ids: List of subject PKs to include.
            term_id: The term PK.
            school_class_id: The school class PK.
            actor: The user performing the submission.

        Returns:
            Count of successfully transitioned records.
        """
        results = (
            SubjectResult.objects
            .filter(
                subject_id__in=subject_ids,
                term_id=term_id,
                school_class_id=school_class_id,
                status='draft',
            )
        )
        count = 0
        for sr in results:
            cls.transition_status(sr, 'submitted', actor)
            count += 1
        return count

    @classmethod
    @transaction.atomic
    def bulk_approve(
        cls,
        subject_ids: list[int],
        term_id: int,
        school_class_id: int,
        actor: User,
    ) -> int:
        """Transition submitted or under_review results to ``approved``.

        Args:
            subject_ids: List of subject PKs to include.
            term_id: The term PK.
            school_class_id: The school class PK.
            actor: The user performing the approval.

        Returns:
            Count of successfully transitioned records.
        """
        results = (
            SubjectResult.objects
            .filter(
                subject_id__in=subject_ids,
                term_id=term_id,
                school_class_id=school_class_id,
                status__in=['submitted', 'under_review'],
            )
        )
        count = 0
        for sr in results:
            cls.transition_status(sr, 'approved', actor)
            count += 1
        return count

    @classmethod
    @transaction.atomic
    def bulk_publish(
        cls,
        term_id: int,
        school_class_id: int,
        actor: User,
    ) -> int:
        """Transition all approved ``SubjectResult`` records to ``published``.

        Also creates a ``ResultPublication`` record for the event.

        Args:
            term_id: The term PK.
            school_class_id: The school class PK.
            actor: The user performing the publish.

        Returns:
            Count of successfully transitioned records.
        """
        term = Term.objects.get(pk=term_id)
        school_class = SchoolClass.objects.get(pk=school_class_id)

        results = (
            SubjectResult.objects
            .filter(
                term_id=term_id,
                school_class_id=school_class_id,
                status='approved',
            )
        )
        count = 0
        for sr in results:
            cls.transition_status(sr, 'published', actor)
            count += 1

        if count > 0:
            ResultPublication.objects.create(
                session=term.session,
                term=term,
                school_class=school_class,
                published_by=actor,
                status='published',
            )
            _notify_parents_of_published_results(results, term, actor)

        return count

    @classmethod
    @transaction.atomic
    def bulk_reopen(
        cls,
        subject_result_ids: list[int],
        actor: User,
        reason: str = '',
    ) -> int:
        """Reopen published or locked results back to ``submitted`` or ``draft``.

        Args:
            subject_result_ids: List of ``SubjectResult`` PKs to reopen.
            actor: The user performing the reopen.
            reason: Explanation for reopening.

        Returns:
            Count of successfully transitioned records.

        Raises:
            ValueError: If any result is in a non-reopenable state.
        """
        results = (
            SubjectResult.objects
            .filter(
                id__in=subject_result_ids,
                status__in=['published', 'locked'],
            )
        )
        count = 0
        for sr in results:
            target = 'submitted'
            cls.transition_status(sr, target, actor, comment=reason)
            count += 1
        return count


# ── Term Aggregation Service ───────────────────────────────────────


class TermAggregationService:
    """Aggregates subject results into term and annual summaries."""

    @staticmethod
    @transaction.atomic
    def aggregate_term(
        student: User,
        term: Term,
        school_class: SchoolClass,
    ) -> TermResult:
        """Aggregate all subject results into a single ``TermResult``.

        Algorithm:
            1. Get all ``SubjectResult`` objects for this student+term+class.
            2. Calculate ``average_score`` = mean of ``total_score``.
            3. Calculate ``gpa`` = mean of ``gpa_points``.
            4. Determine grade from average using the default ``GradeScale``.
            5. Count ``subjects_passed`` (total_score >= 50) and
               ``subjects_failed``.
            6. Determine status based on the most advanced workflow state.
            7. Create or update the ``TermResult``.
            8. Calculate class position via ``RankingService``.

        Args:
            student: The student.
            term: The academic term.
            school_class: The class/section.

        Returns:
            The created or updated ``TermResult``.
        """
        subject_results = (
            SubjectResult.objects
            .filter(student=student, term=term, school_class=school_class)
            .select_related('subject')
        )

        total_subjects = subject_results.count()
        if total_subjects == 0:
            tr, _ = TermResult.objects.get_or_create(
                student=student,
                term=term,
                defaults={
                    'school_class': school_class,
                    'average_score': Decimal('0'),
                    'gpa': Decimal('0.00'),
                    'total_subjects': 0,
                    'status': 'draft',
                },
            )
            return tr

        avg_score = subject_results.aggregate(
            avg=Avg('total_score')
        )['avg'] or Decimal('0')
        avg_score = Decimal(str(avg_score)).quantize(
            Decimal('0.01'), rounding=ROUND_HALF_UP
        )

        avg_gpa = subject_results.aggregate(
            avg=Avg('gpa_points')
        )['avg'] or Decimal('0')
        avg_gpa = Decimal(str(avg_gpa)).quantize(
            Decimal('0.02'), rounding=ROUND_HALF_UP
        )

        subjects_passed = subject_results.filter(
            total_score__gte=50
        ).count()
        subjects_failed = total_subjects - subjects_passed

        grade_scale = (
            GradeScale.objects
            .filter(madrasah=school_class.madrasah, is_default=True)
            .first()
        )
        grade_letter = ''
        grade_remark = ''
        if grade_scale:
            grade_letter, grade_remark = grade_scale.get_grade(
                float(avg_score), max_score=100.0
            )

        status_priority = [
            'draft', 'submitted', 'under_review',
            'rejected', 'approved', 'published', 'locked', 'archived',
        ]
        statuses = list(
            subject_results.values_list('status', flat=True).distinct()
        )
        best_status = 'draft'
        for s in statuses:
            if s in status_priority:
                idx = status_priority.index(s)
                if status_priority.index(best_status) < idx:
                    best_status = s

        tr, created = TermResult.objects.get_or_create(
            student=student,
            term=term,
            defaults={
                'school_class': school_class,
                'average_score': avg_score,
                'gpa': avg_gpa,
                'total_subjects': total_subjects,
                'subjects_passed': subjects_passed,
                'subjects_failed': subjects_failed,
                'grade': grade_letter,
                'grade_remark': grade_remark,
                'status': best_status,
            },
        )

        if not created:
            tr.average_score = avg_score
            tr.gpa = avg_gpa
            tr.total_subjects = total_subjects
            tr.subjects_passed = subjects_passed
            tr.subjects_failed = subjects_failed
            tr.grade = grade_letter
            tr.grade_remark = grade_remark
            if status_priority.index(best_status) > status_priority.index(tr.status):
                tr.status = best_status
            tr.save(update_fields=[
                'average_score', 'gpa', 'total_subjects',
                'subjects_passed', 'subjects_failed',
                'grade', 'grade_remark', 'status', 'updated_at',
            ])

        RankingService.calculate_class_ranks(term, school_class)

        return tr

    @staticmethod
    def aggregate_all_terms(
        term_id: int,
        school_class_id: int,
    ) -> int:
        """Aggregate ``TermResult`` for every student in a term+class.

        Args:
            term_id: The term PK.
            school_class_id: The school class PK.

        Returns:
            Count of aggregated ``TermResult`` records.
        """
        term = Term.objects.get(pk=term_id)
        school_class = SchoolClass.objects.get(pk=school_class_id)

        student_ids = (
            SubjectResult.objects
            .filter(term=term, school_class=school_class)
            .values_list('student_id', flat=True)
            .distinct()
        )
        count = 0
        for student_id in student_ids:
            student = User.objects.get(pk=student_id)
            TermAggregationService.aggregate_term(student, term, school_class)
            count += 1
        return count

    @staticmethod
    @transaction.atomic
    def aggregate_annual(
        student: User,
        session: Session,
        school_class: SchoolClass,
    ) -> AnnualResult:
        """Aggregate ``TermResult`` records across all terms in a session.

        Args:
            student: The student.
            session: The academic session / year.
            school_class: The class/section.

        Returns:
            The created or updated ``AnnualResult``.
        """
        terms = Term.objects.filter(session=session).order_by('term_number')

        term_results = (
            TermResult.objects
            .filter(
                student=student,
                term__session=session,
                school_class=school_class,
            )
            .select_related('term')
        )

        total_terms = term_results.count()
        if total_terms == 0:
            ar, _ = AnnualResult.objects.get_or_create(
                student=student,
                session=session,
                defaults={
                    'school_class': school_class,
                    'annual_average': Decimal('0'),
                    'annual_gpa': Decimal('0.00'),
                    'total_subjects': 0,
                    'status': 'draft',
                },
            )
            return ar

        annual_avg = term_results.aggregate(
            avg=Avg('average_score')
        )['avg'] or Decimal('0')
        annual_avg = Decimal(str(annual_avg)).quantize(
            Decimal('0.01'), rounding=ROUND_HALF_UP
        )

        annual_gpa = term_results.aggregate(
            avg=Avg('gpa')
        )['avg'] or Decimal('0')
        annual_gpa = Decimal(str(annual_gpa)).quantize(
            Decimal('0.02'), rounding=ROUND_HALF_UP
        )

        total_subjects = sum(tr.total_subjects for tr in term_results)
        subjects_passed = sum(tr.subjects_passed for tr in term_results)
        subjects_failed = sum(tr.subjects_failed for tr in term_results)

        grade_scale = (
            GradeScale.objects
            .filter(madrasah=school_class.madrasah, is_default=True)
            .first()
        )
        grade_letter = ''
        grade_remark = ''
        if grade_scale:
            grade_letter, grade_remark = grade_scale.get_grade(
                float(annual_avg), max_score=100.0
            )

        promoted = subjects_passed >= (total_subjects / 2) if total_subjects else True

        status_priority = [
            'draft', 'submitted', 'under_review',
            'rejected', 'approved', 'published', 'locked', 'archived',
        ]
        term_statuses = list(term_results.values_list('status', flat=True))
        best_status = 'draft'
        for s in term_statuses:
            if s in status_priority:
                if status_priority.index(s) > status_priority.index(best_status):
                    best_status = s

        ar, created = AnnualResult.objects.get_or_create(
            student=student,
            session=session,
            defaults={
                'school_class': school_class,
                'annual_average': annual_avg,
                'annual_gpa': annual_gpa,
                'grade': grade_letter,
                'grade_remark': grade_remark,
                'total_subjects': total_subjects,
                'subjects_passed': subjects_passed,
                'subjects_failed': subjects_failed,
                'promoted': promoted,
                'status': best_status,
            },
        )

        if not created:
            ar.annual_average = annual_avg
            ar.annual_gpa = annual_gpa
            ar.grade = grade_letter
            ar.grade_remark = grade_remark
            ar.total_subjects = total_subjects
            ar.subjects_passed = subjects_passed
            ar.subjects_failed = subjects_failed
            ar.promoted = promoted
            if status_priority.index(best_status) > status_priority.index(ar.status):
                ar.status = best_status
            ar.save(update_fields=[
                'annual_average', 'annual_gpa', 'grade', 'grade_remark',
                'total_subjects', 'subjects_passed', 'subjects_failed',
                'promoted', 'status', 'updated_at',
            ])

        return ar


# ── Report Card Service ────────────────────────────────────────────


class ReportCardService:
    """Generates report cards for students."""

    @staticmethod
    @transaction.atomic
    def generate_report_card(
        student: User,
        term: Term,
        actor: User,
    ) -> ReportCard:
        """Generate or update a report card for one student+term.

        Algorithm:
            1. Retrieve the ``TermResult`` for this student+term.
            2. Retrieve all ``SubjectResult`` records.
            3. Calculate attendance figures from the ``Attendance`` model.
            4. Create or update the ``ReportCard``.
            5. Audit-log the generation.

        Args:
            student: The student.
            term: The academic term.
            actor: The user generating the report card.

        Returns:
            The created or updated ``ReportCard``.

        Raises:
            ValueError: If no ``TermResult`` exists for the student+term.
        """
        term_result = (
            TermResult.objects
            .filter(student=student, term=term)
            .select_related('school_class')
            .first()
        )
        if term_result is None:
            raise ValueError(
                f"No TermResult found for student {student.pk} in term {term.pk}. "
                f"Run TermAggregationService.aggregate_term first."
            )

        school_class = term_result.school_class

        attendance_records = (
            Attendance.objects
            .filter(
                student=student,
                date__gte=term.start_date,
                date__lte=term.end_date,
            )
        )

        total_days = attendance_records.count()
        present_count = attendance_records.filter(status='present').count()
        absent_count = attendance_records.filter(status='absent').count()
        late_count = attendance_records.filter(status='late').count()
        excused_count = attendance_records.filter(status='excused').count()

        previous_data: dict[str, Any] = {}
        rc, created = ReportCard.objects.get_or_create(
            student=student,
            term=term,
            defaults={
                'session': term.session,
                'school_class': school_class,
                'term_result': term_result,
                'generated_by': actor,
                'teacher_comment': term_result.teacher_comment,
                'principal_comment': term_result.principal_comment,
                'attendance_total_days': total_days,
                'attendance_present': present_count,
                'attendance_absent': absent_count,
                'attendance_late': late_count,
                'attendance_excused': excused_count,
            },
        )

        if not created:
            previous_data = {
                'teacher_comment': rc.teacher_comment,
                'principal_comment': rc.principal_comment,
                'attendance_total_days': rc.attendance_total_days,
                'attendance_present': rc.attendance_present,
                'attendance_absent': rc.attendance_absent,
                'attendance_late': rc.attendance_late,
                'attendance_excused': rc.attendance_excused,
            }
            rc.term_result = term_result
            rc.session = term.session
            rc.school_class = school_class
            rc.teacher_comment = term_result.teacher_comment
            rc.principal_comment = term_result.principal_comment
            rc.generated_by = actor
            rc.attendance_total_days = total_days
            rc.attendance_present = present_count
            rc.attendance_absent = absent_count
            rc.attendance_late = late_count
            rc.attendance_excused = excused_count
            rc.save(update_fields=[
                'term_result', 'session', 'school_class',
                'teacher_comment', 'principal_comment',
                'generated_by', 'attendance_total_days',
                'attendance_present', 'attendance_absent',
                'attendance_late', 'attendance_excused',
                'updated_at',
            ])

        new_data = {
            'teacher_comment': rc.teacher_comment,
            'principal_comment': rc.principal_comment,
            'attendance_total_days': rc.attendance_total_days,
            'attendance_present': rc.attendance_present,
            'attendance_absent': rc.attendance_absent,
            'attendance_late': rc.attendance_late,
            'attendance_excused': rc.attendance_excused,
        }

        if not created and previous_data != new_data:
            AuditService.log(
                actor=actor,
                action='regenerate_report_card',
                model_name='reportcard',
                object_id=rc.pk,
                previous_data=previous_data,
                new_data=new_data,
            )

        return rc

    @staticmethod
    def generate_bulk_report_cards(
        term_id: int,
        school_class_id: int,
        actor: User,
    ) -> int:
        """Generate report cards for all students in a term+class.

        Args:
            term_id: The term PK.
            school_class_id: The school class PK.
            actor: The user generating the report cards.

        Returns:
            Count of generated report cards.

        Raises:
            ValueError: If the term does not exist.
        """
        term = Term.objects.get(pk=term_id)

        student_ids = (
            SubjectResult.objects
            .filter(term_id=term_id, school_class_id=school_class_id)
            .values_list('student_id', flat=True)
            .distinct()
        )

        count = 0
        for student_id in student_ids:
            student = User.objects.get(pk=student_id)
            try:
                ReportCardService.generate_report_card(student, term, actor)
                count += 1
            except ValueError:
                continue

        return count


def _notify_parents_of_published_results(results, term, actor):
    from school_ops.models import Notification
    from users.models import StudentParent

    notified = set()
    for sr in results.select_related('student', 'subject'):
        if sr.student_id in notified:
            continue
        parents = StudentParent.objects.filter(student=sr.student).select_related('parent')
        for link in parents:
            Notification.objects.create(
                madrasah=actor.madrasah,
                recipient=link.parent,
                notification_type='exam_result',
                title=f"Results Published - {term}",
                message=f"{sr.student.get_full_name()}'s results for {term} have been published.",
                link='/my-results',
            )
        notified.add(sr.student_id)
