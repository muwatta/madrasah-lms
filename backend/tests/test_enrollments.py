import pytest
from django.test.utils import CaptureQueriesContext
from django.db import connection

pytestmark = pytest.mark.django_db
from curriculum.models import SchoolClass, Subject, ClassSubject, Enrollment
from users.models import User


@pytest.fixture
def school_class(madrasah):
    return SchoolClass.objects.create(madrasah=madrasah, name_ar='صف أول', name_en='Class 1', order=1)


@pytest.fixture
def other_class(madrasah):
    return SchoolClass.objects.create(madrasah=madrasah, name_ar='صف ثاني', name_en='Class 2', order=2)


@pytest.fixture
def maths(madrasah):
    return Subject.objects.create(madrasah=madrasah, name_ar='الرياضيات', name_en='Mathematics', code='MTH')


@pytest.fixture
def science(madrasah):
    return Subject.objects.create(madrasah=madrasah, name_ar='العلوم', name_en='Science', code='SCI')


@pytest.fixture
def literature(madrasah):
    return Subject.objects.create(madrasah=madrasah, name_ar='الأدب العربي', name_en='Arabic Literature', code='ADB')


@pytest.fixture
def student2(madrasah):
    return User.objects.create_user(
        email='student2@test.com', password='x', role='student', madrasah=madrasah,
        first_name='Second', last_name='Student',
    )


# --- Class-subjects endpoint tests ---

def test_class_returns_only_its_subjects(client, admin_user, school_class, maths, science, literature):
    """A class should return only the subjects assigned to it."""
    client.force_authenticate(user=admin_user)
    ClassSubject.objects.create(madrasah=admin_user.madrasah, school_class=school_class, subject=maths)
    ClassSubject.objects.create(madrasah=admin_user.madrasah, school_class=school_class, subject=science)

    res = client.get('/api/v1/curriculum/class-subjects/', {'school_class': school_class.id})
    assert res.status_code == 200
    results = res.data.get('results', res.data)
    subject_ids = {cs['subject'] for cs in results}
    assert subject_ids == {maths.id, science.id}
    assert literature.id not in subject_ids


def test_class_with_no_subjects_returns_empty(client, admin_user, school_class):
    """A class with no subjects assigned should return an empty list."""
    client.force_authenticate(user=admin_user)
    res = client.get('/api/v1/curriculum/class-subjects/', {'school_class': school_class.id})
    assert res.status_code == 200
    results = res.data.get('results', res.data)
    assert len(results) == 0


def test_invalid_class_id_returns_empty(client, admin_user):
    """An invalid class ID should return an empty list (not an error)."""
    client.force_authenticate(user=admin_user)
    res = client.get('/api/v1/curriculum/class-subjects/', {'school_class': 99999})
    assert res.status_code == 200
    results = res.data.get('results', res.data)
    assert len(results) == 0


# --- Enrollment validation tests ---

def test_enrollment_succeeds_when_subject_belongs_to_class(client, admin_user, school_class, maths, student):
    """Enrollment should succeed when the subject is assigned to the class."""
    client.force_authenticate(user=admin_user)
    ClassSubject.objects.create(madrasah=admin_user.madrasah, school_class=school_class, subject=maths)
    res = client.post('/api/v1/enrollments/', {
        'student': student.id, 'subject': maths.id, 'school_class': school_class.id,
    })
    assert res.status_code == 201, res.data
    assert Enrollment.objects.filter(student=student, subject=maths).exists()


def test_enrollment_fails_when_subject_not_in_class(client, admin_user, school_class, maths, student):
    """Enrollment should fail when the subject is NOT assigned to the class."""
    client.force_authenticate(user=admin_user)
    res = client.post('/api/v1/enrollments/', {
        'student': student.id, 'subject': maths.id, 'school_class': school_class.id,
    })
    assert res.status_code == 400
    assert 'subject' in res.data or 'non_field_errors' in res.data


def test_enrollment_fails_for_subject_in_different_class(client, admin_user, school_class, other_class, maths, student):
    """Enrollment should fail when the subject belongs to a different class."""
    client.force_authenticate(user=admin_user)
    ClassSubject.objects.create(madrasah=admin_user.madrasah, school_class=other_class, subject=maths)
    res = client.post('/api/v1/enrollments/', {
        'student': student.id, 'subject': maths.id, 'school_class': school_class.id,
    })
    assert res.status_code == 400


def test_duplicate_enrollment_is_rejected(client, admin_user, school_class, maths, student):
    """Enrolling the same student in the same subject twice should be rejected."""
    client.force_authenticate(user=admin_user)
    ClassSubject.objects.create(madrasah=admin_user.madrasah, school_class=school_class, subject=maths)
    client.post('/api/v1/enrollments/', {
        'student': student.id, 'subject': maths.id, 'school_class': school_class.id,
    })
    res = client.post('/api/v1/enrollments/', {
        'student': student.id, 'subject': maths.id, 'school_class': school_class.id,
    })
    assert res.status_code == 400


# --- Query efficiency test ---

def test_enrollment_list_query_efficiency(client, admin_user, school_class, maths, science, student, student2):
    """Enrollment list should not have N+1 query issues."""
    ClassSubject.objects.create(madrasah=admin_user.madrasah, school_class=school_class, subject=maths)
    ClassSubject.objects.create(madrasah=admin_user.madrasah, school_class=school_class, subject=science)
    Enrollment.objects.create(madrasah=admin_user.madrasah, student=student, subject=maths, school_class=school_class)
    Enrollment.objects.create(madrasah=admin_user.madrasah, student=student, subject=science, school_class=school_class)
    Enrollment.objects.create(madrasah=admin_user.madrasah, student=student2, subject=maths, school_class=school_class)

    client.force_authenticate(user=admin_user)
    with CaptureQueriesContext(connection) as ctx:
        res = client.get('/api/v1/enrollments/')
    assert res.status_code == 200
    query_count = len(ctx.captured_queries)
    assert query_count <= 5, f"Too many queries: {query_count}. Possible N+1 issue."


# --- Class-subjects filtering tests ---

def test_class_subjects_returns_all_when_no_filter(client, admin_user, school_class, other_class, maths, science):
    """Without a class filter, all class-subjects should be returned."""
    client.force_authenticate(user=admin_user)
    ClassSubject.objects.create(madrasah=admin_user.madrasah, school_class=school_class, subject=maths)
    ClassSubject.objects.create(madrasah=admin_user.madrasah, school_class=other_class, subject=science)

    res = client.get('/api/v1/curriculum/class-subjects/')
    assert res.status_code == 200
    results = res.data.get('results', res.data)
    assert len(results) == 2


def test_class_subjects_filter_by_class(client, admin_user, school_class, other_class, maths, science):
    """Filtering by class should return only that class's subjects."""
    client.force_authenticate(user=admin_user)
    ClassSubject.objects.create(madrasah=admin_user.madrasah, school_class=school_class, subject=maths)
    ClassSubject.objects.create(madrasah=admin_user.madrasah, school_class=other_class, subject=science)

    res = client.get('/api/v1/curriculum/class-subjects/', {'school_class': school_class.id})
    assert res.status_code == 200
    results = res.data.get('results', res.data)
    assert len(results) == 1
    assert results[0]['subject'] == maths.id
