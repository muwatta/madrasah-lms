"""Validation functions for the Results module.

All validators raise ``ValueError`` on invalid data so callers
can translate exceptions into API error responses.
"""
from __future__ import annotations

from decimal import Decimal
from typing import Sequence

from django.db.models import Sum


def validate_score_within_range(score: float, max_score: float) -> None:
    """Score must be >= 0 and <= max_score."""
    if score < 0:
        raise ValueError(f'Score cannot be negative: {score}')
    if score > max_score:
        raise ValueError(f'Score {score} exceeds maximum {max_score}')


def validate_blueprint_weights_total(blueprint) -> None:
    """Total weight across all BlueprintComponents must equal 100%."""
    total = blueprint.components.aggregate(t=Sum('weight'))['t'] or Decimal('0')
    if abs(float(total) - 100) > 0.01:
        raise ValueError(
            f'Total weight must be 100% for blueprint "{blueprint.name}", '
            f'currently {total:.1f}%'
        )


def validate_unique_scores_entries(scores: Sequence[dict]) -> None:
    """No duplicate student IDs in a single batch."""
    seen: set[int] = set()
    for entry in scores:
        sid = int(entry['student_id'])
        if sid in seen:
            raise ValueError(f'Duplicate student ID {sid} in scores batch')
        seen.add(sid)


def validate_workflow_transition(current_status: str, new_status: str, allowed: dict) -> None:
    """Check that a workflow transition is permitted."""
    allowed_transitions = allowed.get(current_status, [])
    if new_status not in allowed_transitions:
        raise ValueError(
            f'Cannot transition from "{current_status}" to "{new_status}". '
            f'Allowed: {", ".join(allowed_transitions) or "(none)"}'
        )


def validate_grade_scale_bands(bands: list[dict]) -> None:
    """Ensure bands cover 0-100 with no overlaps or gaps."""
    sorted_bands = sorted(bands, key=lambda b: b['min_score'], reverse=True)
    for i, band in enumerate(sorted_bands):
        if band['min_score'] < 0 or band['max_score'] > 100:
            raise ValueError(f'Band {band["grade"]} scores must be between 0 and 100')
        if band['min_score'] > band['max_score']:
            raise ValueError(f'Band {band["grade"]}: min ({band["min_score"]}) > max ({band["max_score"]})')
        if i > 0:
            prev = sorted_bands[i - 1]
            if band['min_score'] > prev['max_score'] + Decimal('0.01'):
                raise ValueError(
                    f'Gap between band {prev["grade"]} (max {prev["max_score"]}) '
                    f'and band {band["grade"]} (min {band["min_score"]})'
                )
            if band['min_score'] <= prev['min_score'] and band['max_score'] >= prev['min_score']:
                raise ValueError(f'Overlapping bands {band["grade"]} and {prev["grade"]}')


def validate_all_scores_entered(student_ids: set[int], assessment_ids: set[int], scores_queryset) -> None:
    """Check that every student has a score for every assessment."""
    scored = set(
        scores_queryset.values_list('student_id', 'assessment_id')
    )
    missing = set()
    for sid in student_ids:
        for aid in assessment_ids:
            if (sid, aid) not in scored:
                missing.add((sid, aid))
    if missing:
        count = len(missing)
        raise ValueError(f'{count} student-assessment score(s) missing')


def validate_student_belongs_to_class(student, school_class_id: int) -> None:
    """Verify that a student is enrolled in the given class."""
    from curriculum.models import Enrollment
    if not Enrollment.objects.filter(
        student=student,
        school_class_id=school_class_id,
    ).exists():
        raise ValueError(
            f'Student {student.get_full_name()} is not enrolled in class {school_class_id}'
        )


def validate_teacher_assigned_to_subject(teacher, subject_id: int, school_class_id: int) -> None:
    """Verify that a teacher is assigned to the given subject+class via Enrollment."""
    from curriculum.models import Enrollment
    if not Enrollment.objects.filter(
        ustaadh=teacher,
        subject_id=subject_id,
        school_class_id=school_class_id,
    ).exists():
        raise ValueError(
            f'Teacher {teacher.get_full_name()} is not assigned to '
            f'subject {subject_id} in class {school_class_id}'
        )


def validate_results_complete_before_publish(term_id: int, school_class_id: int) -> None:
    """Verify all SubjectResults are approved before bulk publishing."""
    from .models import SubjectResult
    incomplete = SubjectResult.objects.filter(
        term_id=term_id,
        school_class_id=school_class_id,
    ).exclude(status='approved').values_list('status').distinct()
    statuses = [s[0] for s in incomplete]
    if statuses:
        raise ValueError(
            f'Cannot publish: {", ".join(statuses)} statuses still exist. '
            'All results must be "approved" before publishing.'
        )
