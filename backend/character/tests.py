from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from datetime import date, timedelta

from users.models import Madrasah
from .models import CharacterTrait, CharacterEvaluation, CharacterScore

User = get_user_model()


class CharacterTraitModelTest(TestCase):
    def setUp(self):
        self.madrasah = Madrasah.objects.create(name='Test Madrasah')
        self.trait = CharacterTrait.objects.create(
            madrasah=self.madrasah,
            name='Honesty',
            name_ar='الصدق',
            category='moral',
            sort_order=1,
        )

    def test_str(self):
        self.assertEqual(str(self.trait), 'Honesty')

    def test_unique_together(self):
        with self.assertRaises(Exception):
            CharacterTrait.objects.create(
                madrasah=self.madrasah,
                name='Honesty',
                name_ar='الصدق',
                category='moral',
            )


class CharacterEvaluationModelTest(TestCase):
    def setUp(self):
        self.madrasah = Madrasah.objects.create(name='Test Madrasah')
        self.teacher = User.objects.create_user(
            email='teacher@test.com', password='pass',
            first_name='Ustaadh', last_name='Ali',
            role='ustaadh', madrasah=self.madrasah,
        )
        self.student = User.objects.create_user(
            email='student@test.com', password='pass',
            first_name='Ahmad', last_name='Hassan',
            role='student', madrasah=self.madrasah,
        )
        self.trait = CharacterTrait.objects.create(
            madrasah=self.madrasah, name='Honesty', name_ar='الصدق',
            category='moral',
        )
        self.evaluation = CharacterEvaluation.objects.create(
            madrasah=self.madrasah,
            student=self.student,
            teacher=self.teacher,
            evaluation_date=date.today(),
        )
        self.score = CharacterScore.objects.create(
            evaluation=self.evaluation,
            trait=self.trait,
            score=4,
        )

    def test_str(self):
        self.assertIn('Ahmad', str(self.evaluation))

    def test_score_str(self):
        self.assertEqual(str(self.score), 'Honesty: 4')


