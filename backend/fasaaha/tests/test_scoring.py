"""Tests for fasaaha.ai.scoring module."""
import pytest
from fasaaha.ai.scoring import (
    compute_composite_score,
    score_to_grade,
    score_to_label,
    is_passing,
)


class TestComputeCompositeScore:
    def test_all_scores_present(self):
        result = compute_composite_score(
            pronunciation=80, grammar=70, fluency=90, vocabulary=85
        )
        expected = round(80 * 0.35 + 70 * 0.25 + 90 * 0.20 + 85 * 0.20, 2)
        assert result == expected

    def test_missing_scores_reweight(self):
        result = compute_composite_score(pronunciation=80, grammar=0, fluency=0, vocabulary=0)
        assert result == 80.0

    def test_all_zeros_returns_zero(self):
        assert compute_composite_score() == 0

    def test_custom_weights(self):
        result = compute_composite_score(
            pronunciation=100, grammar=50,
            weights={'pronunciation': 0.5, 'grammar': 0.5, 'fluency': 0, 'vocabulary': 0},
        )
        assert result == 75.0

    def test_result_is_rounded(self):
        result = compute_composite_score(pronunciation=33, grammar=34, fluency=35, vocabulary=36)
        assert isinstance(result, float)
        assert result == round(result, 2)


class TestScoreToGrade:
    @pytest.mark.parametrize('score,grade', [
        (95, 'A'),
        (85, 'B'),
        (75, 'C'),
        (65, 'D'),
        (50, 'F'),
        (90, 'A'),
        (80, 'B'),
        (70, 'C'),
        (60, 'D'),
    ])
    def test_grades(self, score, grade):
        assert score_to_grade(score) == grade


class TestScoreToLabel:
    def test_excellent(self):
        assert score_to_label(95) == 'Excellent'

    def test_requires_practice(self):
        assert score_to_label(30) == 'Requires Practice'


class TestIsPassing:
    def test_passing(self):
        assert is_passing(75) is True

    def test_failing(self):
        assert is_passing(65) is False

    def test_custom_threshold(self):
        assert is_passing(55, threshold=50) is True
        assert is_passing(45, threshold=50) is False
