import pytest
from rest_framework.test import APIClient
from users.models import User, Madrasah, StudentParent
from curriculum.models import Subject, Topic, Enrollment
from assessments.models import Question, Quiz, QuizAttempt
from results.models import Exam, ExamResult


@pytest.fixture
def madrasah():
    return Madrasah.objects.create(name='Test Madrasah', city='Lagos')


@pytest.fixture
def admin_user(madrasah):
    return User.objects.create_superuser(
        email='admin@test.com',
        password='admin123',
        first_name='Admin',
        last_name='User',
        role='mudeer',
        madrasah=madrasah,
    )


@pytest.fixture
def teacher(madrasah):
    return User.objects.create_user(
        email='teacher@test.com',
        password='teacher123',
        first_name='Ustaadh',
        last_name='Ahmed',
        role='ustaadh',
        madrasah=madrasah,
    )


@pytest.fixture
def student(madrasah):
    return User.objects.create_user(
        email='student@test.com',
        password='student123',
        first_name='Abdullah',
        last_name='Ibrahim',
        role='student',
        madrasah=madrasah,
    )


@pytest.fixture
def parent_user(madrasah, student):
    p = User.objects.create_user(
        email='parent@test.com',
        password='parent123',
        first_name='Ibrahim',
        last_name='Oladipupo',
        role='parent',
        madrasah=madrasah,
    )
    StudentParent.objects.create(student=student, parent=p, relationship='father')
    return p


@pytest.fixture
def subject(madrasah):
    return Subject.objects.create(madrasah=madrasah, name_ar='القرآن الكريم', name_en='Holy Quran', code='QUR')


@pytest.fixture
def topic(subject):
    return Topic.objects.create(subject=subject, name='Surah Al-Fatiha')


@pytest.fixture
def question(madrasah, topic, teacher):
    return Question.objects.create(
        madrasah=madrasah,
        topic=topic,
        question_text='What is the first Surah?',
        question_type='mcq',
        options=['Al-Fatiha', 'Al-Baqarah', 'Al-Imran', 'An-Nisa'],
        correct_answer='Al-Fatiha',
        explanation='Al-Fatiha is the opening chapter.',
        difficulty='easy',
        created_by=teacher,
    )


@pytest.fixture
def quiz(madrasah, subject, teacher, question):
    return Quiz.objects.create(
        madrasah=madrasah,
        subject=subject,
        created_by=teacher,
        title='Test Quiz',
        description='A test quiz',
        question_ids=[question.id],
        quiz_type='practice',
        passing_score=60,
        is_published=True,
    )


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def auth_client(client, admin_user):
    client.force_authenticate(user=admin_user)
    return client


@pytest.fixture
def teacher_client(client, teacher):
    client.force_authenticate(user=teacher)
    return client


@pytest.fixture
def student_client(client, student):
    client.force_authenticate(user=student)
    return client


@pytest.fixture
def parent_client(client, parent_user):
    client.force_authenticate(user=parent_user)
    return client
