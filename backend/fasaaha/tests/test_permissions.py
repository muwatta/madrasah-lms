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


@pytest.mark.django_db
class TestAssignmentEndpoints:
    """Assignments: teachers/admins write, students read only their own."""

    @staticmethod
    def _student_client(student):
        from rest_framework.test import APIClient
        client = APIClient()
        client.force_authenticate(user=student)
        return client

    def test_teacher_can_create_and_list(self, teacher_client, fasaaha_mission, student, madrasah):
        from fasaaha.models import MissionAssignment
        resp = teacher_client.post('/api/v1/fasaaha/assignments/', {
            'mission': fasaaha_mission.id,
            'target_student': student.id,
            'is_required': True,
        }, format='json')
        assert resp.status_code == 201
        assert MissionAssignment.objects.count() == 1

        resp = teacher_client.get('/api/v1/fasaaha/assignments/')
        assert resp.status_code == 200
        assert resp.data['count'] == 1
        assert resp.data['results'][0]['mission_title'] == fasaaha_mission.title
        assert resp.data['results'][0]['target_student_name'] == student.get_full_name()

    def test_student_can_view_own_assignments(
            self, teacher_client, fasaaha_mission, student, madrasah):
        teacher_client.post('/api/v1/fasaaha/assignments/', {
            'mission': fasaaha_mission.id,
            'target_student': student.id,
        }, format='json')

        resp = self._student_client(student).get('/api/v1/fasaaha/assignments/')
        assert resp.status_code == 200
        assert resp.data['count'] == 1
        assert resp.data['results'][0]['mission'] == fasaaha_mission.id

    def test_student_cannot_see_other_students_assignments(
            self, teacher_client, fasaaha_mission, student, madrasah):
        from users.models import User
        other = User.objects.create_user(
            email='other@test.com', password='student123',
            first_name='Other', last_name='Student',
            role='student', madrasah=madrasah,
        )
        teacher_client.post('/api/v1/fasaaha/assignments/', {
            'mission': fasaaha_mission.id,
            'target_student': other.id,
        }, format='json')

        resp = self._student_client(student).get('/api/v1/fasaaha/assignments/')
        assert resp.status_code == 200
        assert resp.data['count'] == 0

    def test_student_cannot_create_assignment(self, student_client, fasaaha_mission, student):
        resp = student_client.post('/api/v1/fasaaha/assignments/', {
            'mission': fasaaha_mission.id,
            'target_student': student.id,
        }, format='json')
        assert resp.status_code == 403

    def test_student_cannot_delete_assignment(
            self, teacher_client, fasaaha_mission, student, madrasah):
        from fasaaha.models import MissionAssignment
        resp = teacher_client.post('/api/v1/fasaaha/assignments/', {
            'mission': fasaaha_mission.id,
            'target_student': student.id,
        }, format='json')
        assignment_id = MissionAssignment.objects.get().id

        resp = self._student_client(student).delete(f'/api/v1/fasaaha/assignments/{assignment_id}/')
        assert resp.status_code == 403
