# Madrasah LMS

Learning Management System for Islamic schools (Madrasahs) in West Africa.

## What It Does

- **Teachers** create quizzes from a question bank, view class performance dashboards
- **Students** take quizzes, get auto-graded (MCQ, fill-blank, short-answer), see results
- **Parents** view their children's quiz scores, exam results, and performance trends
- **Administrators** manage users, subjects, enrollments, and exams
- **Board members** view institutional metrics and teacher effectiveness

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django 4.2 + Django REST Framework |
| Frontend | React 18 + TypeScript + Tailwind CSS + Vite |
| Database | PostgreSQL 15 (SQLite fallback for dev) |
| Auth | JWT (PyJWT) |
| Charts | Recharts |
| Tests | Pytest + pytest-django |

## Project Structure

```
madrasah_lms/
├── backend/
│   ├── config/          # Django settings, URLs, WSGI
│   ├── users/           # User model, JWT auth, roles
│   ├── curriculum/      # Subjects, Topics, Enrollments
│   ├── assessments/     # Questions, Quizzes, Auto-grading
│   ├── results/         # Exams, Dashboards, Export
│   └── tests/           # 24 pytest tests
├── frontend/
│   └── src/
│       ├── api/         # Axios client, API functions
│       ├── components/  # Layout, ProtectedRoute, StatCard
│       ├── context/     # AuthContext (JWT management)
│       ├── pages/       # Role-based page components
│       │   ├── auth/    # Login, Register
│       │   ├── student/ # Dashboard, Quiz list/take/results
│       │   ├── teacher/ # Dashboard, Quizzes, Questions, Students
│       │   ├── parent/  # Dashboard (child progress)
│       │   ├── admin/   # Dashboard, Users, Subjects, Enrollments, Exams
│       │   └── board/   # Dashboard (institutional metrics)
│       └── types/       # TypeScript type definitions
├── docker-compose.yml   # PostgreSQL container
└── .gitignore
```

## Quick Start

### Prerequisites
- Python 3.12
- Node.js 18+
- Docker (for PostgreSQL, optional)

### 1. Start Database (PostgreSQL via Docker)

```bash
docker-compose up -d
```

Or use SQLite (automatic fallback if PostgreSQL isn't running).

### 2. Backend

```bash
cd backend
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data   # Creates demo data
python manage.py runserver    # http://localhost:8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev    # http://localhost:3000
```

### 4. Login with Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Administrator (Mudeer) | admin@madrasah.com | admin123 |
| Teacher (Ustaadh) | teacher@madrasah.com | teacher123 |
| Student | student1@madrasah.com | student123 |
| Student | student2@madrasah.com | student123 |
| Parent | parent@madrasah.com | parent123 |
| Board (Idaarah) | board@madrasah.com | board123 |

## User Roles

| Role | Term | Capabilities |
|------|------|-------------|
| Ustaadh | Teacher | Create quizzes, manage question bank, view class performance |
| Mudeer | Administrator | Manage users, subjects, enrollments, exams, system settings |
| Idaarah | Board | View institutional metrics, teacher effectiveness rankings |
| Student | Student | Take quizzes, view scores and progress |
| Parent | Parent | View child's quiz/exam scores and performance trends |

## API Endpoints

### Authentication
- `POST /api/auth/register/` - Register user
- `POST /api/auth/login/` - Login (returns JWT)
- `POST /api/auth/refresh-token/` - Refresh JWT
- `GET /api/auth/me/` - Current user profile

### Curriculum
- `GET/POST /api/subjects/` - List/create subjects
- `GET/PUT/DELETE /api/subjects/<id>/` - Subject detail
- `GET/POST /api/subjects/<id>/topics/` - List/create topics for subject

### Assessments
- `GET/POST /api/questions/` - List/create questions (filter: `?ids=`, `?topic=`, `?type=`, `?difficulty=`, `?search=`)
- `GET/PUT/DELETE /api/questions/<id>/` - Question detail
- `GET/POST /api/quizzes/` - List/create quizzes
- `POST /api/quizzes/<id>/publish/` - Toggle publish
- `POST /api/quiz-attempts/` - Start quiz attempt
- `PUT /api/quiz-attempts/<id>/submit/` - Submit answers (auto-graded)
- `GET /api/quiz-attempts/<id>/` - View attempt results

### Exams
- `GET/POST /api/exams/` - List/create exams
- `GET/POST /api/exams/<id>/results/` - View/record exam results
- `POST /api/exams/<id>/results/bulk/` - Bulk upload results
- `GET /api/student/exams/` - Student's exam results

### Dashboards
- `GET /api/teacher/dashboard/` - Teacher: class overview, subject performance
- `GET /api/teacher/student/<id>/performance/` - Teacher: individual student
- `GET /api/parent/dashboard/` - Parent: children's progress
- `GET /api/admin/dashboard/` - Admin: system overview
- `GET /api/board/dashboard/` - Board: institutional metrics

### Data Export
- `GET /api/export/students/?format=csv` - Export student performance
- `GET /api/export/quiz/<id>/?format=csv` - Export quiz results
- `GET /api/export/exam/<id>/?format=csv` - Export exam results

## Running Tests

```bash
cd backend
source venv/bin/activate
python -m pytest tests/ -v
```

24 tests covering: authentication, curriculum, assessments, quiz auto-grading, dashboards.

## What's Built (MVP Complete)

- [x] JWT authentication with 5 role-based portals
- [x] Question bank with 4 question types (MCQ, fill-blank, short-answer, essay)
- [x] Quiz creation, publishing, and taking interface
- [x] Automatic grading for MCQ, fill-blank, short-answer
- [x] Timer support for timed quizzes
- [x] Teacher dashboard with class performance charts
- [x] Student dashboard with quiz history and score trends
- [x] Parent dashboard showing linked children's progress
- [x] Admin dashboard with user/subject/enrollment management
- [x] Board dashboard with teacher effectiveness rankings
- [x] Exam results recording (individual + bulk upload)
- [x] CSV/JSON data export
- [x] Mobile-responsive UI
- [x] 24 passing tests
- [x] Seed data command for demo setup

## What's Left (Phase 2)

- [ ] Password reset / email verification flow
- [ ] Change password page
- [ ] Assignments with file uploads
- [ ] Rich text editor for essay questions
- [ ] Notifications and alerts
- [ ] Teacher-parent messaging
- [ ] Attendance tracking
- [ ] Certificate generation
- [ ] Scheduling and calendar integration
- [ ] Multi-language support (Arabic RTL)
- [ ] Mobile app (iOS/Android)
- [ ] AI-powered recommendations

## Security Features

- JWT authentication with token refresh
- Role-based access control on all endpoints
- Madrasah-level data isolation (users can only access their own institution's data)
- Input validation on all serializers
- Protected routes on frontend with role-based navigation
