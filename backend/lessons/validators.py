from __future__ import annotations

from django.utils.timezone import now
from datetime import timedelta


def validate_lesson_plan_dates(*, lesson_date, start_time=None, end_time=None):
    if start_time and end_time and start_time >= end_time:
        raise ValueError("start_time must be before end_time.")


def validate_homework_dates(*, due_date):
    if due_date and due_date <= now():
        raise ValueError("due_date must be in the future.")


def validate_learning_objectives(*, objectives):
    if not isinstance(objectives, list):
        raise ValueError("learning_objectives must be a list.")
    for obj in objectives:
        if not isinstance(obj, str) or not obj.strip():
            raise ValueError("Each learning objective must be a non-empty string.")


def validate_student_activities(*, activities):
    if not isinstance(activities, list):
        raise ValueError("student_activities must be a list.")
    for act in activities:
        if not isinstance(act, str) or not act.strip():
            raise ValueError("Each student activity must be a non-empty string.")


def validate_workflow_transition(*, current_status, target_status, transitions_map):
    allowed = transitions_map.get(current_status, ())
    if target_status not in allowed:
        raise ValueError(
            f"Cannot transition from '{current_status}' to '{target_status}'. "
            f"Allowed: {allowed}"
        )


def validate_scheme_week_number(*, week_number, scheme):
    if week_number < 1 or week_number > 52:
        raise ValueError("week_number must be between 1 and 52.")


def validate_lesson_duration(*, duration_minutes):
    if duration_minutes < 5 or duration_minutes > 480:
        raise ValueError("duration_minutes must be between 5 and 480.")


def validate_resource_data(*, resource_type, title, url=''):
    if not title or not title.strip():
        raise ValueError("Resource title is required.")
    if resource_type in ('link', 'youtube', 'gdrive') and not url:
        raise ValueError(f"URL is required for resource type '{resource_type}'.")


def validate_reflection_rating(*, self_rating):
    if self_rating < 1 or self_rating > 5:
        raise ValueError("self_rating must be between 1 and 5.")


def validate_score_within_range(*, score, max_marks):
    if score < 0:
        raise ValueError("Score cannot be negative.")
    if max_marks and score > max_marks:
        raise ValueError(f"Score {score} exceeds max marks {max_marks}.")
