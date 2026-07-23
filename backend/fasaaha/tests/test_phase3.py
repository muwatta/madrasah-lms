"""
Phase 3 backend tests — Dialogue, Daily Goals, Leaderboard, Score Trends.
"""
import pytest
from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import patch, MagicMock

from django.utils.timezone import now

from users.models import User, Madrasah
from fasaaha.models import (
    SpeakingLevel, MissionCategory, Mission, SpeakingAttempt,
    AIAnalysis, StudentStreak, DialogueSession, DialogueTurn,
    DailyGoal, LeaderboardEntry,
)
from fasaaha.services import (
    DialogueService, DailyGoalService, LeaderboardService,
)
from fasaaha.selectors import (
    get_dialogue_sessions, get_dialogue_session_by_uuid,
    get_dialogue_turns, get_daily_goal, get_leaderboard,
    get_score_trends,
)
from fasaaha.ai.dialogue_llm import DialogueLLMProvider, DialogueResponse, TurnEvaluation


# ═══════════════════════════════════════════════════════════════════════════
#  Dialogue LLM Fallback Tests
# ═══════════════════════════════════════════════════════════════════════════


class TestDialogueLLMFallback:
    """Test LLM fallback when no API key is configured."""

    @patch.object(DialogueLLMProvider, 'client', None)
    def test_greeting_fallback(self):
        llm = DialogueLLMProvider()
        llm._client = None
        llm.api_key = ''
        resp = llm.generate_ai_turn(topic='greetings', greeting=True)
        assert isinstance(resp, DialogueResponse)
        assert 'السلام' in resp.text_ar
        assert resp.text_en != ''

    @patch.object(DialogueLLMProvider, 'client', None)
    def test_response_fallback(self):
        llm = DialogueLLMProvider()
        llm._client = None
        llm.api_key = ''
        resp = llm.generate_ai_turn(topic='free')
        assert isinstance(resp, DialogueResponse)
        assert resp.text_ar != ''

    @patch.object(DialogueLLMProvider, 'client', None)
    def test_evaluation_fallback(self):
        llm = DialogueLLMProvider()
        llm._client = None
        llm.api_key = ''
        result = llm.evaluate_student_turn(student_text='مرحبا')
        assert isinstance(result, TurnEvaluation)
        assert result.pronunciation_score == 70
        assert result.turn_score == 70
        assert result.feedback == 'AI evaluation unavailable'

    def test_format_history(self):
        llm = DialogueLLMProvider()
        history = [
            {'role': 'ai', 'text_ar': 'مرحبا بك'},
            {'role': 'student', 'text_ar': 'مرحبا'},
        ]
        text = llm._format_history(history)
        assert 'AI: مرحبا بك' in text
        assert 'Student: مرحبا' in text

    def test_format_history_empty(self):
        llm = DialogueLLMProvider()
        text = llm._format_history([])
        assert '(Start of conversation)' in text


# ═══════════════════════════════════════════════════════════════════════════
#  DialogueService Tests
# ═══════════════════════════════════════════════════════════════════════════


@pytest.fixture
def fasaaha_level2(madrasah):
    return SpeakingLevel.objects.create(
        madrasah=madrasah, number=1, name='Beginner', name_ar='مبتدئ',
        description='Basic Arabic speaking', target_vocabulary_count=50,
        difficulty=1, is_active=True,
    )


@pytest.fixture
def fasaaha_mission2(madrasah, fasaaha_level2, fasaaha_category, teacher):
    return Mission.objects.create(
        madrasah=madrasah, level=fasaaha_level2, category=fasaaha_category,
        title='Say Hello', title_ar='قل مرحبا',
        prompt_ar='مرحبا', prompt_transliteration='Marhaba',
        prompt_translation='Hello',
        expected_phrases=['مرحبا', 'أهلاً'],
        difficulty=1, mission_type='conversation', max_time_seconds=60,
        is_active=True, created_by=teacher,
    )


