"""
Fasaaha business logic services.

All business logic for speaking missions, attempts, reviews, progress,
streaks, and badges lives here. Views and tasks should call services,
not manipulate models directly.
"""
from __future__ import annotations

import logging
from datetime import date, timedelta
from decimal import Decimal

from django.db import transaction
from django.db.models import Count, Avg, F
from django.utils.timezone import now

from .models import (
    SpeakingLevel, MissionCategory, Mission, SpeakingAttempt,
    AIAnalysis, TeacherReview, MissionAssignment,
    StudentLevelProgress, StudentStreak, Badge, StudentBadge,
)
from .ai.scoring import compute_composite_score, is_passing

logger = logging.getLogger(__name__)


#  Mission Service


class MissionService:
    """CRUD operations for speaking missions."""

    @staticmethod
    @transaction.atomic
    def create_mission(
        *,
        madrasah,
        level,
        title,
        title_ar,
        prompt_ar,
        prompt_translation,
        category=None,
        prompt_transliteration='',
        expected_phrases=None,
        hints=None,
        difficulty=2,
        max_time_seconds=60,
        example_audio=None,
        created_by=None,
    ):
        """Create a new speaking mission."""
        mission = Mission.objects.create(
            madrasah=madrasah,
            level=level,
            category=category,
            title=title,
            title_ar=title_ar,
            prompt_ar=prompt_ar,
            prompt_transliteration=prompt_transliteration,
            prompt_translation=prompt_translation,
            expected_phrases=expected_phrases or [],
            hints=hints or [],
            difficulty=difficulty,
            max_time_seconds=max_time_seconds,
            example_audio=example_audio,
            created_by=created_by,
        )
        return mission

    @staticmethod
    @transaction.atomic
    def update_mission(*, mission, **kwargs):
        """Update a speaking mission."""
        for field, val in kwargs.items():
            if hasattr(mission, field):
                setattr(mission, field, val)
        mission.save()
        return mission

    @staticmethod
    @transaction.atomic
    def deactivate_mission(*, mission):
        """Soft-delete a mission."""
        mission.is_active = False
        mission.save()
        return mission


#  Attempt Service


class AttemptService:
    """Business logic for student speaking attempts."""

    @staticmethod
    @transaction.atomic
    def submit_attempt(
        *,
        student,
        mission,
        audio_file,
        madrasah,
        notes='',
    ):
        
        # Determine attempt number
        last_attempt = SpeakingAttempt.objects.filter(
            student=student, mission=mission,
        ).order_by('-attempt_number').first()

        attempt_number = (last_attempt.attempt_number + 1) if last_attempt else 1

        attempt = SpeakingAttempt.objects.create(
            student=student,
            mission=mission,
            audio_file=audio_file,
            audio_size_bytes=audio_file.size if hasattr(audio_file, 'size') else None,
            notes=notes,
            status='processing',
            attempt_number=attempt_number,
            madrasah=madrasah,
        )

        logger.info(
            "Attempt created: student=%s, mission=%s, attempt#=%d",
            student.pk, mission.pk, attempt_number,
        )

        return attempt

    @staticmethod
    @transaction.atomic
    def mark_completed(*, attempt, analysis_data):
        """Mark an attempt as completed with AI analysis results."""
        attempt.status = 'completed'
        attempt.completed_at = now()
        attempt.save()

        # Create or update AI analysis
        analysis, created = AIAnalysis.objects.update_or_create(
            attempt=attempt,
            defaults={
                'madrasah': attempt.madrasah,
                'transcribed_text': analysis_data.get('transcribed_text', ''),
                'transcription_provider': analysis_data.get('transcription_provider', ''),
                'transcription_confidence': analysis_data.get('transcription_confidence'),
                'transcription_raw': analysis_data.get('transcription_raw', {}),
                'pronunciation_score': analysis_data.get('pronunciation_score'),
                'grammar_score': analysis_data.get('grammar_score'),
                'fluency_score': analysis_data.get('fluency_score'),
                'vocabulary_score': analysis_data.get('vocabulary_score'),
                'overall_score': analysis_data.get('overall_score'),
                'pronunciation_feedback': analysis_data.get('pronunciation_feedback', {}),
                'grammar_feedback': analysis_data.get('grammar_feedback', {}),
                'fluency_feedback': analysis_data.get('fluency_feedback', {}),
                'word_scores': analysis_data.get('word_scores', []),
                'confidence_score': analysis_data.get('confidence_score'),
                'topic_relevance_score': analysis_data.get('topic_relevance_score'),
                'fluency_words_per_minute': analysis_data.get('fluency_words_per_minute'),
                'fluency_pause_ratio': analysis_data.get('fluency_pause_ratio'),
                'scoring_provider': analysis_data.get('scoring_provider', 'pipeline'),
                'processing_time_ms': analysis_data.get('processing_time_ms'),
                'raw_response': analysis_data.get('raw_response', {}),
            },
        )

        # Check if this is the best attempt
        AttemptService._update_best_attempt(attempt)

        # Update student progress
        ProgressService.update_progress_for_attempt(attempt)

        # Update streak
        StreakService.update_streak(student=attempt.student, madrasah=attempt.madrasah)

        return attempt

    @staticmethod
    @transaction.atomic
    def mark_failed(*, attempt, error_message=''):
        """Mark an attempt as failed."""
        attempt.status = 'failed'
        attempt.completed_at = now()
        attempt.save()

        AIAnalysis.objects.update_or_create(
            attempt=attempt,
            defaults={
                'madrasah': attempt.madrasah,
                'raw_response': {'error': error_message},
            },
        )

        return attempt

    @staticmethod
    def _update_best_attempt(attempt):
        """Update is_best_attempt flag for the student+mission pair."""
        best = SpeakingAttempt.objects.filter(
            student=attempt.student,
            mission=attempt.mission,
            status='completed',
        ).order_by('-ai_analysis__overall_score').first()

        if best:
            SpeakingAttempt.objects.filter(
                student=attempt.student,
                mission=attempt.mission,
            ).update(is_best_attempt=False)

            best.is_best_attempt = True
            best.save(update_fields=['is_best_attempt'])


