from __future__ import annotations

from django.db.models import (
    Avg,
    Count,
    Max,
    Min,
    Q,
)
from django.db.models.query import QuerySet

from curriculum.models import Enrollment
from results.models import (
    AnnualResult,
    ReportCard,
    ResultPublication,
    StudentRank,
    SubjectResult,
    TermResult,
)


# ──────────────────────────────────────────────────────
#  Student-level selectors
# ──────────────────────────────────────────────────────


def get_student_subject_results(student_id: int, term_id: int) -> QuerySet:
    """All SubjectResults for a student in a term, with related data."""
    return (
        SubjectResult.objects
        .filter(student_id=student_id, term_id=term_id)
        .select_related('subject', 'term', 'school_class', 'submitted_by')
        .order_by('subject__name_ar')
    )


def get_student_term_result(student_id: int, term_id: int) -> TermResult | None:
    """The aggregated TermResult for a student+term."""
    return (
        TermResult.objects
        .filter(student_id=student_id, term_id=term_id)
        .select_related('student', 'term', 'school_class')
        .first()
    )


def get_student_annual_result(student_id: int, session_id: int) -> AnnualResult | None:
    """The AnnualResult for a student+session."""
    return (
        AnnualResult.objects
        .filter(student_id=student_id, session_id=session_id)
        .select_related('student', 'session', 'school_class')
        .first()
    )


# ──────────────────────────────────────────────────────
#  Subject / class result selectors
# ──────────────────────────────────────────────────────


def get_subject_results_for_term(
    term_id: int,
    subject_id: int,
    school_class_id: int,
) -> QuerySet:
    """All SubjectResults for a subject+term+class, ordered by score desc."""
    return (
        SubjectResult.objects
        .filter(
            term_id=term_id,
            subject_id=subject_id,
            school_class_id=school_class_id,
        )
        .select_related('student', 'subject', 'school_class')
        .order_by('-total_score')
    )


def get_class_results_for_term(term_id: int, school_class_id: int) -> QuerySet:
    """All TermResults for a class+term, with subject results prefetched."""
    return (
        TermResult.objects
        .filter(term_id=term_id, school_class_id=school_class_id)
        .select_related('student', 'term', 'school_class')
        .prefetch_related(
            'student__subject_results__subject',
        )
        .order_by('position', '-average_score')
    )


# ──────────────────────────────────────────────────────
#  Approval workflow selectors
# ──────────────────────────────────────────────────────


def get_pending_approvals(
    term_id: int,
    school_class_id: int,
    subject_id: int | None = None,
) -> QuerySet:
    """SubjectResults in 'submitted' or 'under_review' status."""
    qs = (
        SubjectResult.objects
        .filter(
            term_id=term_id,
            school_class_id=school_class_id,
            status__in=['submitted', 'under_review'],
        )
        .select_related('student', 'subject', 'school_class', 'submitted_by')
        .order_by('subject__name_ar', 'student__last_name')
    )
    if subject_id is not None:
        qs = qs.filter(subject_id=subject_id)
    return qs


# ──────────────────────────────────────────────────────
#  Teacher assignment selectors
# ──────────────────────────────────────────────────────


def get_teacher_subjects(user_id: int) -> list[dict]:
    """Distinct subjects the teacher is assigned to (via Enrollment.ustaadh)."""
    enrollments = (
        Enrollment.objects
        .filter(ustaadh_id=user_id)
        .select_related('subject', 'school_class')
        .values(
            'subject_id',
            'subject__name_ar',
            'subject__name_en',
            'subject__code',
            'school_class_id',
            'school_class__name_ar',
            'school_class__name_en',
        )
        .distinct()
    )
    return list(enrollments)


def get_teacher_classes(user_id: int) -> list[dict]:
    """Distinct classes the teacher is assigned to (via Enrollment.ustaadh)."""
    enrollments = (
        Enrollment.objects
        .filter(ustaadh_id=user_id)
        .select_related('school_class')
        .values(
            'school_class_id',
            'school_class__name_ar',
            'school_class__name_en',
        )
        .distinct()
    )
    return list(enrollments)


# ──────────────────────────────────────────────────────
#  Publication status
# ──────────────────────────────────────────────────────


def get_publication_status(term_id: int, school_class_id: int) -> dict:
    """Check what's been published for a term+class."""
    publications = (
        ResultPublication.objects
        .filter(term_id=term_id, school_class_id=school_class_id)
        .order_by('-published_at')
    )

    published = publications.filter(status='published').first()
    unpublished = publications.filter(status='unpublished').first()

    subject_results = SubjectResult.objects.filter(
        term_id=term_id, school_class_id=school_class_id
    )
    term_results = TermResult.objects.filter(
        term_id=term_id, school_class_id=school_class_id
    )

    total_subject_results = subject_results.count()
    published_subject_results = subject_results.filter(status='published').count()
    approved_subject_results = subject_results.filter(status='approved').count()

    total_term_results = term_results.count()
    published_term_results = term_results.filter(status='published').count()

    return {
        'is_published': published is not None,
        'published_at': published.published_at if published else None,
        'published_by_id': published.published_by_id if published else None,
        'unpublished_at': unpublished.published_at if unpublished else None,
        'total_subject_results': total_subject_results,
        'published_subject_results': published_subject_results,
        'approved_subject_results': approved_subject_results,
        'total_term_results': total_term_results,
        'published_term_results': published_term_results,
    }


# ──────────────────────────────────────────────────────
#  Analytics selectors
# ──────────────────────────────────────────────────────


