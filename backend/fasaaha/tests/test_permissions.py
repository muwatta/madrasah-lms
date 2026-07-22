"""Tests for fasaaha permissions."""
import pytest
from unittest.mock import MagicMock
from fasaaha.permissions import (
    IsFasaahaStudent, IsFasaahaTeacher, IsFasaahaAdmin,
    CanViewMissions, CanManageMissions, CanReviewAttempts,
)


def _make_request(user):
    request = MagicMock()
    request.user = user
    return request


def _make_user(role, madrasah=None, is_authenticated=True):
    user = MagicMock()
    user.role = role
    user.madrasah = madrasah
    user.is_authenticated = is_authenticated
    return user


@pytest.mark.django_db
class TestRolePermissions:
    def test_student_allowed(self):
        perm = IsFasaahaStudent()
        req = _make_request(_make_user('student'))
        assert perm.has_permission(req, None) is True

    def test_student_denied_for_teacher(self):
        perm = IsFasaahaStudent()
        req = _make_request(_make_user('ustaadh'))
        assert perm.has_permission(req, None) is False

    def test_teacher_allowed(self):
        perm = IsFasaahaTeacher()
        req = _make_request(_make_user('ustaadh'))
        assert perm.has_permission(req, None) is True

    def test_admin_allowed(self):
        perm = IsFasaahaAdmin()
        req = _make_request(_make_user('mudeer'))
        assert perm.has_permission(req, None) is True

    def test_admin_idaarah_allowed(self):
        perm = IsFasaahaAdmin()
        req = _make_request(_make_user('idaarah'))
        assert perm.has_permission(req, None) is True


@pytest.mark.django_db
class TestCanViewMissions:
    def test_authenticated_user_can_view(self):
        perm = CanViewMissions()
        req = _make_request(_make_user('student'))
        assert perm.has_permission(req, None) is True

    def test_unauthenticated_cannot_view(self):
        perm = CanViewMissions()
        req = _make_request(_make_user('student', is_authenticated=False))
        req.user.is_authenticated = False
        assert perm.has_permission(req, None) is False


@pytest.mark.django_db
class TestCanManageMissions:
    def test_teacher_can_manage(self):
        perm = CanManageMissions()
        req = _make_request(_make_user('ustaadh'))
        assert perm.has_permission(req, None) is True

    def test_student_cannot_manage(self):
        perm = CanManageMissions()
        req = _make_request(_make_user('student'))
        assert perm.has_permission(req, None) is False

    def test_admin_can_manage(self):
        perm = CanManageMissions()
        req = _make_request(_make_user('mudeer'))
        assert perm.has_permission(req, None) is True


@pytest.mark.django_db
class TestCanReviewAttempts:
    def test_teacher_can_review(self):
        perm = CanReviewAttempts()
        req = _make_request(_make_user('ustaadh'))
        assert perm.has_permission(req, None) is True

    def test_student_cannot_review(self):
        perm = CanReviewAttempts()
        req = _make_request(_make_user('student'))
        assert perm.has_permission(req, None) is False
