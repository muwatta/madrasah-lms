"""Fasaaha-specific test fixtures."""
import sys
import os
import pytest

# Ensure backend is on path so we can import from tests/conftest
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from django.core.files.uploadedfile import SimpleUploadedFile
from datetime import date

from users.models import User, Madrasah
from fasaaha.models import (
    SpeakingLevel, MissionCategory, Mission, SpeakingAttempt,
    AIAnalysis, TeacherReview, StudentLevelProgress, StudentStreak,
    Badge, StudentBadge,
)


@pytest.fixture
def madrasah():
    return Madrasah.objects.create(name='Test Madrasah', city='Lagos')


@pytest.fixture
def admin_user(madrasah):
    return User.objects.create_superuser(
        email='admin@test.com', password='admin123',
        first_name='Admin', last_name='User',
        role='mudeer', madrasah=madrasah,
    )


@pytest.fixture
def teacher(madrasah):
    return User.objects.create_user(
        email='teacher@test.com', password='teacher123',
        first_name='Ustaadh', last_name='Ahmed',
        role='ustaadh', madrasah=madrasah,
    )


@pytest.fixture
def student(madrasah):
    return User.objects.create_user(
        email='student@test.com', password='student123',
        first_name='Abdullah', last_name='Ibrahim',
        role='student', madrasah=madrasah,
    )


@pytest.fixture
def client():
    from rest_framework.test import APIClient
    return APIClient()


@pytest.fixture
def auth_client(client, admin_user):
    client.force_authenticate(user=admin_user)
    return client


@pytest.fixture
def teacher_client(client, teacher):
    client.force_authenticate(user=teacher)
    return client


@pytest.fixture
def student_client(client, student):
    client.force_authenticate(user=student)
    return client


# ── Fasaaha fixtures ──────────────────────────────────────────────────────


@pytest.fixture
def fasaaha_level(madrasah):
    return SpeakingLevel.objects.create(
        madrasah=madrasah, number=1, name='Beginner', name_ar='مبتدئ',
        description='Basic Arabic speaking', target_vocabulary_count=50,
        difficulty=1, is_active=True,
    )


@pytest.fixture
def fasaaha_category(madrasah):
    return MissionCategory.objects.create(
        madrasah=madrasah, name='Greetings', name_ar='تحيات',
        icon='👋', description='Greeting phrases', is_active=True,
    )


@pytest.fixture
def fasaaha_mission(madrasah, fasaaha_level, fasaaha_category, teacher):
    return Mission.objects.create(
        madrasah=madrasah, level=fasaaha_level, category=fasaaha_category,
        title='Say Good Morning', title_ar='قل صباح الخير',
        prompt_ar='صباح الخير', prompt_transliteration='Sabah al-khayr',
        prompt_translation='Good morning',
        expected_phrases=['صباح الخير', 'Sabah al-khayr'],
        difficulty=2, mission_type='pronunciation', max_time_seconds=60,
        is_active=True, created_by=teacher,
    )


@pytest.fixture
def fasaaha_attempt(madrasah, student, fasaaha_mission):
    audio = SimpleUploadedFile('test.webm', b'fake-audio-data', content_type='audio/webm')
    return SpeakingAttempt.objects.create(
        student=student, mission=fasaaha_mission, audio_file=audio,
        status='completed', attempt_number=1, madrasah=madrasah,
    )


@pytest.fixture
def fasaaha_analysis(fasaaha_attempt, madrasah):
    return AIAnalysis.objects.create(
        attempt=fasaaha_attempt, madrasah=madrasah,
        transcribed_text='صباح الخير', transcription_provider='whisper',
        transcription_confidence=0.92,
        pronunciation_score=78.5, grammar_score=85.0,
        fluency_score=72.3, vocabulary_score=80.0, overall_score=78.96,
        pronunciation_feedback='Good pronunciation overall',
        grammar_feedback='Sentence structure is correct',
        fluency_feedback='Slightly hesitant',
        word_scores=[
            {'word': 'صباح', 'score': 85, 'phonemes': [], 'issues': []},
            {'word': 'الخير', 'score': 72, 'phonemes': [], 'issues': [{'type': 'vowel', 'severity': 'medium', 'suggestion': 'Lengthen the vowel'}]},
        ],
        scoring_provider='azure', processing_time_ms=1200,
        confidence_score=82.0, topic_relevance_score=90.0,
        fluency_words_per_minute=120, fluency_pause_ratio=0.15,
    )


@pytest.fixture
def fasaaha_review(fasaaha_attempt, teacher, madrasah):
    return TeacherReview.objects.create(
        attempt=fasaaha_attempt, teacher=teacher,
        overall_score=80, feedback='Good attempt, keep practicing!',
        madrasah=madrasah,
    )


@pytest.fixture
def fasaaha_streak(student, madrasah):
    return StudentStreak.objects.create(
        student=student, current_streak=5, longest_streak=12,
        last_practice_date=date.today(), total_points=350, madrasah=madrasah,
    )


@pytest.fixture
def fasaaha_progress(student, fasaaha_level, madrasah):
    return StudentLevelProgress.objects.create(
        student=student, level=fasaaha_level,
        missions_attempted=8, missions_completed=5,
        average_score=76.5, best_score=92.0,
        status='in_progress', madrasah=madrasah,
    )


@pytest.fixture
def fasaaha_badge(madrasah):
    return Badge.objects.create(
        madrasah=madrasah, name='First Mission', name_ar='أول مهمة',
        description='Complete your first mission', icon='🌟',
        category='milestone', criteria={'type': 'missions_completed', 'value': 1},
        points=10, is_active=True,
    )


@pytest.fixture
def fasaaha_student_badge(student, fasaaha_badge, madrasah):
    return StudentBadge.objects.create(
        student=student, badge=fasaaha_badge,
        awarded_by=None, madrasah=madrasah,
    )
