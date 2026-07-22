"""
Fasaaha selectors — thin query layer.

All database queries for the Fasaaha module are centralized here.
Views and services should call selectors instead of querying directly.
"""
from __future__ import annotations

from datetime import date

from django.db.models import Count, Avg, Q, Max, F

from .models import (
    SpeakingLevel, MissionCategory, Mission, SpeakingAttempt,
    AIAnalysis, TeacherReview, MissionAssignment,
    StudentLevelProgress, StudentStreak, Badge, StudentBadge,
)


#  Levels


def get_levels(*, madrasah, active_only=True):
    qs = SpeakingLevel.objects.filter(madrasah=madrasah)
    if active_only:
        qs = qs.filter(is_active=True)
    return qs.order_by('sort_order', 'number')


def get_level_by_id(*, level_id, madrasah):
    return SpeakingLevel.objects.get(pk=level_id, madrasah=madrasah)


#  Categories


def get_categories(*, madrasah, active_only=True):
    qs = MissionCategory.objects.filter(madrasah=madrasah)
    if active_only:
        qs = qs.filter(is_active=True)
    return qs.order_by('sort_order', 'name')


def get_category_by_id(*, category_id, madrasah):
    return MissionCategory.objects.get(pk=category_id, madrasah=madrasah)


#  Missions


def get_missions(*, madrasah, level=None, category=None, difficulty=None, active_only=True):
    qs = Mission.objects.filter(madrasah=madrasah).select_related('level', 'category')
    if active_only:
        qs = qs.filter(is_active=True)
    if level:
        qs = qs.filter(level=level)
    if category:
        qs = qs.filter(category=category)
    if difficulty:
        qs = qs.filter(difficulty=difficulty)
    return qs.order_by('level__number', 'sort_order')


def get_mission_by_id(*, mission_id, madrasah):
    return Mission.objects.select_related('level', 'category', 'created_by').get(
        pk=mission_id, madrasah=madrasah)


def get_missions_for_level(*, level_id, madrasah):
    return Mission.objects.filter(
        level_id=level_id, madrasah=madrasah, is_active=True
    ).select_related('category').order_by('sort_order')


#  Attempts


def get_attempts_for_student(*, student, mission=None, madrasah=None):
    qs = SpeakingAttempt.objects.filter(student=student)
    if madrasah:
        qs = qs.filter(madrasah=madrasah)
    if mission:
        qs = qs.filter(mission=mission)
    return qs.select_related('mission', 'mission__level', 'mission__category').order_by('-created_at')


def get_attempt_by_id(*, attempt_id, madrasah):
    return SpeakingAttempt.objects.select_related(
        'student', 'mission', 'mission__level', 'mission__category', 'madrasah',
    ).prefetch_related('ai_analysis', 'teacher_reviews').get(
        pk=attempt_id, madrasah=madrasah)


def get_pending_review_attempts(*, madrasah, teacher=None):
    """Get attempts that need teacher review."""
    qs = SpeakingAttempt.objects.filter(
        madrasah=madrasah,
        status='completed',
    ).exclude(
        teacher_reviews__isnull=False,
    ).select_related('student', 'mission', 'mission__level')

    if teacher:
        # Filter to attempts in classes taught by this teacher
        from curriculum.models import Enrollment
        teacher_class_ids = Enrollment.objects.filter(
            ustaadh=teacher, madrasah=madrasah, is_active=True
        ).values_list('school_class_id', flat=True)
        qs = qs.filter(
            Q(mission__assignments__target_class_id__in=teacher_class_ids) |
            Q(mission__assignments__target_student__isnull=False)
        ).distinct()

    return qs.order_by('-created_at')


def get_attempt_count_for_mission(*, mission_id, student):
    return SpeakingAttempt.objects.filter(
        mission_id=mission_id, student=student,
    ).count()


def get_best_attempt(*, mission_id, student):
    """Get the student's best attempt for a mission."""
    return SpeakingAttempt.objects.filter(
        mission_id=mission_id, student=student, is_best_attempt=True,
    ).select_related('mission').prefetch_related('ai_analysis').first()


#  AI Analysis


def get_analysis_for_attempt(*, attempt_id):
    try:
        return AIAnalysis.objects.get(attempt_id=attempt_id)
    except AIAnalysis.DoesNotExist:
        return None


#  Teacher Reviews


