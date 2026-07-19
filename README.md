# Madrasah LMS

Learning Management System for Islamic schools (Madrasahs) in West Africa.

## Features

- **Quiz Module**: Create, manage, take quizzes with auto-grading
- **Teacher Dashboard**: Class performance analytics
- **Parent Portal**: Track child's progress
- **Exam Results**: Record and view exam scores
- **Multi-role**: Ustaadh, Mudeer, Idaarah, Student, Parent

## Tech Stack

- **Backend**: Django 4.2 + Django REST Framework
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Database**: PostgreSQL 15
- **Auth**: JWT (PyJWT)

## Quick Start

```bash
# Start database
docker-compose up -d

# Backend
cd backend
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend
cd frontend
npm install
npm start
```

## User Roles

| Role | Description |
|------|-------------|
| Ustaadh | Teacher - creates quizzes, views class performance |
| Mudeer | Admin - manages users, subjects, settings |
| Idaarah | Board - high-level institutional metrics |
| Student | Takes quizzes, views scores |
| Parent | Views child's progress |
