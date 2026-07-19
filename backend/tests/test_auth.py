import pytest
from rest_framework import status


@pytest.mark.django_db
class TestRegister:
    def test_register_user(self, client, madrasah):
        response = client.post('/api/auth/register/', {
            'email': 'new@test.com',
            'password': 'TestPass123!',
            'password_confirm': 'TestPass123!',
            'first_name': 'New',
            'last_name': 'User',
            'role': 'student',
            'madrasah': madrasah.id,
        })
        assert response.status_code == status.HTTP_201_CREATED
        assert 'user' in response.data
        assert 'tokens' in response.data

    def test_register_password_mismatch(self, client, madrasah):
        response = client.post('/api/auth/register/', {
            'email': 'new@test.com',
            'password': 'TestPass123!',
            'password_confirm': 'DifferentPass!',
            'first_name': 'New',
            'last_name': 'User',
            'role': 'student',
            'madrasah': madrasah.id,
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestLogin:
    def test_login_success(self, client, admin_user):
        response = client.post('/api/auth/login/', {
            'email': 'admin@test.com',
            'password': 'admin123',
        })
        assert response.status_code == status.HTTP_200_OK
        assert 'tokens' in response.data

    def test_login_invalid_credentials(self, client, admin_user):
        response = client.post('/api/auth/login/', {
            'email': 'admin@test.com',
            'password': 'wrongpassword',
        })
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestMe:
    def test_get_me(self, auth_client):
        response = auth_client.get('/api/auth/me/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == 'admin@test.com'

    def test_get_me_unauthenticated(self, client):
        response = client.get('/api/auth/me/')
        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)