def get_reviews_for_attempt(*, attempt_id):
    return TeacherReview.objects.filter(
        attempt_id=attempt_id
    ).select_related('teacher').order_by('-created_at')


#  Assignments


def get_assignments(*, madrasah, teacher=None, student=None, mission=None):
    qs = MissionAssignment.objects.filter(madrasah=madrasah).select_related(
        'mission', 'mission__level', 'assigned_by', 'target_student', 'target_class')
    if teacher:
        qs = qs.filter(assigned_by=teacher)
    if student:
        qs = qs.filter(
            Q(target_student=student) | Q(target_class__enrollments__student=student)
        ).distinct()
    if mission:
        qs = qs.filter(mission=mission)
    return qs.order_by('-created_at')


def get_assignment_by_id(*, assignment_id, madrasah):
    return MissionAssignment.objects.select_related(
        'mission', 'mission__level', 'assigned_by', 'target_student', 'target_class',
    ).get(pk=assignment_id, madrasah=madrasah)


#  Progress


def get_student_progress(*, student, madrasah=None):
    qs = StudentLevelProgress.objects.filter(student=student).select_related('level')
    if madrasah:
        qs = qs.filter(madrasah=madrasah)
    return qs.order_by('level__number')


def get_progress_for_level(*, student, level_id):
    try:
        return StudentLevelProgress.objects.get(student=student, level_id=level_id)
    except StudentLevelProgress.DoesNotExist:
        return None


#  Streaks


def get_student_streak(*, student, madrasah):
    try:
        return StudentStreak.objects.get(student=student, madrasah=madrasah)
    except StudentStreak.DoesNotExist:
        return None


#  Badges


def get_badges(*, madrasah, active_only=True):
    qs = Badge.objects.filter(madrasah=madrasah)
    if active_only:
        qs = qs.filter(is_active=True)
    return qs.order_by('category', 'name')


def get_student_badges(*, student, madrasah=None):
    qs = StudentBadge.objects.filter(student=student).select_related('badge')
    if madrasah:
        qs = qs.filter(madrasah=madrasah)
    return qs.order_by('-awarded_at')


def has_badge(*, student, badge):
    return StudentBadge.objects.filter(student=student, badge=badge).exists()


#  Analytics


def get_class_analytics(*, madrasah, school_class_id, level_id=None):
    """Get class-wide analytics for a given class."""
    attempts = SpeakingAttempt.objects.filter(
        madrasah=madrasah,
        student__school_class_enrollments__school_class_id=school_class_id,
        status__in=('completed', 'reviewed'),
    ).select_related('ai_analysis')

    if level_id:
        attempts = attempts.filter(mission__level_id=level_id)

    stats = attempts.aggregate(
        total_attempts=Count('id'),
        avg_overall=Avg('ai_analysis__overall_score'),
        avg_pronunciation=Avg('ai_analysis__pronunciation_score'),
        avg_grammar=Avg('ai_analysis__grammar_score'),
        avg_fluency=Avg('ai_analysis__fluency_score'),
        avg_vocabulary=Avg('ai_analysis__vocabulary_score'),
        best_score=Max('ai_analysis__overall_score'),
    )

    return {
        'total_attempts': stats['total_attempts'] or 0,
        'average_overall': round(float(stats['avg_overall'] or 0), 2),
        'average_pronunciation': round(float(stats['avg_pronunciation'] or 0), 2),
        'average_grammar': round(float(stats['avg_grammar'] or 0), 2),
        'average_fluency': round(float(stats['avg_fluency'] or 0), 2),
        'average_vocabulary': round(float(stats['avg_vocabulary'] or 0), 2),
        'best_score': float(stats['best_score'] or 0),
    }


def get_student_analytics(*, student, madrasah, level_id=None):
    """Get analytics for a specific student."""
    attempts = SpeakingAttempt.objects.filter(
        student=student, madrasah=madrasah,
        status__in=('completed', 'reviewed'),
    )

    if level_id:
        attempts = attempts.filter(mission__level_id=level_id)

    stats = attempts.aggregate(
        total_attempts=Count('id'),
        avg_overall=Avg('ai_analysis__overall_score'),
        avg_pronunciation=Avg('ai_analysis__pronunciation_score'),
        avg_grammar=Avg('ai_analysis__grammar_score'),
        avg_fluency=Avg('ai_analysis__fluency_score'),
        avg_vocabulary=Avg('ai_analysis__vocabulary_score'),
        best_score=Max('ai_analysis__overall_score'),
    )

    return {
        'total_attempts': stats['total_attempts'] or 0,
        'average_overall': round(float(stats['avg_overall'] or 0), 2),
        'average_pronunciation': round(float(stats['avg_pronunciation'] or 0), 2),
        'average_grammar': round(float(stats['avg_grammar'] or 0), 2),
        'average_fluency': round(float(stats['avg_fluency'] or 0), 2),
        'average_vocabulary': round(float(stats['avg_vocabulary'] or 0), 2),
        'best_score': float(stats['best_score'] or 0),
    }


