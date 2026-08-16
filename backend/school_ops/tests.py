from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from users.models import Madrasah, StudentParent
from school_ops.models import Fee

User = get_user_model()


class FeePaymentParentGuardTests(TestCase):
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
        self.fee_own = Fee.objects.create(
            madrasah=self.madrasah, student=self.student1, amount=100,
            due_date='2026-01-15',
        )
        self.fee_other = Fee.objects.create(
            madrasah=self.madrasah, student=self.student2, amount=100,
            due_date='2026-01-15',
        )

    def test_parent_can_pay_own_child_fee(self):
        self.client.force_authenticate(user=self.parent)
        response = self.client.post(
            f'/api/v1/school/fees/{self.fee_own.pk}/pay/',
            {'amount_paid': '50', 'payment_method': 'cash'},
            format='json',
        )
        self.assertEqual(response.status_code, 201)

    def test_parent_cannot_pay_unrelated_fee(self):
        self.client.force_authenticate(user=self.parent)
        response = self.client.post(
            f'/api/v1/school/fees/{self.fee_other.pk}/pay/',
            {'amount_paid': '50', 'payment_method': 'cash'},
            format='json',
        )
        self.assertEqual(response.status_code, 403)
