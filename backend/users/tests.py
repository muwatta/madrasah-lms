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
            'gender': 'male',
            'address': 'Riyadh, KSA',
        }, format='json')
        self.assertEqual(response.status_code, 200)
        data = response.data
        self.assertEqual(data['first_name'], 'Omar')
        self.assertEqual(data['last_name'], 'Khan')
        self.assertEqual(data['phone'], '+966500000000')
        self.assertEqual(data['date_of_birth'], '2010-05-15')
        self.assertEqual(data['gender'], 'male')
        self.assertEqual(data['address'], 'Riyadh, KSA')
        self.assertEqual(data['email'], 'user@test.com')

    def test_put_also_updates_profile(self):
        response = self.client.put('/api/v1/auth/me/', {
            'first_name': 'Sara',
            'last_name': 'Lee',
        }, format='json')
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Sara')

    def test_email_can_be_changed(self):
        response = self.client.patch('/api/v1/auth/me/', {
            'email': 'new-email@test.com',
        }, format='json')
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, 'new-email@test.com')
        self.assertFalse(self.user.email_verified)

    def test_email_must_be_unique(self):
        other = User.objects.create_user(
            email='other@test.com', password='pass123',
            first_name='X', last_name='Y',
            role='student', madrasah=self.madrasah,
        )
        response = self.client.patch('/api/v1/auth/me/', {
            'email': 'OTHER@test.com',
        }, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('email', response.data)
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, 'user@test.com')

    def test_role_cannot_be_changed(self):
        response = self.client.patch('/api/v1/auth/me/', {
            'role': 'mudeer',
        }, format='json')
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, 'student')


class MessageAccessTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.madrasah = Madrasah.objects.create(name='Test Madrasah')
        self.alice = User.objects.create_user(
            email='alice@test.com', password='pass123',
            first_name='Alice', last_name='A', role='student', madrasah=self.madrasah,
        )
        self.bob = User.objects.create_user(
            email='bob@test.com', password='pass123',
            first_name='Bob', last_name='B', role='student', madrasah=self.madrasah,
        )
        self.msg = self.madrasah.messages.create(
            sender=self.alice, recipient=self.bob, subject='Hi', body='Hello',
        )

    def test_recipient_can_read_message(self):
        self.client.force_authenticate(user=self.bob)
        response = self.client.get(f'/api/v1/users/messages/{self.msg.pk}/')
        self.assertEqual(response.status_code, 200)
        self.msg.refresh_from_db()
        self.assertTrue(self.msg.is_read)

    def test_sender_can_read_message(self):
        self.client.force_authenticate(user=self.alice)
        response = self.client.get(f'/api/v1/users/messages/{self.msg.pk}/')
        self.assertEqual(response.status_code, 200)

    def test_unrelated_user_cannot_read_message(self):
        other = User.objects.create_user(
            email='other@test.com', password='pass123',
            first_name='Other', last_name='X', role='student', madrasah=self.madrasah,
        )
        self.client.force_authenticate(user=other)
        response = self.client.get(f'/api/v1/users/messages/{self.msg.pk}/')
        self.assertEqual(response.status_code, 404)


class StudentParentCreateGuardTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.madrasah = Madrasah.objects.create(name='Test Madrasah')
        self.mudeer = User.objects.create_user(
            email='mudeer@test.com', password='pass123',
            first_name='M', last_name='A', role='mudeer', madrasah=self.madrasah,
        )
        self.student = User.objects.create_user(
            email='s@test.com', password='pass123',
            first_name='S', last_name='T', role='student', madrasah=self.madrasah,
        )
        self.parent = User.objects.create_user(
            email='p@test.com', password='pass123',
            first_name='P', last_name='A', role='parent', madrasah=self.madrasah,
        )

    def test_parent_cannot_create_student_parent_link(self):
        self.client.force_authenticate(user=self.parent)
        response = self.client.post(
            '/api/v1/users/student-parents/',
            {'student': self.student.pk, 'parent': self.parent.pk,
             'relationship': 'father'},
            format='json',
        )
        self.assertEqual(response.status_code, 403)

    def test_mudeer_can_create_student_parent_link(self):
        self.client.force_authenticate(user=self.mudeer)
        response = self.client.post(
            '/api/v1/users/student-parents/',
            {'student': self.student.pk, 'parent': self.parent.pk,
             'relationship': 'father'},
            format='json',
        )
        self.assertEqual(response.status_code, 201)