class TestDialogueService:
    """Tests for DialogueService business logic."""

    @pytest.mark.django_db
    def test_start_session_creates_session(self, student, madrasah):
        session = DialogueService.start_session(
            student=student, madrasah=madrasah, topic='greetings', level_number=2,
        )
        assert session.pk is not None
        assert session.student == student
        assert session.madrasah == madrasah
        assert session.topic == 'greetings'
        assert session.level_number == 2
        assert session.status == 'active'

    @pytest.mark.django_db
    def test_start_session_creates_ai_greeting(self, student, madrasah):
        fake_greeting = DialogueResponse(
            text_ar='مرحبا بك', text_en='Welcome',
            transliteration='Marhaban bik', correction='',
            suggestion='', context_tags=['greeting'],
        )
        with patch('fasaaha.ai.dialogue_llm.DialogueLLMProvider') as MockLLM:
            MockLLM.return_value.generate_ai_turn.return_value = fake_greeting
            session = DialogueService.start_session(
                student=student, madrasah=madrasah, topic='free',
            )
        turns = session.turns.all()
        assert turns.count() == 1
        assert turns.first().role == 'ai'
        assert turns.first().text_ar == 'مرحبا بك'
        assert session.turn_count == 1

    @pytest.mark.django_db
    def test_start_session_abandons_previous_active(self, student, madrasah):
        s1 = DialogueService.start_session(
            student=student, madrasah=madrasah, topic='greetings',
        )
        assert s1.status == 'active'

        s2 = DialogueService.start_session(
            student=student, madrasah=madrasah, topic='shopping',
        )
        s1.refresh_from_db()
        assert s1.status == 'abandoned'
        assert s2.status == 'active'

    @pytest.mark.django_db
    def test_submit_student_turn(self, student, madrasah):
        session = DialogueService.start_session(
            student=student, madrasah=madrasah, topic='free',
        )
        result = DialogueService.submit_student_turn(
            session=session, text_ar='مرحبا، كيف حالك؟',
        )
        assert 'student_turn' in result
        assert 'ai_turn' in result
        assert 'evaluation' in result
        assert result['student_turn'].role == 'student'
        assert result['student_turn'].text_ar == 'مرحبا، كيف حالك؟'
        assert result['ai_turn'].role == 'ai'
        assert result['ai_turn'].text_ar != ''

        session.refresh_from_db()
        assert session.turn_count == 3  # greeting(1) + student(1) + ai(1)

    @pytest.mark.django_db
    def test_submit_turn_on_inactive_session_raises(self, student, madrasah):
        session = DialogueService.start_session(
            student=student, madrasah=madrasah, topic='free',
        )
        session.status = 'completed'
        session.save()
        with pytest.raises(ValueError, match="Session is no longer active"):
            DialogueService.submit_student_turn(session=session, text_ar='مرحبا')

    @pytest.mark.django_db
    def test_complete_session(self, student, madrasah):
        session = DialogueService.start_session(
            student=student, madrasah=madrasah, topic='free',
        )
        DialogueService.submit_student_turn(session=session, text_ar='مرحبا')
        completed = DialogueService.complete_session(session=session)
        assert completed.status == 'completed'
        assert completed.completed_at is not None
        assert completed.total_score is not None
        assert completed.duration_seconds > 0

    @pytest.mark.django_db
    def test_complete_session_awards_points(self, student, madrasah):
        session = DialogueService.start_session(
            student=student, madrasah=madrasah, topic='free',
        )
        DialogueService.submit_student_turn(session=session, text_ar='مرحبا')
        DialogueService.complete_session(session=session)

        streak = StudentStreak.objects.get(student=student, madrasah=madrasah)
        assert streak.total_points > 0


# ═══════════════════════════════════════════════════════════════════════════
#  Dialogue Selectors Tests
# ═══════════════════════════════════════════════════════════════════════════


class TestDialogueSelectors:

    @pytest.mark.django_db
    def test_get_dialogue_sessions(self, student, madrasah):
        DialogueService.start_session(student=student, madrasah=madrasah, topic='free')
        sessions = get_dialogue_sessions(student=student, madrasah=madrasah)
        assert sessions.count() == 1

    @pytest.mark.django_db
    def test_get_dialogue_session_by_uuid(self, student, madrasah):
        session = DialogueService.start_session(student=student, madrasah=madrasah, topic='free')
        fetched = get_dialogue_session_by_uuid(session_uuid=session.uuid, student=student)
        assert fetched.pk == session.pk

    @pytest.mark.django_db
    def test_get_dialogue_session_wrong_student_raises(self, student, madrasah):
        session = DialogueService.start_session(student=student, madrasah=madrasah, topic='free')
        other = User.objects.create_user(
            email='other@test.com', password='pass123',
            first_name='Other', last_name='Student',
            role='student', madrasah=madrasah,
        )
        with pytest.raises(DialogueSession.DoesNotExist):
            get_dialogue_session_by_uuid(session_uuid=session.uuid, student=other)

    @pytest.mark.django_db
    def test_get_dialogue_turns(self, student, madrasah):
        session = DialogueService.start_session(student=student, madrasah=madrasah, topic='free')
        turns = get_dialogue_turns(session=session)
        assert turns.count() == 1  # just the greeting


