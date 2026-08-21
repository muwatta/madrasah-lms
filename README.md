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
| Backend | Django 4.2 + Django REST Framework + Gunicorn |
| Frontend | React 18 + TypeScript + Tailwind CSS + Vite + Nginx |
| Database | PostgreSQL 15 |
| Cache/Queue | Redis 7 + Celery |
| Auth | JWT (PyJWT) |
| Charts | Recharts |
| Tests | Pytest + pytest-django |

## Project Structure

```
madrasah_lms/
├── backend/
│   ├── config/          # Django settings, URLs, WSGI
│   ├── users/           # User model, JWT auth, roles, messaging
│   ├── curriculum/      # Subjects, Topics, Classes, Class Subjects, Enrollments
│   ├── academic/        # Sessions, Terms, Class arms, Timetables, Calendar events
│   ├── assessments/     # Questions, Quizzes, Attempts, Auto-grading
│   ├── quizzes/         # Quiz engine, attempts, proctoring, analytics
│   ├── question_banks/  # Reusable question banks
│   ├── results/         # Subject results, report cards, exports, grade scales
│   ├── lessons/         # Lesson plans, schemes of work, homework, AI generation
│   ├── school_ops/      # Attendance (QR), fees, announcements, notifications
│   ├── fasaaha/         # Gamified Arabic learning platform
│   ├── quran/           # Quran memorization, revision, tajwid tracking
│   ├── learning/        # Learning paths, flashcards
│   ├── guidance/        # AI tutor, career guidance
│   ├── character/       # Character evaluations
│   ├── analytics/       # At-risk students, portfolios, teacher workload
│   ├── admissions/      # Applications, documents, enrollment
│   ├── certificates/    # Certificate & report card PDF generation
│   ├── whatsapp/        # WhatsApp Cloud API integration
│   ├── audit/           # Audit logs
│   ├── search/          # Global search
│   ├── tests/           # pytest test suite
│   └── manage.py
├── frontend/
│   └── src/
│       ├── api/         # Axios client, API functions, fetchAllPages
│       ├── components/  # Layout, ProtectedRoute, StatCard
│       ├── context/     # AuthContext (JWT management)
│       ├── hooks/       # useQuiz, useQuestionBanks, useFasaaha, useExport
│       ├── i18n/        # Arabic/English translations, RTL
│       ├── pages/       # Role-based page components
│       │   ├── auth/    # Login, Register, Password reset
│       │   ├── student/ # Dashboard, Quizzes, Learning paths
│       │   ├── teacher/ # Dashboard, Quizzes, Results, Lessons
│       │   ├── parent/  # Child progress
│       │   ├── admin/   # Users, Subjects, Enrollments, Exams, Finance
│       │   ├── board/   # Institutional metrics
│       │   ├── shared/  # Shared pages
│       │   └── public/  # Public pages
│       └── types/       # TypeScript type definitions
├── docker-compose.yml   # Full stack: PostgreSQL, Redis, backend, worker, beat, frontend
└── .gitignore
```

## Quick Start

### Prerequisites
- Python 3.12, Node.js 18+, PostgreSQL 15

### 1. Start PostgreSQL

```bash
docker compose up -d db redis
```

> The `db` and `redis` containers have no restart policy, so re-run this after a host or Docker reboot before starting the backend.

### 2. Backend

```bash
cd backend
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data   # Creates demo users, 31 subjects, 240 class-subject links, enrollments
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

All endpoints are served under `http://localhost:8000/api/v1`. List endpoints are paginated (20 records per page) and return a `next` link — the frontend follows `next` to load every record (`fetchAllPages` in `src/api/client.ts`).

### Authentication (`/auth`)
- `POST /auth/register/` - Register user
- `POST /auth/login/` - Login (returns JWT)
- `POST /auth/refresh-token/` - Refresh JWT
- `GET /auth/me/` - Current user profile
- `POST /auth/change-password/` - Change password
- `POST /auth/password-reset/` + `/auth/password-reset/confirm/` - Email password reset
- `POST /auth/verify-email/` + `/auth/verify-email/confirm/` - Email verification

### Users (`/users`)
- `GET/POST /users/` - List/create users
- `GET/PUT/DELETE /users/<id>/` - User detail
- `POST /users/create/` - Admin creates a user
- `POST /users/<id>/approve/` - Approve pending user
- `GET /users/messages/` + `unread-count/` - Teacher-parent messaging
- `POST /users/bulk-import/`, `GET /users/export/` - Bulk import/export

