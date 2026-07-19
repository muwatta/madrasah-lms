import pytest
from rest_framework import status


@pytest.mark.django_db
class TestQuestions:
    def test_list_questions(self, auth_client, question):
        response = auth_client.get('/api/questions/')
        assert response.status_code == status.HTTP_200_OK

    def test_create_question(self, teacher_client, topic):
        response = teacher_client.post('/api/questions/', {
            'topic': topic.id,
            'question_text': 'What is Tawheed?',
            'question_type': 'short_answer',
            'correct_answer': 'Monotheism',
            'explanation': 'The oneness of Allah',
            'difficulty': 'medium',
        })
        assert response.status_code == status.HTTP_201_CREATED

    def test_question_search(self, auth_client, question):
        response = auth_client.get('/api/questions/', {'search': 'first'})
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestQuizzes:
    def test_list_quizzes(self, auth_client, quiz):
        response = auth_client.get('/api/quizzes/')
        assert response.status_code == status.HTTP_200_OK

    def test_create_quiz(self, teacher_client, subject, question):
        response = teacher_client.post('/api/quizzes/', {
            'subject': subject.id,
            'title': 'New Quiz',
            'description': 'A new quiz',
            'question_ids': [question.id],
            'quiz_type': 'practice',
            'passing_score': 60,
        })
        assert response.status_code == status.HTTP_201_CREATED

    def test_publish_quiz(self, teacher_client, quiz):
        response = teacher_client.post(f'/api/quizzes/{quiz.id}/publish/')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestQuizAttempts:
    def test_start_quiz(self, student_client, quiz):
        response = student_client.post('/api/quiz-attempts/', {'quiz': quiz.id})
        assert response.status_code == status.HTTP_201_CREATED

    def test_submit_quiz(self, student_client, quiz):
        start = student_client.post('/api/quiz-attempts/', {'quiz': quiz.id})
        attempt_id = start.data['id']
        response = student_client.put(f'/api/quiz-attempts/{attempt_id}/submit/', {
            'answers': {str(quiz.question_ids[0]): 'Al-Fatiha'}
        })
        assert response.status_code == status.HTTP_200_OK
        assert 'grading' in response.data
        assert response.data['grading']['percentage'] == 100.0

    def test_submit_wrong_answer(self, student_client, quiz):
        start = student_client.post('/api/quiz-attempts/', {'quiz': quiz.id})
        attempt_id = start.data['id']
        response = student_client.put(f'/api/quiz-attempts/{attempt_id}/submit/', {
            'answers': {str(quiz.question_ids[0]): 'Al-Baqarah'}
        })
        assert response.status_code == status.HTTP_200_OK
        assert response.data['grading']['percentage'] == 0.0
