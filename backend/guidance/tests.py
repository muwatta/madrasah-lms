from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from users.models import Madrasah, StudentParent
from curriculum.models import Subject
from guidance.models import AITutorSession, CareerRecommendation

User = get_user_model()


class CareerGuidanceGuardTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.madrasah = Madrasah.objects.create(name='Test Madrasah')
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

    def test_student_cannot_generate_for_other_student(self):
        self.client.force_authenticate(user=self.student1)
        response = self.client.post(
            '/api/v1/guidance/career/generate/',
            {'student_id': self.student2.pk},
            format='json',
        )
        self.assertEqual(response.status_code, 403)

    def test_parent_cannot_generate_for_unrelated_student(self):
        self.client.force_authenticate(user=self.parent)
        response = self.client.post(
            '/api/v1/guidance/career/generate/',
            {'student_id': self.student2.pk},
            format='json',
        )
        self.assertEqual(response.status_code, 403)

    def test_student_can_generate_own_career(self):
        self.client.force_authenticate(user=self.student1)
        response = self.client.post(
            '/api/v1/guidance/career/generate/',
            {'student_id': self.student1.pk},
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(
            CareerRecommendation.objects.filter(student=self.student1).count(), 1,
        )


class AITutorSessionDeleteGuardTests(TestCase):
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
        self.subject = Subject.objects.create(
            madrasah=self.madrasah, name_ar='Quran', name_en='Quran', code='QUR101',
        )
        self.session1 = AITutorSession.objects.create(
            madrasah=self.madrasah, student=self.student1,
            subject=self.subject, question='Q1', response='R1',
        )
        self.session2 = AITutorSession.objects.create(
            madrasah=self.madrasah, student=self.student2,
            subject=self.subject, question='Q2', response='R2',
        )

    def test_student_delete_only_own_sessions(self):
        self.client.force_authenticate(user=self.student1)
        response = self.client.delete('/api/v1/guidance/tutor/history/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['deleted'], 1)
        self.assertFalse(AITutorSession.objects.filter(pk=self.session1.pk).exists())
        self.assertTrue(AITutorSession.objects.filter(pk=self.session2.pk).exists())

    def test_staff_delete_requires_student_param(self):
        self.client.force_authenticate(user=self.mudeer)
        response = self.client.delete('/api/v1/guidance/tutor/history/')
        self.assertEqual(response.status_code, 400)

    def test_staff_delete_scoped_to_student(self):
        self.client.force_authenticate(user=self.mudeer)
        response = self.client.delete(
            f'/api/v1/guidance/tutor/history/?student={self.student1.pk}',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['deleted'], 1)
        self.assertTrue(AITutorSession.objects.filter(pk=self.session2.pk).exists())
