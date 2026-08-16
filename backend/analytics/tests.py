from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from users.models import Madrasah, StudentParent
from analytics.models import SkillAssessment

User = get_user_model()


class SkillAssessmentGuardTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.madrasah = Madrasah.objects.create(name='Test Madrasah')
        self.teacher = User.objects.create_user(
            email='teacher@test.com', password='pass123',
            first_name='T', last_name='E', role='ustaadh', madrasah=self.madrasah,
        )
        self.student = User.objects.create_user(
            email='student@test.com', password='pass123',
            first_name='S', last_name='T', role='student', madrasah=self.madrasah,
        )
        self.assessment = SkillAssessment.objects.create(
            madrasah=self.madrasah, student=self.student, teacher=self.teacher,
            skill_name='problem_solving', score=3, assessment_date='2026-01-15',
        )

    def test_student_cannot_edit_own_score(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.patch(
            f'/api/v1/analytics/skills/{self.assessment.pk}/',
            {'score': 5},
            format='json',
        )
        self.assertEqual(response.status_code, 403)
        self.assessment.refresh_from_db()
        self.assertEqual(self.assessment.score, 3)

    def test_teacher_can_update_assessment(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.patch(
            f'/api/v1/analytics/skills/{self.assessment.pk}/',
            {'score': 5},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.assessment.refresh_from_db()
        self.assertEqual(self.assessment.score, 5)