#  Review Service


class ReviewService:
    """Teacher review operations."""

    @staticmethod
    @transaction.atomic
    def create_review(
        *,
        attempt,
        teacher,
        madrasah,
        overall_score=None,
        feedback='',
        pronunciation_notes='',
        grammar_notes='',
        is_approved=None,
    ):
        """Create a teacher review for a speaking attempt."""
        review = TeacherReview.objects.create(
            attempt=attempt,
            teacher=teacher,
            madrasah=madrasah,
            overall_score=overall_score,
            feedback=feedback,
            pronunciation_notes=pronunciation_notes,
            grammar_notes=grammar_notes,
            is_approved=is_approved,
        )

        # Mark attempt as reviewed
        if attempt.status == 'completed':
            attempt.status = 'reviewed'
            attempt.save(update_fields=['status'])

        return review

    @staticmethod
    @transaction.atomic
    def update_review(*, review, **kwargs):
        """Update a teacher review."""
        for field, val in kwargs.items():
            if hasattr(review, field):
                setattr(review, field, val)
        review.save()
        return review


#  Assignment Service


class AssignmentService:
    """Mission assignment operations."""

    @staticmethod
    @transaction.atomic
    def assign_mission(
        *,
        mission,
        assigned_by,
        madrasah,
        target_student=None,
        target_class=None,
        due_date=None,
        is_required=False,
        notes='',
    ):
        """Assign a mission to a student or class."""
        if not target_student and not target_class:
            raise ValueError("Either target_student or target_class must be provided.")

        assignment = MissionAssignment.objects.create(
            mission=mission,
            assigned_by=assigned_by,
            madrasah=madrasah,
            target_student=target_student,
            target_class=target_class,
            due_date=due_date,
            is_required=is_required,
            notes=notes,
        )

        return assignment

    @staticmethod
    @transaction.atomic
    def remove_assignment(*, assignment):
        """Remove a mission assignment."""
        assignment.delete()


#  Progress Service


class ProgressService:
    """Student level progress tracking."""

    @staticmethod
    @transaction.atomic
    def update_progress_for_attempt(attempt):
        """Update student's level progress after an attempt completes."""
        level = attempt.mission.level
        student = attempt.student
        madrasah = attempt.madrasah

        # Get or create progress record
        progress, created = StudentLevelProgress.objects.get_or_create(
            student=student,
            level=level,
            defaults={
                'madrasah': madrasah,
                'status': 'in_progress',
                'started_at': now(),
            },
        )

        # Update stats
        from .selectors import get_attempts_for_student
        attempts = get_attempts_for_student(student=student, level=level, madrasah=madrasah)

        total_attempts = attempts.count()
        completed_attempts = attempts.filter(status__in=('completed', 'reviewed'))

        # Calculate average score from completed attempts
        scores = []
        for a in completed_attempts:
            if a.ai_analysis and a.ai_analysis.overall_score:
                scores.append(float(a.ai_analysis.overall_score))

        avg_score = sum(scores) / len(scores) if scores else 0
        best_score = max(scores) if scores else 0

        # Count missions completed (score >= 70)
        missions_completed = len([s for s in scores if s >= 70])

        progress.missions_attempted = total_attempts
        progress.missions_completed = missions_completed
        progress.average_score = round(Decimal(str(avg_score)), 2)
        progress.best_score = round(Decimal(str(best_score)), 2)
        progress.total_time_seconds += (attempt.audio_duration_ms or 0) // 1000

        # Check if level is completed
        total_missions = level.total_missions
        if total_missions > 0 and missions_completed >= total_missions:
            if progress.status != 'mastered':
                progress.status = 'mastered'
                progress.completed_at = now()
        elif missions_completed > 0:
            progress.status = 'in_progress'

        progress.save()

        return progress

    @staticmethod
    @transaction.atomic
    def unlock_level(*, student, level, madrasah):
        """Unlock a new level for a student."""
        progress, created = StudentLevelProgress.objects.get_or_create(
            student=student,
            level=level,
            defaults={
                'madrasah': madrasah,
                'status': 'in_progress',
                'started_at': now(),
            },
        )
        return progress


