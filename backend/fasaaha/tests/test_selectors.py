"""Tests for fasaaha selectors."""
import pytest
from fasaaha.selectors import (
    get_levels, get_level_by_id,
    get_categories, get_category_by_id,
    get_missions, get_mission_by_id, get_missions_for_level,
    get_attempts_for_student, get_pending_review_attempts, get_attempt_count_for_mission,
    get_student_progress, get_student_streak,
    get_badges, get_student_badges,
)


@pytest.mark.django_db
class TestLevelSelectors:
    def test_get_levels_returns_active(self, fasaaha_level):
        result = get_levels(madrasah=fasaaha_level.madrasah)
        assert result.count() == 1

    def test_get_levels_excludes_inactive(self, fasaaha_level):
        fasaaha_level.is_active = False
        fasaaha_level.save()
        result = get_levels(madrasah=fasaaha_level.madrasah)
        assert result.count() == 0

    def test_get_level_by_id(self, fasaaha_level):
        result = get_level_by_id(level_id=fasaaha_level.id, madrasah=fasaaha_level.madrasah)
        assert result.pk == fasaaha_level.id


@pytest.mark.django_db
class TestCategorySelectors:
    def test_get_categories(self, fasaaha_category):
        result = get_categories(madrasah=fasaaha_category.madrasah)
        assert result.count() == 1

    def test_get_category_by_id(self, fasaaha_category):
        result = get_category_by_id(category_id=fasaaha_category.id, madrasah=fasaaha_category.madrasah)
        assert result.pk == fasaaha_category.id


@pytest.mark.django_db
class TestMissionSelectors:
    def test_get_missions(self, fasaaha_mission):
        result = get_missions(madrasah=fasaaha_mission.madrasah)
        assert result.count() == 1

    def test_get_missions_filters_by_level(self, fasaaha_mission):
        result = get_missions(madrasah=fasaaha_mission.madrasah, level=fasaaha_mission.level)
        assert result.count() == 1

    def test_get_missions_filters_by_category(self, fasaaha_mission):
        result = get_missions(madrasah=fasaaha_mission.madrasah, category=fasaaha_mission.category)
        assert result.count() == 1

    def test_get_missions_filters_by_difficulty(self, fasaaha_mission):
        result = get_missions(madrasah=fasaaha_mission.madrasah, difficulty=2)
        assert result.count() == 1
        result = get_missions(madrasah=fasaaha_mission.madrasah, difficulty=5)
        assert result.count() == 0

    def test_get_mission_by_id(self, fasaaha_mission):
        result = get_mission_by_id(mission_id=fasaaha_mission.id, madrasah=fasaaha_mission.madrasah)
        assert result.pk == fasaaha_mission.id

    def test_get_missions_for_level(self, fasaaha_mission):
        result = get_missions_for_level(level_id=fasaaha_mission.level.id, madrasah=fasaaha_mission.madrasah)
        assert result.count() == 1


@pytest.mark.django_db
class TestAttemptSelectors:
    def test_get_attempts_for_student(self, fasaaha_attempt, student):
        result = get_attempts_for_student(student=student)
        assert result.count() == 1

    def test_get_pending_review_attempts(self, fasaaha_attempt):
        result = get_pending_review_attempts(madrasah=fasaaha_attempt.madrasah)
        assert result.count() == 1

    def test_pending_excludes_reviewed(self, fasaaha_attempt, fasaaha_review):
        result = get_pending_review_attempts(madrasah=fasaaha_attempt.madrasah)
        assert result.count() == 0

    def test_get_attempt_count_for_mission(self, fasaaha_attempt, student):
        result = get_attempt_count_for_mission(mission_id=fasaaha_attempt.mission.id, student=student)
        assert result == 1


@pytest.mark.django_db
class TestProgressSelectors:
    def test_get_student_progress(self, fasaaha_progress, student):
        result = get_student_progress(student=student)
        assert result.count() == 1

    def test_get_student_streak(self, fasaaha_streak, student):
        result = get_student_streak(student=student, madrasah=fasaaha_streak.madrasah)
        assert result is not None
        assert result.current_streak == 5


@pytest.mark.django_db
class TestBadgeSelectors:
    def test_get_badges(self, fasaaha_badge):
        result = get_badges(madrasah=fasaaha_badge.madrasah)
        assert result.count() == 1

    def test_get_student_badges(self, fasaaha_student_badge, student):
        result = get_student_badges(student=student)
        assert result.count() == 1
