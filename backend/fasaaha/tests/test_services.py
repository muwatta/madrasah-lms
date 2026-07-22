"""Tests for fasaaha services."""
import pytest
from fasaaha.services import MissionService, AttemptService, ReviewService
from fasaaha.models import SpeakingAttempt, AIAnalysis, TeacherReview
from fasaaha.selectors import get_attempts_for_student


@pytest.mark.django_db
class TestMissionService:
    def test_create_mission(self, madrasah, fasaaha_level, fasaaha_category, teacher):
        mission = MissionService.create_mission(
            madrasah=madrasah,
            level=fasaaha_level,
            category=fasaaha_category,
            title='Test Mission',
            title_ar='مهمة اختبار',
            prompt_ar='مرحبا',
            prompt_translation='Hello',
            difficulty=3,
            created_by=teacher,
        )
        assert mission.pk is not None
        assert mission.title == 'Test Mission'

    def test_update_mission(self, fasaaha_mission):
        MissionService.update_mission(mission=fasaaha_mission, title='Updated Title')
        fasaaha_mission.refresh_from_db()
        assert fasaaha_mission.title == 'Updated Title'

    def test_deactivate_mission(self, fasaaha_mission):
        MissionService.deactivate_mission(mission=fasaaha_mission)
        fasaaha_mission.refresh_from_db()
        assert fasaaha_mission.is_active is False


@pytest.mark.django_db
class TestAttemptService:
    def test_submit_attempt(self, student, fasaaha_mission, madrasah):
        from django.core.files.uploadedfile import SimpleUploadedFile
        audio = SimpleUploadedFile('test.webm', b'fake-audio', content_type='audio/webm')
        attempt = AttemptService.submit_attempt(
            student=student,
            mission=fasaaha_mission,
            audio_file=audio,
            madrasah=madrasah,
        )
        assert attempt.pk is not None
        assert attempt.status == 'processing'
        assert attempt.attempt_number == 1

    def test_submit_attempt_increments_number(self, fasaaha_attempt, student, fasaaha_mission, madrasah):
        from django.core.files.uploadedfile import SimpleUploadedFile
        audio = SimpleUploadedFile('test2.webm', b'fake-audio2', content_type='audio/webm')
        attempt = AttemptService.submit_attempt(
            student=student,
            mission=fasaaha_mission,
            audio_file=audio,
            madrasah=madrasah,
        )
        assert attempt.attempt_number == 2

    def test_mark_completed(self, fasaaha_attempt):
        analysis_data = {
            'transcribed_text': 'صباح الخير',
            'transcription_provider': 'whisper',
            'pronunciation_score': 80,
            'grammar_score': 85,
            'fluency_score': 75,
            'overall_score': 79.25,
        }
        AttemptService.mark_completed(attempt=fasaaha_attempt, analysis_data=analysis_data)
        fasaaha_attempt.refresh_from_db()
        assert fasaaha_attempt.status == 'completed'
        assert fasaaha_attempt.completed_at is not None
        assert hasattr(fasaaha_attempt, 'ai_analysis')


@pytest.mark.django_db
class TestReviewService:
    def test_create_review(self, fasaaha_attempt, teacher, madrasah):
        review = ReviewService.create_review(
            attempt=fasaaha_attempt,
            teacher=teacher,
            overall_score=85,
            feedback='Good job!',
            madrasah=madrasah,
        )
        assert review.pk is not None
        assert review.overall_score == 85
        fasaaha_attempt.refresh_from_db()
        assert fasaaha_attempt.status == 'reviewed'