### Curriculum (`/curriculum`)
- `GET/POST /curriculum/` - List/create subjects (all with topic counts)
- `GET/PUT/DELETE /curriculum/<id>/` - Subject detail
- `GET/POST /curriculum/<subject_id>/topics/` - List/create topics
- `GET/POST /curriculum/classes/` - School classes
- `GET/POST /curriculum/class-subjects/?school_class=<id>` - Subjects attached to each class
- `DELETE /curriculum/class-subjects/<id>/` - Detach (also cleans up enrollments)

### Enrollments (`/enrollments`)
- `GET/POST /enrollments/?student=&subject=&school_class=&ustaadh=` - List/create enrollments
- `GET /enrollments/my/` - Student's own enrollments
- `GET /enrollments/teacher/students/` - Teacher's students (grouped)
- `GET /enrollments/teacher/classes/` - Classes a teacher teaches
- `GET /enrollments/class-teacher/classes/` - Classes a teacher leads
- Enrollments are validated against the class's attached subjects.

### Assessments & Quizzes (`/assessments`, `/quizzes`)
- `GET/POST /assessments/questions/` + `bulk-upload/` - Question bank
- `GET/POST /assessments/quizzes/`, `POST /quizzes/<id>/publish/` - Quizzes
- `POST /quizzes/start/`, `PUT /quizzes/attempt/<uuid>/submit/` - Quiz attempts
- `GET /assessments/my-attempts/`, `GET /quizzes/my-results/` - Student results
- `GET /quizzes/<id>/stats/`, `analysis/`, `violations/` - Quiz analytics
- `POST /assessments/generate-questions/` - AI question generation
- `GET/POST /question-banks/`, `POST /question-banks/<id>/convert/` - Reusable banks

### Results (`/results`)
- `GET /results/teacher/subjects/`, `POST /results/teacher/submit/` - Teacher result entry
- `POST /results/bulk-scores/<assessment_id>/` - Bulk score upload
- `GET /results/my-results/`, `GET /results/child-results/` - Student/parent views
- `GET/POST /results/templates/` + `components/` - Result templates
- `POST /results/subject-results/<id>/approve|publish|submit/` - Approval workflow
- `GET /results/report-cards/<uuid>/pdf/` - PDF report cards
- `GET /results/export/students/`, `export/quizzes/<id>/`, `export/exams/<id>/` - CSV export

### School Operations (`/school`)
- `GET/POST /school/attendance/`, `bulk/`, `scan/`, `qr/class/<id>/` - Attendance (QR + manual)
- `GET/POST /school/fees/`, `POST /school/fees/<id>/pay/` - Fee tracking
- `GET/POST /school/announcements/` - Announcements
- `GET /school/notifications/`, `unread-count/`, `mark-read/<id>/` - Notifications
- `POST /school/push/subscribe/` - Web push notifications

### Academic (`/academic`)
- `GET/POST /academic/sessions/`, `terms/`, `class-arms/` - Academic structure
- `GET/POST /academic/timetables/`, `generate/`, `detect_conflicts/`, `slots/` - Timetables
- `GET /academic/student/timetable/`, `/teacher/timetable/` - Role timetables
- `GET/POST /academic/calendar-events/` - Calendar

### Lessons (`/lessons`)
- `GET/POST /lessons/lesson-plans/`, `<id>/approve|submit/` - Lesson plans
- `GET/POST /lessons/schemes/` - Schemes of work
- `GET/POST /lessons/homework/`, `submissions/<id>/grade/` - Homework
- `POST /lessons/ai/generate-lesson-plan/`, `generate-scheme/`, `generate-homework/` - AI generation

### Learning & Quran (`/learning`, `/quran`)
- `GET/POST /learning/decks/`, `decks/<id>/cards/due/` - Flashcards
- `GET/POST /learning/paths/`, `paths/generate/` - Learning paths
- `GET/POST /quran/memorization/`, `revision/`, `tajwid/` - Quran tracking

### Fasaaha (`/fasaaha`)
- `GET/POST /fasaaha/levels/`, `missions/`, `attempts/` - Gamified Arabic learning
- `GET /fasaaha/dialogues/start/`, `dialogues/<uuid>/turn/` - Conversation practice
- `GET /fasaaha/leaderboard/`, `badges/`, `progress/streak/` - Gamification
- `GET /fasaaha/analytics/class/`, `analytics/school/` - Analytics

