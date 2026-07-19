import pytest
from rest_framework import status


@pytest.mark.django_db
class TestTeacherDashboard:
    def test_teacher_dashboard(self, teacher_client):
        response = teacher_client.get('/api/teacher/dashboard/')
        assert response.status_code == status.HTTP_200_OK
        assert 'total_students' in response.data
        assert 'total_quizzes' in response.data
        assert 'subject_performance' in response.data


@pytest.mark.django_db
class TestAdminDashboard:
    def test_admin_dashboard(self, auth_client):
        response = auth_client.get('/api/admin/dashboard/')
        assert response.status_code == status.HTTP_200_OK
        assert 'total_users' in response.data
        assert 'total_students' in response.data


@pytest.mark.django_db
class TestParentDashboard:
    def test_parent_dashboard(self, parent_client):
        response = parent_client.get('/api/parent/dashboard/')
        assert response.status_code == status.HTTP_200_OK
        assert 'children' in response.data


@pytest.mark.django_db
class TestBoardDashboard:
    def test_board_dashboard(self, client, board_user):
        client.force_authenticate(user=board_user)
        response = client.get('/api/board/dashboard/')
        assert response.status_code == status.HTTP_200_OK
        assert 'total_students' in response.data
        assert 'teacher_effectiveness' in response.data


@pytest.fixture
def board_user(madrasah):
    from users.models import User
    return User.objects.create_user(
        email='board@test.com',
        password='board123',
        first_name='Sheikh',
        last_name='Abdullah',
        role='idaarah',
        madrasah=madrasah,
    )
