import pytest
from decimal import Decimal
from datetime import date, timedelta
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User, Madrasah, StudentParent
from school_ops.models import (
    FeeStructure, Fee, FeePayment, Attendance, Announcement, Notification,
)


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def auth_client(api_client):
    def _auth(user):
        response = api_client.post('/api/auth/login/', {
            'email': user.email,
            'password': 'testpass123',
        })
        api_client.credentials(HTTP_AUTHORIZATION='Bearer ' + response.data['tokens']['access'])
        return api_client
    return _auth


@pytest.fixture
def madrasah():
    return Madrasah.objects.create(name='Test Madrasah')


@pytest.fixture
def mudeer(madrasah):
    return User.objects.create_user(
        email='mudeer@test.com', password='testpass123', role='mudeer',
        madrasah=madrasah, first_name='Mudeer', last_name='Admin',
    )


@pytest.fixture
def ustaadh(madrasah):
    return User.objects.create_user(
        email='ustaadh@test.com', password='testpass123', role='ustaadh',
        madrasah=madrasah, first_name='Ustaadh', last_name='Teacher',
    )


@pytest.fixture
def student(madrasah):
    return User.objects.create_user(
        email='student@test.com', password='testpass123', role='student',
        madrasah=madrasah, first_name='Student', last_name='User',
    )


@pytest.fixture
def parent(madrasah, student):
    p = User.objects.create_user(
        email='parent@test.com', password='testpass123', role='parent',
        madrasah=madrasah, first_name='Parent', last_name='User',
    )
    StudentParent.objects.create(student=student, parent=p, relationship='father')
    return p


@pytest.fixture
def fee_structure(madrasah):
    return FeeStructure.objects.create(
        madrasah=madrasah, name='Tuition', name_ar='الرسوم الدراسية',
        amount=Decimal('50000.00'), description='Term tuition fee',
    )


@pytest.fixture
def fee(madrasah, student, fee_structure):
    return Fee.objects.create(
        madrasah=madrasah, student=student, fee_structure=fee_structure,
        amount=Decimal('50000.00'), due_date=date.today() + timedelta(days=30),
    )


@pytest.fixture
def announcement(madrasah, mudeer):
    return Announcement.objects.create(
        madrasah=madrasah, created_by=mudeer, title='Term Start',
        message='School resumes next week', audience='all',
    )


@pytest.fixture
def notification(madrasah, student):
    return Notification.objects.create(
        madrasah=madrasah, recipient=student,
        notification_type='announcement', title='New Announcement',
        message='Check the new announcement',
    )


# --- Fee Structures ---

