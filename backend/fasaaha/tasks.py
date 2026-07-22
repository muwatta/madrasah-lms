"""
Fasaaha Celery tasks.

All long-running AI processing is handled asynchronously.
"""
from __future__ import annotations

import logging
import time

from celery import shared_task
from django.utils.timezone import now

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def process_speaking_attempt(self, attempt_id: int):
    """
    Main processing pipeline for a speaking attempt.

    This task:
    1. Loads the attempt and audio file
    2. Runs the AI pipeline (STT, pronunciation, grammar, fluency)
    3. Stores results in AIAnalysis
    4. Updates attempt status to 'completed' or 'failed'
    5. Triggers badge/streak updates

    Retries up to 3 times on failure with exponential backoff.
    """
    from .models import SpeakingAttempt
    from .services import AttemptService
    from .ai.pipeline import AIProcessingPipeline

    try:
        attempt = SpeakingAttempt.objects.select_related(
            'student', 'mission', 'mission__level', 'madrasah',
        ).get(pk=attempt_id)
    except SpeakingAttempt.DoesNotExist:
        logger.error("Attempt %d not found", attempt_id)
        return {'status': 'error', 'message': 'Attempt not found'}

    logger.info(
        "Processing attempt %d: student=%s, mission=%s",
        attempt_id, attempt.student.pk, attempt.mission.pk,
    )

    start_time = time.time()

    try:
        # Build pipeline with all available providers
        pipeline = AIProcessingPipeline.build_default()

        # Run pipeline
        audio_path = attempt.audio_file.path
        expected_text = ' '.join(attempt.mission.expected_phrases or [])

        result = pipeline.run(
            audio_path=audio_path,
            expected_text=expected_text,
            language='ar',
        )

        # Mark as completed
        AttemptService.mark_completed(
            attempt=attempt,
            analysis_data=result,
        )

        elapsed = time.time() - start_time
        logger.info(
            "Attempt %d processed in %.1fs: overall=%.1f",
            attempt_id, elapsed, result.get('overall_score', 0) or 0,
        )

        # Trigger badge check
        check_and_award_badges.delay(
            student_id=attempt.student.pk,
            madrasah_id=attempt.madrasah.pk,
        )

        return {
            'status': 'completed',
            'attempt_id': attempt_id,
            'overall_score': result.get('overall_score'),
            'processing_time_ms': int(elapsed * 1000),
        }

    except Exception as e:
        logger.error("Attempt %d processing failed: %s", attempt_id, e)

        # Mark as failed
        try:
            AttemptService.mark_failed(attempt=attempt, error_message=str(e))
        except Exception:
            logger.error("Failed to mark attempt %d as failed", attempt_id)

        # Retry
        try:
            raise self.retry(exc=e)
        except self.MaxRetriesExceededError:
            logger.error("Max retries exceeded for attempt %d", attempt_id)

        return {'status': 'error', 'message': str(e)}


@shared_task
def check_and_award_badges(student_id: int, madrasah_id: int):
    """Evaluate badge criteria and award earned badges."""
    from users.models import User, Madrasah
    from .services import BadgeService

    try:
        student = User.objects.get(pk=student_id)
        madrasah = Madrasah.objects.get(pk=madrasah_id)

        BadgeService.check_and_award_badges(student=student, madrasah=madrasah)

        return {'status': 'completed', 'student_id': student_id}

    except Exception as e:
        logger.error("Badge check failed for student %d: %s", student_id, e)
        return {'status': 'error', 'message': str(e)}


@shared_task
def batch_process_attempts(attempt_ids: list):
    """Process multiple attempts in batch."""
    results = []
    for attempt_id in attempt_ids:
        result = process_speaking_attempt(attempt_id)
        results.append(result)
    return results
