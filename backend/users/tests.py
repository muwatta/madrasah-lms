from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from users.models import Madrasah

User = get_user_model()


class MeViewTests(TestCase):
    def setUp(self):
        self.madrasah = Madrasah.objects.create(name='Test Madrasah')
        self.user = User.objects.create_user(
            email='user@test.com', password='pass123',
            first_name='Ali', last_name='Student',
            role='student', madrasah=self.madrasah,
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_get_me_returns_profile_fields(self):
        response = self.client.get('/api/v1/auth/me/')
        self.assertEqual(response.status_code, 200)
        data = response.data
        self.assertEqual(data['email'], 'user@test.com')
        self.assertEqual(data['first_name'], 'Ali')
        self.assertIn('phone', data)
        self.assertIn('date_of_birth', data)

    def test_requires_authentication(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/v1/auth/me/')
        self.assertEqual(response.status_code, 401)

    def test_update_profile_fields(self):
        response = self.client.patch('/api/v1/auth/me/', {
            'first_name': 'Omar',
            'last_name': 'Khan',
            'phone': '+966500000000',
            'date_of_birth': '2010-05-15',
        }, format='json')
        self.assertEqual(response.status_code, 200)
        data = response.data
        self.assertEqual(data['first_name'], 'Omar')
        self.assertEqual(data['last_name'], 'Khan')
        self.assertEqual(data['phone'], '+966500000000')
        self.assertEqual(data['date_of_birth'], '2010-05-15')
        self.assertEqual(data['email'], 'user@test.com')

    def test_put_also_updates_profile(self):
        response = self.client.put('/api/v1/auth/me/', {
            'first_name': 'Sara',
            'last_name': 'Lee',
        }, format='json')
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Sara')

    def test_email_and_role_cannot_be_changed(self):
        response = self.client.patch('/api/v1/auth/me/', {
            'email': 'hacked@test.com',
            'role': 'mudeer',
        }, format='json')
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, 'user@test.com')
        self.assertEqual(self.user.role, 'student')
