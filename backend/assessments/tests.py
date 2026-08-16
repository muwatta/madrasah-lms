from django.test import TestCase
from rest_framework.test import APIClient

from users.models import Madrasah, StudentParent
from curriculum.models import Subject
from django.contrib.auth import get_user_model

User = get_user_model()


class QuizPublishGuardTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.madrasah = Madrasah.objects.create(name='Test Madrasah')
        self.mudeer = User.objects.create_user(
            email='mudeer@test.com', password='pass123',
            first_name='M', last_name='A', role='mudeer', madrasah=self.madrasah,
        )
        self.student = User.objects.create_user(
            email='student@test.com', password='pass123',
            first_name='S', last_name='T', role='student', madrasah=self.madrasah,
        )
        self.subject = Subject.objects.create(
            madrasah=self.madrasah, name_ar='Quran', name_en='Quran', code='QUR101',
        )
        self.quiz = self.madrasah.quizzes.create(
            title='Test Quiz', created_by=self.mudeer, subject=self.subject,
        )

    def test_student_cannot_publish_quiz(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(f'/api/v1/assessments/quizzes/{self.quiz.pk}/publish/')
        self.assertEqual(response.status_code, 403)

    def test_mudeer_can_publish_quiz(self):
        self.client.force_authenticate(user=self.mudeer)
        response = self.client.post(f'/api/v1/assessments/quizzes/{self.quiz.pk}/publish/')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['is_published'])


class QuizAttemptParentGuardTests(TestCase):
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
        self.subject = Subject.objects.create(
            madrasah=self.madrasah, name_ar='Quran', name_en='Quran', code='QUR101',
        )
        self.quiz = self.madrasah.quizzes.create(
            title='Quiz', created_by=self.mudeer, subject=self.subject,
        )
        self.attempt1 = self.quiz.attempts.create(student=self.student1)
        self.attempt2 = self.quiz.attempts.create(student=self.student2)

    def test_parent_can_view_own_child_attempt(self):
        self.client.force_authenticate(user=self.parent)
        response = self.client.get(f'/api/v1/assessments/quiz-attempts/{self.attempt1.pk}/')
        self.assertEqual(response.status_code, 200)

    def test_parent_cannot_view_unrelated_attempt(self):
        self.client.force_authenticate(user=self.parent)
        response = self.client.get(f'/api/v1/assessments/quiz-attempts/{self.attempt2.pk}/')
        self.assertEqual(response.status_code, 403)
