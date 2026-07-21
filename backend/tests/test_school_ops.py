import pytest
import json
from decimal import Decimal
from datetime import date, timedelta
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User, Madrasah, StudentParent
from users.authentication import generate_tokens
from curriculum.models import Subject, Topic, Enrollment, SchoolClass
from school_ops.models import (
    FeeStructure, Fee, FeePayment, Attendance, Announcement, Notification, AttendanceQRScan,
)
from school_ops.services import QRService


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def auth_client(api_client):
    def _auth(user):
        tokens = generate_tokens(user)
        api_client.credentials(HTTP_AUTHORIZATION='Bearer ' + tokens['access'])
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
        response = client.get('/api/v1/school/fee-structures/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_create_fee_structure(self, mudeer, auth_client, madrasah):
        client = auth_client(mudeer)
        response = client.post('/api/v1/school/fee-structures/', {
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
        response = client.post('/api/v1/school/fee-structures/', {
            'name': 'Hack Fee',
            'amount': '0.00',
        }, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN


# --- Fees ---

@pytest.mark.django_db
class TestFees:
    def test_list_fees(self, mudeer, auth_client, fee):
        client = auth_client(mudeer)
        response = client.get('/api/v1/school/fees/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_create_fee(self, mudeer, auth_client, student, madrasah):
        client = auth_client(mudeer)
        response = client.post('/api/v1/school/fees/', {
            'student': student.id,
            'amount': '25000.00',
            'due_date': (date.today() + timedelta(days=14)).isoformat(),
            'description': 'Exam fee',
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert Fee.objects.filter(madrasah=madrasah).count() == 1

    def test_student_cannot_create_fee(self, student, auth_client, mudeer):
        client = auth_client(student)
        response = client.post('/api/v1/school/fees/', {
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
        response = client.post(f'/api/v1/school/fees/{fee.id}/pay/', {
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
        response = client.post(f'/api/v1/school/fees/{fee.id}/pay/', {
            'amount_paid': '50000.00',
            'payment_method': 'bank_transfer',
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED

        fee.refresh_from_db()
        assert fee.amount_paid == Decimal('50000.00')
        assert fee.status == 'paid'

    def test_payment_amount_validation(self, mudeer, auth_client, fee):
        client = auth_client(mudeer)
        response = client.post(f'/api/v1/school/fees/{fee.id}/pay/', {}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST


# --- Attendance ---

@pytest.mark.django_db
class TestAttendance:
    def test_mark_attendance(self, ustaadh, auth_client, student, madrasah):
        client = auth_client(ustaadh)
        response = client.post('/api/v1/school/attendance/', {
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
        response = client.post('/api/v1/school/attendance/', {
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
        response = client.post('/api/v1/school/attendance/bulk/', {
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
        response = client.get('/api/v1/school/attendance/analytics/')
        assert response.status_code == status.HTTP_200_OK
        assert 'week_attendance_rate' in response.data
        assert 'daily_trend' in response.data


# --- Announcements ---

@pytest.mark.django_db
class TestAnnouncements:
    def test_list_announcements(self, mudeer, auth_client, announcement):
        client = auth_client(mudeer)
        response = client.get('/api/v1/school/announcements/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_student_sees_all_audience_announcements(self, student, auth_client, announcement):
        client = auth_client(student)
        response = client.get('/api/v1/school/announcements/')
        assert response.status_code == status.HTTP_200_OK
        assert any(a['id'] == announcement.id for a in response.data.get('results', response.data))

    def test_create_announcement(self, mudeer, auth_client, madrasah):
        client = auth_client(mudeer)
        response = client.post('/api/v1/school/announcements/', {
            'title': 'Ramadan Schedule',
            'title_ar': 'جدول رمضان',
            'message': 'Adjusted hours during Ramadan',
            'audience': 'all',
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert Announcement.objects.filter(madrasah=madrasah).count() == 1

    def test_student_cannot_create_announcement(self, student, auth_client):
        client = auth_client(student)
        response = client.post('/api/v1/school/announcements/', {
            'title': 'Fake News',
            'message': 'Haha',
        }, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN


# --- Notifications ---

@pytest.mark.django_db
class TestNotifications:
    def test_list_notifications(self, student, auth_client, notification):
        client = auth_client(student)
        response = client.get('/api/v1/school/notifications/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_unread_count(self, student, auth_client, notification):
        client = auth_client(student)
        response = client.get('/api/v1/school/notifications/unread-count/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['unread_count'] == 1

    def test_mark_read(self, student, auth_client, notification):
        client = auth_client(student)
        response = client.post(f'/api/v1/school/notifications/mark-read/{notification.id}/')
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
        response = client.get(f'/api/v1/school/reports/student/{student.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['student']['id'] == student.id
        assert 'overall_average' in response.data
        assert 'subject_performance' in response.data
        assert 'attendance' in response.data
        assert 'recommendations' in response.data

    def test_student_cannot_access_report(self, student, auth_client):
        client = auth_client(student)
        response = client.get(f'/api/v1/school/reports/student/{student.id}/')
        assert response.status_code == status.HTTP_403_FORBIDDEN


# --- Bulk Fee Create ---

@pytest.mark.django_db
class TestBulkFeeCreate:
    def test_bulk_create_with_structure(self, mudeer, auth_client, fee_structure, student, madrasah):
        client = auth_client(mudeer)
        response = client.post('/api/v1/school/fees/bulk-create/', {
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
        response = client.post('/api/v1/school/fees/bulk-create/', {
            'amount': '10000.00',
            'due_date': (date.today() + timedelta(days=14)).isoformat(),
            'description': 'Exam fee',
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['created'] == 2
        assert Fee.objects.filter(madrasah=madrasah).count() == 2

    def test_student_cannot_bulk_create(self, student, auth_client):
        client = auth_client(student)
        response = client.post('/api/v1/school/fees/bulk-create/', {
            'amount': '5000.00',
            'due_date': date.today().isoformat(),
        }, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_bulk_create_missing_date(self, mudeer, auth_client):
        client = auth_client(mudeer)
        response = client.post('/api/v1/school/fees/bulk-create/', {
            'amount': '5000.00',
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST


# --- QR Attendance ---

@pytest.fixture
def school_class(madrasah):
    return SchoolClass.objects.create(madrasah=madrasah, name_ar='صف الأول', name_en='Class 1', order=1)


@pytest.fixture
def qr_service():
    return QRService()


@pytest.mark.django_db
class TestQRGeneration:
    def test_class_qr_returns_base64(self, ustaadh, auth_client, school_class):
        client = auth_client(ustaadh)
        response = client.get(f'/api/v1/school/attendance/qr/class/{school_class.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert 'qr_data_url' in response.data
        assert response.data['qr_data_url'].startswith('data:image/png;base64,')
        assert 'payload' in response.data

    def test_student_qr_returns_base64(self, ustaadh, auth_client, student):
        client = auth_client(ustaadh)
        response = client.get(f'/api/v1/school/attendance/qr/student/{student.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert 'qr_data_url' in response.data
        assert response.data['payload']['s'] == student.id

    def test_nonexistent_class_returns_404(self, ustaadh, auth_client):
        client = auth_client(ustaadh)
        response = client.get('/api/v1/school/attendance/qr/class/99999/')
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_student_cannot_generate_qr(self, student, auth_client):
        client = auth_client(student)
        response = client.get(f'/api/v1/school/attendance/qr/student/{student.id}/')
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestQRService:
    def test_generate_and_verify_class_qr(self, qr_service, school_class, madrasah):
        buf, payload = qr_service.generate_class_qr(school_class, madrasah)
        assert buf is not None
        assert payload['v'] == 1
        assert payload['m'] == madrasah.id
        assert payload['c'] == school_class.id

        valid, result = qr_service.verify_qr_data(json.dumps(payload))
        assert valid is True

    def test_generate_and_verify_student_qr(self, qr_service, student, madrasah):
        buf, payload = qr_service.generate_student_qr(student, madrasah)
        assert buf is not None
        assert payload['s'] == student.id

        valid, result = qr_service.verify_qr_data(json.dumps(payload))
        assert valid is True

    def test_tampered_qr_rejected(self, qr_service, madrasah, school_class):
        buf, payload = qr_service.generate_class_qr(school_class, madrasah)
        payload['s'] = 99999

        valid, result = qr_service.verify_qr_data(json.dumps(payload))
        assert valid is False
        assert 'signature' in result.lower() or 'tamper' in result.lower() or 'Invalid' in result

    def test_expired_qr_rejected(self, qr_service, madrasah, school_class):
        buf, payload = qr_service.generate_class_qr(school_class, madrasah)
        payload['t'] = (timezone.now() - timedelta(minutes=10)).isoformat()

        payload_str = f"1|{payload['m']}|{payload['s']}|{payload['c']}|{payload['t']}"
        import hmac as hmac_mod
        import hashlib
        payload['h'] = hmac_mod.new(
            qr_service._get_secret().encode(),
            payload_str.encode(),
            hashlib.sha256,
        ).hexdigest()

        valid, result = qr_service.verify_qr_data(json.dumps(payload))
        assert valid is False
        assert 'expired' in result.lower()


@pytest.mark.django_db
class TestQRScan:
    def test_scan_creates_attendance(self, ustaadh, auth_client, student, madrasah, qr_service):
        buf, payload = qr_service.generate_student_qr(student, madrasah)
        client = auth_client(ustaadh)
        response = client.post('/api/v1/school/attendance/scan/', {
            'qr_data': json.dumps(payload),
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['attendance_status'] == 'present'
        assert Attendance.objects.filter(student=student, date=date.today()).exists()

    def test_scan_creates_qr_scan_record(self, ustaadh, auth_client, student, madrasah, qr_service):
        buf, payload = qr_service.generate_student_qr(student, madrasah)
        client = auth_client(ustaadh)
        response = client.post('/api/v1/school/attendance/scan/', {
            'qr_data': json.dumps(payload),
            'scanner_location': 'gate_1',
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        scan = AttendanceQRScan.objects.get(id=response.data['scan_id'])
        assert scan.scanner_location == 'gate_1'
        assert scan.method == 'qr_code'

    def test_duplicate_scan_rejected(self, ustaadh, auth_client, student, madrasah, qr_service):
        buf, payload = qr_service.generate_student_qr(student, madrasah)
        client = auth_client(ustaadh)
        client.post('/api/v1/school/attendance/scan/', {'qr_data': json.dumps(payload)}, format='json')
        response = client.post('/api/v1/school/attendance/scan/', {'qr_data': json.dumps(payload)}, format='json')
        assert response.status_code == status.HTTP_409_CONFLICT

    def test_expired_scan_rejected(self, ustaadh, auth_client, student, madrasah):
        client = auth_client(ustaadh)
        response = client.post('/api/v1/school/attendance/scan/', {
            'qr_data': json.dumps({"v": 1, "m": madrasah.id, "s": student.id, "c": 0, "t": (timezone.now() - timedelta(minutes=10)).isoformat(), "h": "fake"}),
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_tampered_scan_rejected(self, ustaadh, auth_client, student, madrasah):
        client = auth_client(ustaadh)
        response = client.post('/api/v1/school/attendance/scan/', {
            'qr_data': json.dumps({"v": 1, "m": madrasah.id, "s": student.id, "c": 0, "t": timezone.now().isoformat(), "h": "tampered"}),
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_scan_list_shows_today(self, ustaadh, auth_client, student, madrasah, qr_service):
        buf, payload = qr_service.generate_student_qr(student, madrasah)
        client = auth_client(ustaadh)
        client.post('/api/v1/school/attendance/scan/', {'qr_data': json.dumps(payload)}, format='json')
        response = client.get('/api/v1/school/attendance/scans/')
        assert response.status_code == status.HTTP_200_OK