### Other
- `GET/POST /guidance/tutor/ask/` - AI tutor
- `GET/POST /certificates/`, `<id>/download/` - Certificates (PDF)
- `POST /whatsapp/webhook/`, `/whatsapp/send/` - WhatsApp integration
- `GET /search/?q=` - Global search
- `GET /dashboard/<role>/` - Role dashboards (admin, teacher, student, parent, board)
- `GET /health/` - Health check
- `GET /public/stats/` - Public stats

### Dashboards
- `GET /dashboard/teacher/` - Teacher: class overview, subject performance
- `GET /dashboard/teacher/student/<id>/performance/` - Teacher: individual student
- `GET /dashboard/parent/` - Parent: children's progress
- `GET /dashboard/admin/` - Admin: system overview
- `GET /dashboard/board/` - Board: institutional metrics

## Running Tests

```bash
cd backend
source venv/bin/activate
python -m pytest tests/ fasaaha/ -v
```

184 tests covering: authentication, curriculum, class subjects, enrollments (validation + query efficiency), assessments, quiz auto-grading, question banks, results, dashboards, fasaaha, and more. One known pre-existing failure in question-bank conversion (`quiz_type` varchar(10) truncation) is unrelated to recent changes.

## Production Deployment

Use the production compose profile only behind a TLS-terminating load balancer or reverse proxy:

```bash
cp backend/.env.production.example backend/.env.production
# Replace every placeholder with environment-specific values.
docker compose --env-file backend/.env.production -f docker-compose.production.yml up -d --build
```

The production profile does not publish PostgreSQL or Redis ports. Store database and media volumes on durable encrypted storage, restrict access to the host firewall, and schedule tested PostgreSQL backups outside Docker. Keep `backend/.env.production` out of source control and rotate application, database, Redis, JWT, and integration credentials independently.

Before accepting traffic, verify `GET /health/`, HTTPS redirect behavior, the configured host/origin allowlists, backup restoration, Celery worker execution, and error/metric alerting at the infrastructure layer.

## What's Built

- [x] JWT authentication with 5 role-based portals
- [x] Question bank with 4 question types (MCQ, fill-blank, short-answer, essay)
- [x] Quiz creation, publishing, and taking interface
- [x] Automatic grading for MCQ, fill-blank, short-answer
- [x] Timer support for timed quizzes
- [x] Teacher dashboard with class performance charts
- [x] Student dashboard with quiz history and score trends
- [x] Parent dashboard showing linked children's progress
- [x] Admin dashboard with user/subject/enrollment management
- [x] Class subjects & enrollment management (subjects attached per class, validated enrollments)
- [x] Board dashboard with teacher effectiveness rankings
- [x] Exam results recording (individual + bulk upload)
- [x] Subject results workflow (submit, approve, publish, reject) with report card PDFs
- [x] CSV/JSON data export
- [x] Mobile-responsive UI
- [x] Seed data command for demo setup (demo users, 31 subjects, 240 class-subject links)
- [x] Multi-language support (Arabic RTL with full translations)
- [x] Notifications and alerts with unread badge
- [x] Attendance tracking (QR + manual + camera)
- [x] AI-powered tutor (OpenAI integration)
- [x] Teacher-parent-student messaging
- [x] WhatsApp Cloud API integration (opt-in, templates, notifications)
- [x] Character evaluation for students
- [x] QR code attendance scanning (generate + scan)
- [x] Parent WhatsApp self-service opt-in page
- [x] Student learning path and flashcards
- [x] Career guidance and prayer times
- [x] Email service (Resend.com) for password reset & verification
- [x] Auto-generated timetables with conflict detection
- [x] Homework with submissions and grading
- [x] Lesson plans, schemes of work, and AI-assisted generation
- [x] Certificates and report cards (PDF)
- [x] Fasaaha gamified Arabic learning (levels, missions, dialogue practice, badges, streaks)
- [x] Quran memorization, revision, and tajwid tracking
- [x] At-risk analytics, student portfolios, and teacher workload
- [x] Admissions applications with documents and enrollment
- [x] Fee tracking with payments and analytics
- [x] Audit logs and global search
- [x] Web push notifications (VAPID)
- [x] Docker Compose full stack (PostgreSQL, Redis, Gunicorn, Celery, Nginx)
- [x] 184 pytest tests

## What's Left

- [ ] Rich text editor for essay questions
- [ ] Online payment gateway integration for fees
- [ ] Mobile app (iOS/Android)

## Security Features

- JWT authentication with token refresh
- Role-based access control on all endpoints
- Madrasah-level data isolation (users can only access their own institution's data)
- Input validation on all serializers
- Protected routes on frontend with role-based navigation