@pytest.mark.django_db
class TestFeeStructures:
    def test_list_fee_structures(self, mudeer, auth_client, fee_structure):
        client = auth_client(mudeer)
        response = client.get('/api/school/fee-structures/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_create_fee_structure(self, mudeer, auth_client, madrasah):
        client = auth_client(mudeer)
        response = client.post('/api/school/fee-structures/', {
            'name': 'Registration',
            'name_ar': 'رسوم التسجيل',
            'amount': '10000.00',
            'description': 'One-time registration fee',
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['name'] == 'Registration'
        assert FeeStructure.objects.filter(madrasah=madrasah).count() == 1

    def test_student_cannot_create_fee_structure(self, student, auth_client):
        client = auth_client(student)
        response = client.post('/api/school/fee-structures/', {
            'name': 'Hack Fee',
            'amount': '0.00',
        }, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN


# --- Fees ---

@pytest.mark.django_db
class TestFees:
    def test_list_fees(self, mudeer, auth_client, fee):
        client = auth_client(mudeer)
        response = client.get('/api/school/fees/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_create_fee(self, mudeer, auth_client, student, madrasah):
        client = auth_client(mudeer)
        response = client.post('/api/school/fees/', {
            'student': student.id,
            'amount': '25000.00',
            'due_date': (date.today() + timedelta(days=14)).isoformat(),
            'description': 'Exam fee',
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert Fee.objects.filter(madrasah=madrasah).count() == 1

    def test_student_cannot_create_fee(self, student, auth_client, mudeer):
        client = auth_client(student)
        response = client.post('/api/school/fees/', {
            'student': mudeer.id,
            'amount': '0.00',
            'due_date': date.today().isoformat(),
        }, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN


# --- Fee Payments ---

@pytest.mark.django_db
class TestFeePayments:
    def test_record_payment(self, mudeer, auth_client, fee):
        client = auth_client(mudeer)
        response = client.post(f'/api/school/fees/{fee.id}/pay/', {
            'amount_paid': '25000.00',
            'payment_method': 'cash',
            'notes': 'Partial payment',
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED

        fee.refresh_from_db()
        assert fee.amount_paid == Decimal('25000.00')
        assert fee.status == 'partial'

    def test_full_payment_marks_paid(self, mudeer, auth_client, fee):
        client = auth_client(mudeer)
        response = client.post(f'/api/school/fees/{fee.id}/pay/', {
            'amount_paid': '50000.00',
            'payment_method': 'bank_transfer',
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED

        fee.refresh_from_db()
        assert fee.amount_paid == Decimal('50000.00')
        assert fee.status == 'paid'

    def test_payment_amount_validation(self, mudeer, auth_client, fee):
        client = auth_client(mudeer)
        response = client.post(f'/api/school/fees/{fee.id}/pay/', {}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST


# --- Attendance ---

@pytest.mark.django_db
class TestAttendance:
    def test_mark_attendance(self, ustaadh, auth_client, student, madrasah):
        client = auth_client(ustaadh)
        response = client.post('/api/school/attendance/', {
            'student': student.id,
            'date': date.today().isoformat(),
            'status': 'present',
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert Attendance.objects.filter(
            madrasah=madrasah, student=student,
        ).exists()

    def test_student_cannot_mark_attendance(self, student, auth_client, madrasah):
        client = auth_client(student)
        other = User.objects.create_user(
            email='other@test.com', password='testpass123', role='student',
            madrasah=madrasah, first_name='Other', last_name='Student',
        )
        response = client.post('/api/school/attendance/', {
            'student': other.id,
            'date': date.today().isoformat(),
            'status': 'present',
        }, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_bulk_attendance(self, ustaadh, auth_client, student, madrasah):
        other = User.objects.create_user(
            email='student2@test.com', password='testpass123', role='student',
            madrasah=madrasah, first_name='Second', last_name='Student',
        )
        client = auth_client(ustaadh)
        response = client.post('/api/school/attendance/bulk/', {
            'date': date.today().isoformat(),
            'records': [
                {'student': student.id, 'status': 'present'},
                {'student': other.id, 'status': 'late'},
            ],
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['created'] == 2
        assert Attendance.objects.filter(madrasah=madrasah).count() == 2


# --- Attendance Analytics ---

@pytest.mark.django_db
class TestAttendanceAnalytics:
    def test_attendance_analytics(self, mudeer, auth_client, student, madrasah):
        today = date.today()
        for i in range(3):
            Attendance.objects.create(
                madrasah=madrasah, student=student,
                date=today - timedelta(days=i), status='present',
                marked_by=mudeer,
            )
        client = auth_client(mudeer)
        response = client.get('/api/school/attendance/analytics/')
        assert response.status_code == status.HTTP_200_OK
        assert 'week_attendance_rate' in response.data
        assert 'daily_trend' in response.data


# --- Announcements ---

@pytest.mark.django_db
class TestAnnouncements:
    def test_list_announcements(self, mudeer, auth_client, announcement):
        client = auth_client(mudeer)
        response = client.get('/api/school/announcements/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_student_sees_all_audience_announcements(self, student, auth_client, announcement):
        client = auth_client(student)
        response = client.get('/api/school/announcements/')
        assert response.status_code == status.HTTP_200_OK
        assert any(a['id'] == announcement.id for a in response.data.get('results', response.data))

    def test_create_announcement(self, mudeer, auth_client, madrasah):
        client = auth_client(mudeer)
        response = client.post('/api/school/announcements/', {
            'title': 'Ramadan Schedule',
            'title_ar': 'جدول رمضان',
            'message': 'Adjusted hours during Ramadan',
            'audience': 'all',
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert Announcement.objects.filter(madrasah=madrasah).count() == 1

    def test_student_cannot_create_announcement(self, student, auth_client):
        client = auth_client(student)
        response = client.post('/api/school/announcements/', {
            'title': 'Fake News',
            'message': 'Haha',
        }, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN


# --- Notifications ---

@pytest.mark.django_db
class TestNotifications:
    def test_list_notifications(self, student, auth_client, notification):
        client = auth_client(student)
        response = client.get('/api/school/notifications/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_unread_count(self, student, auth_client, notification):
        client = auth_client(student)
        response = client.get('/api/school/notifications/unread-count/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['unread_count'] == 1

    def test_mark_read(self, student, auth_client, notification):
        client = auth_client(student)
        response = client.post(f'/api/school/notifications/mark-read/{notification.id}/')
        assert response.status_code == status.HTTP_200_OK
        notification.refresh_from_db()
        assert notification.is_read is True


# --- Student Report ---

@pytest.mark.django_db
class TestStudentReport:
    def test_student_report(self, mudeer, auth_client, student, madrasah):
        today = date.today()
        for i in range(5):
            Attendance.objects.create(
                madrasah=madrasah, student=student,
                date=today - timedelta(days=i), status='present',
                marked_by=mudeer,
            )
        client = auth_client(mudeer)
        response = client.get(f'/api/school/reports/student/{student.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['student']['id'] == student.id
        assert 'overall_average' in response.data
        assert 'subject_performance' in response.data
        assert 'attendance' in response.data
        assert 'recommendations' in response.data

    def test_student_cannot_access_report(self, student, auth_client):
        client = auth_client(student)
        response = client.get(f'/api/school/reports/student/{student.id}/')
        assert response.status_code == status.HTTP_403_FORBIDDEN


# --- Bulk Fee Create ---

@pytest.mark.django_db
class TestBulkFeeCreate:
    def test_bulk_create_with_structure(self, mudeer, auth_client, fee_structure, student, madrasah):
        client = auth_client(mudeer)
        response = client.post('/api/school/fees/bulk-create/', {
            'fee_structure': fee_structure.id,
            'student_ids': [student.id],
            'due_date': (date.today() + timedelta(days=30)).isoformat(),
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['created'] == 1
        assert Fee.objects.filter(madrasah=madrasah, student=student, fee_structure=fee_structure).count() == 1

    def test_bulk_create_all_students(self, mudeer, auth_client, madrasah):
        s1 = User.objects.create_user(
            email='s1@test.com', password='testpass123', role='student',
            madrasah=madrasah, first_name='Student', last_name='One',
        )
        s2 = User.objects.create_user(
            email='s2@test.com', password='testpass123', role='student',
            madrasah=madrasah, first_name='Student', last_name='Two',
        )
        client = auth_client(mudeer)
        response = client.post('/api/school/fees/bulk-create/', {
            'amount': '10000.00',
            'due_date': (date.today() + timedelta(days=14)).isoformat(),
            'description': 'Exam fee',
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['created'] == 2
        assert Fee.objects.filter(madrasah=madrasah).count() == 2

    def test_student_cannot_bulk_create(self, student, auth_client):
        client = auth_client(student)
        response = client.post('/api/school/fees/bulk-create/', {
            'amount': '5000.00',
            'due_date': date.today().isoformat(),
        }, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_bulk_create_missing_date(self, mudeer, auth_client):
        client = auth_client(mudeer)
        response = client.post('/api/school/fees/bulk-create/', {
            'amount': '5000.00',
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