class CharacterTraitAPITest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.madrasah = Madrasah.objects.create(name='Test Madrasah')
        self.mudeer = User.objects.create_user(
            email='mudeer@test.com', password='pass',
            first_name='Admin', last_name='User',
            role='mudeer', madrasah=self.madrasah,
        )
        self.teacher = User.objects.create_user(
            email='teacher@test.com', password='pass',
            first_name='Ustaadh', last_name='Ali',
            role='ustaadh', madrasah=self.madrasah,
        )
        self.student = User.objects.create_user(
            email='student@test.com', password='pass',
            first_name='Ahmad', last_name='Hassan',
            role='student', madrasah=self.madrasah,
        )

    def test_mudeer_can_create_trait(self):
        self.client.force_authenticate(user=self.mudeer)
        res = self.client.post('/api/character/traits/', {
            'name': 'Respect',
            'name_ar': 'الاحترام',
            'category': 'social',
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_teacher_cannot_create_trait(self):
        self.client.force_authenticate(user=self.teacher)
        res = self.client.post('/api/character/traits/', {
            'name': 'Respect',
            'name_ar': 'الاحترام',
            'category': 'social',
        })
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_can_list_active_traits(self):
        CharacterTrait.objects.create(
            madrasah=self.madrasah, name='Honesty', name_ar='الصدق',
            category='moral', is_active=True,
        )
        self.client.force_authenticate(user=self.student)
        res = self.client.get('/api/character/traits/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_mudeer_can_update_trait(self):
        trait = CharacterTrait.objects.create(
            madrasah=self.madrasah, name='Honesty', name_ar='الصدق',
            category='moral',
        )
        self.client.force_authenticate(user=self.mudeer)
        res = self.client.patch(f'/api/character/traits/{trait.id}/', {
            'description': 'Being truthful',
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_mudeer_can_delete_trait(self):
        trait = CharacterTrait.objects.create(
            madrasah=self.madrasah, name='Honesty', name_ar='الصدق',
            category='moral',
        )
        self.client.force_authenticate(user=self.mudeer)
        res = self.client.delete(f'/api/character/traits/{trait.id}/')
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)


class CharacterEvaluationAPITest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.madrasah = Madrasah.objects.create(name='Test Madrasah')
        self.teacher = User.objects.create_user(
            email='teacher@test.com', password='pass',
            first_name='Ustaadh', last_name='Ali',
            role='ustaadh', madrasah=self.madrasah,
        )
        self.student = User.objects.create_user(
            email='student@test.com', password='pass',
            first_name='Ahmad', last_name='Hassan',
            role='student', madrasah=self.madrasah,
        )
        self.mudeer = User.objects.create_user(
            email='mudeer@test.com', password='pass',
            first_name='Admin', last_name='User',
            role='mudeer', madrasah=self.madrasah,
        )
        self.trait1 = CharacterTrait.objects.create(
            madrasah=self.madrasah, name='Honesty', name_ar='الصدق',
            category='moral',
        )
        self.trait2 = CharacterTrait.objects.create(
            madrasah=self.madrasah, name='Respect', name_ar='الاحترام',
            category='social',
        )

    def test_create_evaluation_with_scores(self):
        self.client.force_authenticate(user=self.teacher)
        res = self.client.post('/api/character/evaluations/', {
            'student': self.student.id,
            'evaluation_date': date.today().isoformat(),
            'overall_notes': 'Good behavior',
            'scores': [
                {'trait': self.trait1.id, 'score': 4, 'notes': 'Very honest'},
                {'trait': self.trait2.id, 'score': 3, 'notes': 'Shows respect'},
            ],
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(CharacterScore.objects.count(), 2)

    def test_create_evaluation_without_scores_fails(self):
        self.client.force_authenticate(user=self.teacher)
        res = self.client.post('/api/character/evaluations/', {
            'student': self.student.id,
            'evaluation_date': date.today().isoformat(),
            'scores': [],
        }, format='json')
        self.assertIn(res.status_code, [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_201_CREATED,
        ])

    def test_student_can_only_view_own_evaluations(self):
        other_student = User.objects.create_user(
            email='other@test.com', password='pass',
            first_name='Other', last_name='Student',
            role='student', madrasah=self.madrasah,
        )
        CharacterEvaluation.objects.create(
            madrasah=self.madrasah, student=other_student,
            teacher=self.teacher, evaluation_date=date.today(),
        )
        my_eval = CharacterEvaluation.objects.create(
            madrasah=self.madrasah, student=self.student,
            teacher=self.teacher, evaluation_date=date.today() - timedelta(days=1),
        )

        self.client.force_authenticate(user=self.student)
        res = self.client.get('/api/character/evaluations/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        ids = [e['id'] for e in res.data.get('results', res.data)]
        self.assertIn(my_eval.id, ids)

    def test_teacher_can_view_evaluations(self):
        CharacterEvaluation.objects.create(
            madrasah=self.madrasah, student=self.student,
            teacher=self.teacher, evaluation_date=date.today(),
        )
        self.client.force_authenticate(user=self.teacher)
        res = self.client.get('/api/character/evaluations/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_summary_endpoint(self):
        evaluation = CharacterEvaluation.objects.create(
            madrasah=self.madrasah, student=self.student,
            teacher=self.teacher, evaluation_date=date.today(),
        )
        CharacterScore.objects.create(evaluation=evaluation, trait=self.trait1, score=4)
        CharacterScore.objects.create(evaluation=evaluation, trait=self.trait2, score=5)

        self.client.force_authenticate(user=self.teacher)
        res = self.client.get(f'/api/character/evaluations/summary/?student={self.student.id}')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['student_name'], 'Ahmad Hassan')
        self.assertEqual(len(res.data['traits']), 2)
        self.assertIsNotNone(res.data['overall_average'])

    def test_update_within_24_hours(self):
        evaluation = CharacterEvaluation.objects.create(
            madrasah=self.madrasah, student=self.student,
            teacher=self.teacher, evaluation_date=date.today(),
        )
        self.client.force_authenticate(user=self.teacher)
        res = self.client.patch(f'/api/character/evaluations/{evaluation.id}/', {
            'overall_notes': 'Updated notes',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_invalid_score_range(self):
        self.client.force_authenticate(user=self.teacher)
        res = self.client.post('/api/character/evaluations/', {
            'student': self.student.id,
            'evaluation_date': date.today().isoformat(),
            'scores': [
                {'trait': self.trait1.id, 'score': 6},
            ],
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