def get_school_analytics(*, madrasah, level_id=None):
    """Get school-wide analytics."""
    attempts = SpeakingAttempt.objects.filter(
        madrasah=madrasah,
        status__in=('completed', 'reviewed'),
    )

    if level_id:
        attempts = attempts.filter(mission__level_id=level_id)

    stats = attempts.aggregate(
        total_attempts=Count('id'),
        total_students=Count('student', distinct=True),
        avg_overall=Avg('ai_analysis__overall_score'),
        avg_pronunciation=Avg('ai_analysis__pronunciation_score'),
        avg_grammar=Avg('ai_analysis__grammar_score'),
        avg_fluency=Avg('ai_analysis__fluency_score'),
        avg_vocabulary=Avg('ai_analysis__vocabulary_score'),
        best_score=Max('ai_analysis__overall_score'),
    )

    return {
        'total_attempts': stats['total_attempts'] or 0,
        'total_students': stats['total_students'] or 0,
        'average_overall': round(float(stats['avg_overall'] or 0), 2),
        'average_pronunciation': round(float(stats['avg_pronunciation'] or 0), 2),
        'average_grammar': round(float(stats['avg_grammar'] or 0), 2),
        'average_fluency': round(float(stats['avg_fluency'] or 0), 2),
        'average_vocabulary': round(float(stats['avg_vocabulary'] or 0), 2),
        'best_score': float(stats['best_score'] or 0),
    }


#  Dashboard


def get_student_dashboard_data(*, student, madrasah):
    """Get dashboard summary data for a student."""
    progress = get_student_progress(student=student, madrasah=madrasah)
    streak = get_student_streak(student=student, madrasah=madrasah)
    badges = get_student_badges(student=student, madrasah=madrasah)

    total_attempts = SpeakingAttempt.objects.filter(
        student=student, madrasah=madrasah, status__in=('completed', 'reviewed'),
    ).count()

    completed_missions = SpeakingAttempt.objects.filter(
        student=student, madrasah=madrasah, is_best_attempt=True,
        ai_analysis__overall_score__gte=70,
    ).count()

    current_level = progress.filter(status__in=('in_progress', 'mastered')).order_by('-level__number').first()

    return {
        'current_level': current_level.level if current_level else None,
        'total_attempts': total_attempts,
        'completed_missions': completed_missions,
        'current_streak': streak.current_streak if streak else 0,
        'longest_streak': streak.longest_streak if streak else 0,
        'total_points': streak.total_points if streak else 0,
        'badge_count': badges.count(),
        'progress': progress,
    }


def get_teacher_dashboard_data(*, teacher, madrasah):
    """Get dashboard summary data for a teacher."""
    from curriculum.models import Enrollment

    # Get classes taught by this teacher
    class_ids = Enrollment.objects.filter(
        ustaadh=teacher, madrasah=madrasah, is_active=True
    ).values_list('school_class_id', flat=True).distinct()

    pending_reviews = get_pending_review_attempts(madrasah=madrasah, teacher=teacher)

    total_students = Enrollment.objects.filter(
        school_class_id__in=class_ids, madrasah=madrasah, is_active=True,
    ).values('student_id').distinct().count()

    # Class-wide stats
    attempts = SpeakingAttempt.objects.filter(
        madrasah=madrasah,
        student__school_class_enrollments__school_class_id__in=class_ids,
        status__in=('completed', 'reviewed'),
    )

    stats = attempts.aggregate(
        total_attempts=Count('id'),
        avg_score=Avg('ai_analysis__overall_score'),
    )

    return {
        'classes_taught': list(class_ids),
        'total_students': total_students,
        'pending_reviews_count': pending_reviews.count(),
        'total_attempts': stats['total_attempts'] or 0,
        'average_class_score': round(float(stats['avg_score'] or 0), 2),
        'pending_reviews': pending_reviews[:10],
    }
