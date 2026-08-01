import pytest
from rest_framework import status


@pytest.mark.django_db
class TestRegister:
    def test_register_creates_guest(self, client, madrasah):
        response = client.post('/api/v1/auth/register/', {
            'email': 'new@test.com',
            'password': 'TestPass123!',
            'password_confirm': 'TestPass123!',
            'first_name': 'New',
            'last_name': 'User',
            'role': 'mudeer',
            'madrasah': madrasah.id,
        })
        assert response.status_code == status.HTTP_201_CREATED
        assert 'user' in response.data
        assert 'tokens' in response.data
        assert response.data['user']['role'] == 'guest'

    def test_register_password_mismatch(self, client, madrasah):
        response = client.post('/api/v1/auth/register/', {
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
class TestGuestFlow:
    def _register_guest(self, client, madrasah, email='guest@test.com'):
        response = client.post('/api/v1/auth/register/', {
            'email': email,
            'password': 'TestPass123!',
            'password_confirm': 'TestPass123!',
            'first_name': 'Guest',
            'last_name': 'User',
            'madrasah': madrasah.id,
        })
        assert response.status_code == status.HTTP_201_CREATED
        return response.data

    def test_guest_cannot_access_protected_endpoints(self, client, madrasah):
        data = self._register_guest(client, madrasah)
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {data['tokens']['access']}")
        response = client.get('/api/v1/users/')
        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)

    def test_guest_can_access_me(self, client, madrasah):
        data = self._register_guest(client, madrasah)
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {data['tokens']['access']}")
        response = client.get('/api/v1/auth/me/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['role'] == 'guest'

    def test_approve_guest_requires_verified_email(self, client, madrasah):
        data = self._register_guest(client, madrasah)
        from users.models import User
        guest = User.objects.get(email='guest@test.com')
        assert guest.role == 'guest'

        auth_client = client
        admin = User.objects.create_superuser(
            email='admin2@test.com', password='admin123', role='mudeer', madrasah=madrasah,
        )
        auth_client.force_authenticate(user=admin)
        response = auth_client.post(f'/api/v1/users/{guest.id}/approve/', {'role': 'student'})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_approve_guest_sets_role(self, client, madrasah):
        data = self._register_guest(client, madrasah)
        from users.models import User
        guest = User.objects.get(email='guest@test.com')
        guest.email_verified = True
        guest.save(update_fields=['email_verified'])

        admin = User.objects.create_superuser(
            email='admin3@test.com', password='admin123', role='mudeer', madrasah=madrasah,
        )
        client.force_authenticate(user=admin)
        response = client.post(f'/api/v1/users/{guest.id}/approve/', {'role': 'student'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['role'] == 'student'

    def test_non_admin_cannot_approve(self, client, madrasah):
        from users.models import User
        guest = User.objects.create_user(
            email='guest2@test.com', password='TestPass123!', role='guest', madrasah=madrasah,
        )
        teacher = User.objects.create_user(
            email='t2@test.com', password='TestPass123!', role='ustaadh', madrasah=madrasah,
        )
        client.force_authenticate(user=teacher)
        response = client.post(f'/api/v1/users/{guest.id}/approve/', {'role': 'student'})
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_create_user_assigns_role(self, client, madrasah):
        from users.models import User
        admin = User.objects.create_superuser(
            email='admin4@test.com', password='admin123', role='mudeer', madrasah=madrasah,
        )
        client.force_authenticate(user=admin)
        response = client.post('/api/v1/users/create/', {
            'email': 'created@test.com',
            'password': 'TestPass123!',
            'password_confirm': 'TestPass123!',
            'first_name': 'Created',
            'last_name': 'User',
            'role': 'ustaadh',
        })
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['role'] == 'ustaadh'


@pytest.mark.django_db
class TestLogin:
    def test_login_success(self, client, admin_user):
        response = client.post('/api/v1/auth/login/', {
            'email': 'admin@test.com',
            'password': 'admin123',
        })
        assert response.status_code == status.HTTP_200_OK
        assert 'tokens' in response.data

    def test_login_invalid_credentials(self, client, admin_user):
        response = client.post('/api/v1/auth/login/', {
            'email': 'admin@test.com',
            'password': 'wrongpassword',
        })
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestMe:
    def test_get_me(self, auth_client):
        response = auth_client.get('/api/v1/auth/me/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == 'admin@test.com'

    def test_get_me_unauthenticated(self, client):
        response = client.get('/api/v1/auth/me/')
        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)
