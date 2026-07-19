import pytest
from rest_framework import status


@pytest.mark.django_db
class TestSubjects:
    def test_list_subjects(self, auth_client, subject):
        response = auth_client.get('/api/subjects/')
        assert response.status_code == status.HTTP_200_OK

    def test_create_subject(self, auth_client, madrasah):
        response = auth_client.post('/api/subjects/', {
            'name': 'Fiqh',
            'description': 'Islamic jurisprudence',
            'level': 'intermediate',
        })
        assert response.status_code == status.HTTP_201_CREATED

    def test_get_subject_detail(self, auth_client, subject):
        response = auth_client.get(f'/api/subjects/{subject.id}/')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestTopics:
    def test_list_topics(self, auth_client, topic, subject):
        response = auth_client.get(f'/api/subjects/{subject.id}/topics/')
        assert response.status_code == status.HTTP_200_OK

    def test_create_topic(self, auth_client, subject):
        response = auth_client.post(f'/api/subjects/{subject.id}/topics/', {
            'name': 'Surah Al-Baqarah',
            'description': 'Second Surah',
        })
        assert response.status_code == status.HTTP_201_CREATED