#  Streak Service


class StreakService:
    """Practice streak tracking."""

    @staticmethod
    @transaction.atomic
    def update_streak(*, student, madrasah):
        """Update student's practice streak after an attempt."""
        streak, created = StudentStreak.objects.get_or_create(
            student=student,
            madrasah=madrasah,
            defaults={
                'current_streak': 0,
                'longest_streak': 0,
                'total_practice_days': 0,
                'total_points': 0,
            },
        )

        today = date.today()
        last_date = streak.last_practice_date

        if last_date == today:
            # Already practiced today, just add points
            streak.total_points += 1
            streak.save(update_fields=['total_points', 'updated_at'])
            return streak

        if last_date == today - timedelta(days=1):
            # Consecutive day — increment streak
            streak.current_streak += 1
        else:
            # Streak broken — reset to 1
            streak.current_streak = 1

        streak.last_practice_date = today
        streak.total_practice_days += 1
        streak.total_points += 10  # Base points per practice day

        # Update longest streak
        if streak.current_streak > streak.longest_streak:
            streak.longest_streak = streak.current_streak

        streak.save()

        # Check for streak badges
        BadgeService.check_streak_badges(student=student, madrasah=madrasah, streak=streak)

        return streak


#  Badge Service


class BadgeService:
    """Badge evaluation and awarding."""

    @staticmethod
    @transaction.atomic
    def check_and_award_badges(*, student, madrasah):
        """Evaluate all badge criteria and award any earned badges."""
        badges = Badge.objects.filter(madrasah=madrasah, is_active=True)

        for badge in badges:
            if StudentBadge.objects.filter(student=student, badge=badge).exists():
                continue  # Already has this badge

            criteria = badge.criteria
            badge_type = criteria.get('type', '')
            badge_value = criteria.get('value', 0)

            awarded = False

            if badge_type == 'first_attempt':
                count = SpeakingAttempt.objects.filter(
                    student=student, madrasah=madrasah,
                ).count()
                awarded = count >= 1

            elif badge_type == 'streak':
                streak = StudentStreak.objects.filter(
                    student=student, madrasah=madrasah,
                ).first()
                if streak:
                    awarded = streak.longest_streak >= badge_value

            elif badge_type == 'level_complete':
                count = StudentLevelProgress.objects.filter(
                    student=student, status='mastered',
                ).count()
                awarded = count >= badge_value

            elif badge_type == 'attempts':
                count = SpeakingAttempt.objects.filter(
                    student=student, madrasah=madrasah,
                ).count()
                awarded = count >= badge_value

            elif badge_type == 'score':
                best = SpeakingAttempt.objects.filter(
                    student=student, madrasah=madrasah,
                    ai_analysis__overall_score__gte=badge_value,
                ).exists()
                awarded = best

            if awarded:
                StudentBadge.objects.create(
                    student=student,
                    badge=badge,
                    madrasah=madrasah,
                )
                logger.info("Badge '%s' awarded to student %s", badge.name, student.pk)

    @staticmethod
    @transaction.atomic
    def check_streak_badges(*, student, madrasah, streak):
        """Check and award streak-related badges."""
        badges = Badge.objects.filter(
            madrasah=madrasah, is_active=True, category='streak',
        )

        for badge in badges:
            if StudentBadge.objects.filter(student=student, badge=badge).exists():
                continue

            criteria = badge.criteria
            required_streak = criteria.get('value', 7)

            if streak.longest_streak >= required_streak:
                StudentBadge.objects.create(
                    student=student,
                    badge=badge,
                    madrasah=madrasah,
                )
                logger.info(
                    "Streak badge '%s' awarded to student %s (streak: %d)",
                    badge.name, student.pk, streak.longest_streak,
                )
