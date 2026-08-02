import pytest

pytestmark = pytest.mark.django_db
from users.models import User
from curriculum.models import SchoolClass, Subject, ClassSubject, Enrollment


@pytest.fixture
def school_class(madrasah):
    return SchoolClass.objects.create(madrasah=madrasah, name_ar='صف أول', name_en='Class 1', order=1)


@pytest.fixture
def class_teacher(madrasah):
    return User.objects.create_user(
        email='ct@test.com', password='x', role='ustaadh', madrasah=madrasah,
    )


@pytest.fixture
def other_teacher(madrasah):
    return User.objects.create_user(
        email='ot@test.com', password='x', role='ustaadh', madrasah=madrasah,
    )


def test_class_teacher_manages_own_class_subjects(client, school_class, class_teacher, subject, student, madrasah):
    school_class.class_teacher = class_teacher
    school_class.save()
    client.force_authenticate(user=class_teacher)

    # attach subject to class
    res = client.post('/api/v1/curriculum/class-subjects/', {'school_class': school_class.id, 'subject': subject.id})
    assert res.status_code == 201, res.data

    # enroll student in that subject
    res = client.post('/api/v1/enrollments/', {
        'student': student.id, 'subject': subject.id, 'school_class': school_class.id,
    })
    assert res.status_code == 201, res.data

    # class teacher can list own class enrollments
    res = client.get('/api/v1/enrollments/', {'school_class': school_class.id})
    assert res.status_code == 200
    assert len(res.data['results']) == 1


def test_class_teacher_cannot_manage_other_class(client, school_class, class_teacher, other_teacher, subject, madrasah):
    school_class.class_teacher = other_teacher
    school_class.save()
    client.force_authenticate(user=class_teacher)
    res = client.post('/api/v1/curriculum/class-subjects/', {'school_class': school_class.id, 'subject': subject.id})
    assert res.status_code == 403


def test_enrollment_rejects_non_class_subject(client, school_class, admin_user, subject, student, madrasah):
    school_class.class_teacher = admin_user
    school_class.save()
    other = Subject.objects.create(madrasah=madrasah, name_ar='موضوع آخر', name_en='Other', code='OTH')
    client.force_authenticate(user=admin_user)
    res = client.post('/api/v1/enrollments/', {
        'student': student.id, 'subject': other.id, 'school_class': school_class.id,
    })
    assert res.status_code == 400, res.data


def test_plain_teacher_cannot_enroll(client, school_class, teacher, subject, student, madrasah):
    school_class.class_teacher = None
    school_class.save()
    client.force_authenticate(user=teacher)
    res = client.post('/api/v1/enrollments/', {
        'student': student.id, 'subject': subject.id, 'school_class': school_class.id,
    })
    assert res.status_code == 403


def test_plain_teacher_can_read_own_teaching_enrollments(client, school_class, teacher, subject, student, admin_user, madrasah):
    school_class.class_teacher = admin_user
    school_class.save()
    ClassSubject.objects.create(madrasah=madrasah, school_class=school_class, subject=subject)
    Enrollment.objects.create(
        madrasah=madrasah, student=student, subject=subject,
        school_class=school_class, ustaadh=teacher,
    )
    client.force_authenticate(user=teacher)
    # read path used by result entry
    res = client.get('/api/v1/enrollments/', {'school_class': school_class.id, 'ustaadh': teacher.id})
    assert res.status_code == 200
    assert len(res.data['results']) == 1
    # but a non-class-teacher cannot create enrollments
    res = client.post('/api/v1/enrollments/', {
        'student': student.id, 'subject': subject.id, 'school_class': school_class.id,
    })
    assert res.status_code == 403


def test_student_cannot_enroll(client, school_class, student, subject, madrasah):
    client.force_authenticate(user=student)
    res = client.post('/api/v1/enrollments/', {
        'student': student.id, 'subject': subject.id, 'school_class': school_class.id,
    })
    assert res.status_code == 403


def test_drop_class_subject_removes_enrollments(client, school_class, admin_user, subject, student, madrasah):
    school_class.class_teacher = admin_user
    school_class.save()
    cs = ClassSubject.objects.create(madrasah=madrasah, school_class=school_class, subject=subject)
    Enrollment.objects.create(madrasah=madrasah, student=student, subject=subject, school_class=school_class)
    client.force_authenticate(user=admin_user)
    res = client.delete(f'/api/v1/curriculum/class-subjects/{cs.id}/')
    assert res.status_code == 204
    assert not Enrollment.objects.filter(student=student, subject=subject).exists()


def test_class_teacher_classes_endpoint(client, school_class, class_teacher, madrasah):
    school_class.class_teacher = class_teacher
    school_class.save()
    client.force_authenticate(user=class_teacher)
    res = client.get('/api/v1/enrollments/class-teacher/classes/')
    assert res.status_code == 200
    assert len(res.data) == 1
    assert res.data[0]['id'] == school_class.id


def test_admin_assigns_class_teacher(client, school_class, admin_user, class_teacher):
    client.force_authenticate(user=admin_user)
    res = client.patch(f'/api/v1/curriculum/classes/{school_class.id}/', {'class_teacher': class_teacher.id})
    assert res.status_code == 200, res.data
    school_class.refresh_from_db()
    assert school_class.class_teacher_id == class_teacher.id
