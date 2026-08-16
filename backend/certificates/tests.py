from django.test import TestCase

# Create your tests here.
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from users.models import Madrasah, StudentParent
from .models import Certificate

User = get_user_model()


class CertificateGuardTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.madrasah = Madrasah.objects.create(name='Test Madrasah')
        self.mudeer = User.objects.create_user(
            email='mudeer@test.com', password='pass123',
            first_name='M', last_name='A', role='mudeer', madrasah=self.madrasah,
        )
        self.student1 = User.objects.create_user(
            email='s1@test.com', password='pass123',
            first_name='S', last_name='One', role='student', madrasah=self.madrasah,
        )
        self.student2 = User.objects.create_user(
            email='s2@test.com', password='pass123',
            first_name='S', last_name='Two', role='student', madrasah=self.madrasah,
        )
        self.parent = User.objects.create_user(
            email='parent@test.com', password='pass123',
            first_name='P', last_name='A', role='parent', madrasah=self.madrasah,
        )
        StudentParent.objects.create(student=self.student1, parent=self.parent)
        self.cert = Certificate.objects.create(
            madrasah=self.madrasah, student=self.student1,
            certificate_type='subject_completion', title='Completion',
        )

    def test_student_cannot_generate_certificate_for_other(self):
        self.client.force_authenticate(user=self.student1)
        response = self.client.post(
            '/api/v1/certificates/generate/',
            {'student': self.student2.pk, 'certificate_type': 'subject_completion',
             'title': 'Nope'},
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['student'], self.student1.pk)
        self.assertFalse(Certificate.objects.filter(student=self.student2).exists())

    def test_parent_cannot_generate_certificate_for_unrelated_child(self):
        self.client.force_authenticate(user=self.parent)
        response = self.client.post(
            '/api/v1/certificates/generate/',
            {'student': self.student2.pk, 'certificate_type': 'subject_completion',
             'title': 'Nope'},
            format='json',
        )
        self.assertEqual(response.status_code, 403)

    def test_parent_can_generate_certificate_for_own_child(self):
        self.client.force_authenticate(user=self.parent)
        response = self.client.post(
            '/api/v1/certificates/generate/',
            {'student': self.student1.pk, 'certificate_type': 'subject_completion',
             'title': 'Completion'},
            format='json',
        )
        self.assertEqual(response.status_code, 201)

    def test_student_cannot_delete_certificate(self):
        self.client.force_authenticate(user=self.student1)
        response = self.client.delete(f'/api/v1/certificates/{self.cert.pk}/')
        self.assertEqual(response.status_code, 403)
        self.assertTrue(Certificate.objects.filter(pk=self.cert.pk).exists())

    def test_mudeer_can_delete_certificate(self):
        self.client.force_authenticate(user=self.mudeer)
        response = self.client.delete(f'/api/v1/certificates/{self.cert.pk}/')
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Certificate.objects.filter(pk=self.cert.pk).exists())