def get_analytics_class_average(term_id: int, school_class_id: int) -> dict:
    """Class average, highest, lowest, pass rate, grade distribution."""
    term_results = TermResult.objects.filter(
        term_id=term_id, school_class_id=school_class_id
    )

    aggregates = term_results.aggregate(
        avg_score=Avg('average_score'),
        highest_score=Max('average_score'),
        lowest_score=Min('average_score'),
        total_students=Count('id'),
        passed=Count('id', filter=Q(average_score__gte=40)),
    )

    total_students = aggregates['total_students'] or 0
    passed = aggregates['passed'] or 0

    grade_distribution = (
        term_results
        .values('grade')
        .annotate(count=Count('id'))
        .order_by('grade')
    )

    return {
        'average_score': aggregates['avg_score'] or 0,
        'highest_score': aggregates['highest_score'] or 0,
        'lowest_score': aggregates['lowest_score'] or 0,
        'total_students': total_students,
        'pass_rate': (passed / total_students * 100) if total_students else 0,
        'grade_distribution': {
            item['grade']: item['count'] for item in grade_distribution if item['grade']
        },
    }


def get_analytics_subject_average(
    term_id: int,
    subject_id: int,
    school_class_id: int,
) -> dict:
    """Subject-specific analytics for a class."""
    subject_results = SubjectResult.objects.filter(
        term_id=term_id,
        subject_id=subject_id,
        school_class_id=school_class_id,
    )

    aggregates = subject_results.aggregate(
        avg_score=Avg('total_score'),
        highest_score=Max('total_score'),
        lowest_score=Min('total_score'),
        total_students=Count('id'),
        passed=Count('id', filter=Q(total_score__gte=40)),
    )

    total_students = aggregates['total_students'] or 0
    passed = aggregates['passed'] or 0

    grade_distribution = (
        subject_results
        .values('grade')
        .annotate(count=Count('id'))
        .order_by('grade')
    )

    return {
        'subject_id': subject_id,
        'term_id': term_id,
        'school_class_id': school_class_id,
        'average_score': aggregates['avg_score'] or 0,
        'highest_score': aggregates['highest_score'] or 0,
        'lowest_score': aggregates['lowest_score'] or 0,
        'total_students': total_students,
        'pass_rate': (passed / total_students * 100) if total_students else 0,
        'grade_distribution': {
            item['grade']: item['count'] for item in grade_distribution if item['grade']
        },
    }


def get_analytics_teacher_performance(teacher_id: int, term_id: int) -> dict:
    """Performance summary for a teacher's subjects.

    Computes averages across all subjects the teacher is assigned to
    via Enrollment.ustaadh for the given term.
    """
    teacher_class_ids = (
        Enrollment.objects
        .filter(ustaadh_id=teacher_id)
        .values_list('school_class_id', flat=True)
        .distinct()
    )

    teacher_subject_ids = (
        Enrollment.objects
        .filter(ustaadh_id=teacher_id)
        .values_list('subject_id', flat=True)
        .distinct()
    )

    subject_results = SubjectResult.objects.filter(
        term_id=term_id,
        subject_id__in=teacher_subject_ids,
        school_class_id__in=teacher_class_ids,
    )

    aggregates = subject_results.aggregate(
        avg_score=Avg('total_score'),
        highest_score=Max('total_score'),
        lowest_score=Min('total_score'),
        total_results=Count('id'),
        passed=Count('id', filter=Q(total_score__gte=40)),
    )

    total_results = aggregates['total_results'] or 0
    passed = aggregates['passed'] or 0

    subject_breakdown = (
        subject_results
        .values('subject_id', 'subject__name_ar')
        .annotate(
            avg_score=Avg('total_score'),
            student_count=Count('id'),
            passed_count=Count('id', filter=Q(total_score__gte=40)),
        )
        .order_by('subject__name_ar')
    )

    return {
        'teacher_id': teacher_id,
        'term_id': term_id,
        'average_score': aggregates['avg_score'] or 0,
        'highest_score': aggregates['highest_score'] or 0,
        'lowest_score': aggregates['lowest_score'] or 0,
        'total_results': total_results,
        'pass_rate': (passed / total_results * 100) if total_results else 0,
        'subject_breakdown': list(subject_breakdown),
    }


# ──────────────────────────────────────────────────────
#  Ranking & performance selectors
# ──────────────────────────────────────────────────────


def get_top_students(
    term_id: int,
    school_class_id: int,
    limit: int = 10,
) -> QuerySet:
    """Top students by average_score."""
    return (
        TermResult.objects
        .filter(term_id=term_id, school_class_id=school_class_id)
        .select_related('student', 'school_class')
        .order_by('-average_score')[:limit]
    )


def get_at_risk_students(
    term_id: int,
    school_class_id: int,
    threshold: float = 40,
) -> QuerySet:
    """Students scoring below threshold average."""
    return (
        TermResult.objects
        .filter(
            term_id=term_id,
            school_class_id=school_class_id,
            average_score__lt=threshold,
        )
        .select_related('student', 'school_class')
        .order_by('average_score')
    )


def get_student_rank(student_id: int, term_id: int) -> StudentRank | None:
    """The overall rank for a student in a term."""
    return (
        StudentRank.objects
        .filter(
            student_id=student_id,
            term_id=term_id,
            rank_type='overall',
            subject__isnull=True,
        )
        .select_related('student', 'term', 'school_class')
        .first()
    )


# ──────────────────────────────────────────────────────
#  Report card selector
# ──────────────────────────────────────────────────────


def get_report_card(student_id: int, term_id: int) -> ReportCard | None:
    """Retrieve a generated report card."""
    return (
        ReportCard.objects
        .filter(student_id=student_id, term_id=term_id)
        .select_related(
            'student',
            'term',
            'session',
            'school_class',
            'term_result',
            'generated_by',
        )
        .first()
    )
