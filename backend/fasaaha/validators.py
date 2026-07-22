"""
Fasaaha-specific validators.
"""
from __future__ import annotations

from django.core.exceptions import ValidationError


def validate_attempt_status(value):
    """Validate that attempt status is a valid choice."""
    valid = {'processing', 'completed', 'failed', 'reviewed'}
    if value not in valid:
        raise ValidationError(f"Invalid status: {value}. Must be one of: {', '.join(sorted(valid))}")


def validate_level_number(value):
    """Validate level number is within supported range (Phase 1: 1-3)."""
    if value < 1 or value > 10:
        raise ValidationError(f"Level number must be between 1 and 10, got {value}")
    # Phase 1 only supports levels 1-3
    if value > 3:
        raise ValidationError(f"Level {value} is not yet available. Phase 1 supports levels 1-3.")


def validate_difficulty(value):
    """Validate difficulty rating is 1-5."""
    if value < 1 or value > 5:
        raise ValidationError(f"Difficulty must be between 1 and 5, got {value}")


def validate_score_range(value):
    """Validate a score is within 0-100 range."""
    if value < 0 or value > 100:
        raise ValidationError(f"Score must be between 0 and 100, got {value}")


def validate_max_time(value):
    """Validate max recording time in seconds."""
    if value < 10:
        raise ValidationError(f"Recording time must be at least 10 seconds, got {value}")
    if value > 300:
        raise ValidationError(f"Recording time cannot exceed 300 seconds, got {value}")
