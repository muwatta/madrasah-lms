"""
Composite scoring utilities for Fasaaha.

Calculates weighted scores from individual analysis dimensions.
"""
from __future__ import annotations

from typing import Optional


# Default weights for composite scoring
DEFAULT_WEIGHTS = {
    'pronunciation': 0.35,
    'grammar': 0.25,
    'fluency': 0.20,
    'vocabulary': 0.20,
}


def compute_composite_score(
    pronunciation: Optional[float] = None,
    grammar: Optional[float] = None,
    fluency: Optional[float] = None,
    vocabulary: Optional[float] = None,
    weights: Optional[dict] = None,
) -> float:
    """
    Compute weighted composite score from individual dimension scores.

    Only non-zero scores are included in the weighted average.

    Args:
        pronunciation: Score 0-100
        grammar: Score 0-100
        fluency: Score 0-100
        vocabulary: Score 0-100
        weights: Optional custom weights dict

    Returns:
        Weighted average score rounded to 2 decimal places
    """
    w = weights or DEFAULT_WEIGHTS
    scores = {
        'pronunciation': pronunciation or 0,
        'grammar': grammar or 0,
        'fluency': fluency or 0,
        'vocabulary': vocabulary or 0,
    }

    total_weight = 0
    weighted_sum = 0

    for key, weight in w.items():
        if scores[key] > 0:
            weighted_sum += scores[key] * weight
            total_weight += weight

    if total_weight == 0:
        return 0

    return round(weighted_sum / total_weight, 2)


def score_to_grade(score: float) -> str:
    """Convert a numeric score to a letter grade."""
    if score >= 90:
        return 'A'
    elif score >= 80:
        return 'B'
    elif score >= 70:
        return 'C'
    elif score >= 60:
        return 'D'
    else:
        return 'F'


def score_to_label(score: float) -> str:
    """Convert a numeric score to a human-readable label."""
    if score >= 90:
        return 'Excellent'
    elif score >= 80:
        return 'Very Good'
    elif score >= 70:
        return 'Good'
    elif score >= 60:
        return 'Satisfactory'
    elif score >= 50:
        return 'Needs Improvement'
    else:
        return 'Requires Practice'


def is_passing(score: float, threshold: float = 70) -> bool:
    """Check if a score meets the passing threshold."""
    return score >= threshold