# ═══════════════════════════════════════════════════════════════════════════
#  DailyGoalService Tests
# ═══════════════════════════════════════════════════════════════════════════


class TestDailyGoalService:

    @pytest.mark.django_db
    def test_get_or_create_today_creates(self, student, madrasah):
        goal = DailyGoalService.get_or_create_today(student=student, madrasah=madrasah)
        assert goal.pk is not None
        assert goal.student == student
        assert goal.date == date.today()
        assert goal.missions_target == 3
        assert goal.minutes_target == 15
        assert goal.is_achieved is False

    @pytest.mark.django_db
    def test_get_or_create_today_idempotent(self, student, madrasah):
        g1 = DailyGoalService.get_or_create_today(student=student, madrasah=madrasah)
        g2 = DailyGoalService.get_or_create_today(student=student, madrasah=madrasah)
        assert g1.pk == g2.pk

    @pytest.mark.django_db
    def test_update_after_attempt(self, student, madrasah, fasaaha_level2, fasaaha_mission2):
        goal = DailyGoalService.get_or_create_today(student=student, madrasah=madrasah)
        from django.core.files.uploadedfile import SimpleUploadedFile
        audio = SimpleUploadedFile('test.webm', b'x' * 1000, content_type='audio/webm')
        attempt = SpeakingAttempt.objects.create(
            student=student, mission=fasaaha_mission2, audio_file=audio,
            status='completed', attempt_number=1, madrasah=madrasah,
            audio_duration_ms=120000,  # 2 minutes
        )
        updated = DailyGoalService.update_after_attempt(
            student=student, madrasah=madrasah, attempt=attempt,
        )
        assert updated.missions_completed == 1
        assert updated.minutes_practiced >= 1

    @pytest.mark.django_db
    def test_achieved_when_targets_met(self, student, madrasah):
        goal = DailyGoalService.get_or_create_today(student=student, madrasah=madrasah)
        goal.missions_completed = 3
        goal.minutes_practiced = 15
        goal.save()
        # Re-fetch
        goal = DailyGoalService.get_or_create_today(student=student, madrasah=madrasah)
        assert goal.missions_completed == 3  # still met

    @pytest.mark.django_db
    def test_get_weekly_goals(self, student, madrasah):
        today = date.today()
        for i in range(3):
            DailyGoal.objects.create(
                student=student, madrasah=madrasah,
                date=today - timedelta(days=i),
                missions_completed=i,
            )
        goals = DailyGoalService.get_weekly_goals(student=student, madrasah=madrasah)
        assert goals.count() == 3


# ═══════════════════════════════════════════════════════════════════════════
#  DailyGoal Selectors Tests
# ═══════════════════════════════════════════════════════════════════════════


class TestDailyGoalSelectors:

    @pytest.mark.django_db
    def test_get_daily_goal_exists(self, student, madrasah):
        DailyGoalService.get_or_create_today(student=student, madrasah=madrasah)
        goal = get_daily_goal(student=student, madrasah=madrasah)
        assert goal is not None
        assert goal.date == date.today()

    @pytest.mark.django_db
    def test_get_daily_goal_missing(self, student, madrasah):
        goal = get_daily_goal(student=student, madrasah=madrasah)
        assert goal is None


# ═══════════════════════════════════════════════════════════════════════════
#  LeaderboardService Tests
# ═══════════════════════════════════════════════════════════════════════════


@pytest.fixture
def fasaaha_level_lb(madrasah):
    return SpeakingLevel.objects.create(
        madrasah=madrasah, number=1, name='Beginner', name_ar='مبتدئ',
        description='Basic', target_vocabulary_count=50,
        difficulty=1, is_active=True,
    )


@pytest.fixture
def fasaaha_mission_lb(madrasah, fasaaha_level_lb, fasaaha_category, teacher):
    return Mission.objects.create(
        madrasah=madrasah, level=fasaaha_level_lb, category=fasaaha_category,
        title='Speak', title_ar='تحدث',
        prompt_ar='مرحبا', prompt_transliteration='Marhaba',
        prompt_translation='Hello',
        expected_phrases=['مرحبا'],
        difficulty=1, mission_type='pronunciation', max_time_seconds=60,
        is_active=True, created_by=teacher,
    )


@pytest.fixture
def student2(madrasah):
    return User.objects.create_user(
        email='student2@test.com', password='pass123',
        first_name='Omar', last_name='Ali',
        role='student', madrasah=madrasah,
    )


class TestLeaderboardService:

    @pytest.mark.django_db
    def test_update_leaderboard_empty(self, madrasah):
        entries = LeaderboardService.update_leaderboard(madrasah=madrasah, period='weekly')
        assert len(entries) == 0

    @pytest.mark.django_db
    def test_update_leaderboard_with_attempts(
        self, student, madrasah, fasaaha_level_lb, fasaaha_mission_lb,
    ):
        from django.core.files.uploadedfile import SimpleUploadedFile
        audio = SimpleUploadedFile('test.webm', b'x' * 100, content_type='audio/webm')
        att = SpeakingAttempt.objects.create(
            student=student, mission=fasaaha_mission_lb, audio_file=audio,
            status='completed', attempt_number=1, madrasah=madrasah,
        )
        AIAnalysis.objects.create(
            attempt=att, madrasah=madrasah,
            transcribed_text='مرحبا', transcription_provider='whisper',
            transcription_confidence=0.9,
            pronunciation_score=80, grammar_score=85,
            fluency_score=75, vocabulary_score=80, overall_score=80,
            pronunciation_feedback={}, grammar_feedback={},
            fluency_feedback={}, word_scores=[],
            scoring_provider='test', processing_time_ms=500,
        )

        entries = LeaderboardService.update_leaderboard(madrasah=madrasah, period='weekly')
        assert len(entries) >= 1
        assert entries[0].student_id == student.pk
        assert entries[0].missions_completed == 1

    @pytest.mark.django_db
    def test_get_leaderboard(self, madrasah):
        LeaderboardService.update_leaderboard(madrasah=madrasah, period='weekly')
        result = LeaderboardService.get_leaderboard(madrasah=madrasah, period='weekly')
        assert result.count() == 0  # no students with attempts

    @pytest.mark.django_db
    def test_leaderboard_ranks_ordered(self, student, student2, madrasah):
        today = date.today()
        start = today - timedelta(days=today.weekday())
        LeaderboardEntry.objects.create(
            madrasah=madrasah, student=student, period='weekly',
            period_start=start, points=100, missions_completed=5,
            average_score=85, rank=1,
        )
        LeaderboardEntry.objects.create(
            madrasah=madrasah, student=student2, period='weekly',
            period_start=start, points=50, missions_completed=2,
            average_score=70, rank=2,
        )
        result = LeaderboardService.get_leaderboard(madrasah=madrasah, period='weekly')
        assert result.count() == 2
        assert result[0].points >= result[1].points


# ═══════════════════════════════════════════════════════════════════════════
#  Leaderboard Selector Tests
# ═══════════════════════════════════════════════════════════════════════════


class TestLeaderboardSelectors:

    @pytest.mark.django_db
    def test_get_leaderboard_empty(self, madrasah):
        result = get_leaderboard(madrasah=madrasah, period='weekly')
        assert result.count() == 0


# ═══════════════════════════════════════════════════════════════════════════
#  Score Trends Tests
# ═══════════════════════════════════════════════════════════════════════════


class TestScoreTrends:

    @pytest.mark.django_db
    def test_get_score_trends_empty(self, student, madrasah):
        trends = list(get_score_trends(student=student, madrasah=madrasah, days=30))
        assert len(trends) == 0

    @pytest.mark.django_db
    def test_get_score_trends_with_data(
        self, student, madrasah, fasaaha_level_lb, fasaaha_mission_lb,
    ):
        from django.core.files.uploadedfile import SimpleUploadedFile
        audio = SimpleUploadedFile('test.webm', b'x' * 100, content_type='audio/webm')
        att = SpeakingAttempt.objects.create(
            student=student, mission=fasaaha_mission_lb, audio_file=audio,
            status='completed', attempt_number=1, madrasah=madrasah,
        )
        AIAnalysis.objects.create(
            attempt=att, madrasah=madrasah,
            transcribed_text='مرحبا', transcription_provider='whisper',
            transcription_confidence=0.9,
            pronunciation_score=80, grammar_score=85,
            fluency_score=75, vocabulary_score=80, overall_score=80,
            pronunciation_feedback={}, grammar_feedback={},
            fluency_feedback={}, word_scores=[],
            scoring_provider='test', processing_time_ms=500,
        )

        trends = list(get_score_trends(student=student, madrasah=madrasah, days=30))
        assert len(trends) == 1
        assert 'date' in trends[0]
        assert 'avg_score' in trends[0]
