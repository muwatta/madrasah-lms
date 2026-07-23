# Mothera LMS — API Documentation

**Version:** 1.0
**Base URL:** `/api/v1/`
**Content-Type:** `application/json` (unless otherwise noted)
**Authentication:** JWT Bearer Token

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Users](#2-users)
3. [Curriculum](#3-curriculum)
4. [Assessments](#4-assessments)
5. [Results](#5-results)
6. [Attendance](#6-attendance)
7. [Fasaaha](#7-fasaaha)
8. [AI Services](#8-ai-services)

---

## 1. Authentication

All API requests (except login and register) require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

### POST /api/v1/auth/login/

Authenticate a user and receive JWT tokens.

**Auth Required:** No

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "first_name": "Ahmed",
    "last_name": "Hassan",
    "role": "student",
    "school": {
      "id": "uuid-string",
      "name": "Al-Falah Academy"
    }
  }
}
```

**Error Responses:**
- `400 Bad Request` — Missing email or password
- `401 Unauthorized` — Invalid credentials
- `400 Bad Request` — Account not verified

---

### POST /api/v1/auth/register/

Register a new user account.

**Auth Required:** No

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "securepassword123",
  "password_confirm": "securepassword123",
  "first_name": "Ahmed",
  "last_name": "Hassan",
  "role": "student",
  "school_id": "uuid-string"
}
```

**Response (201 Created):**
```json
{
  "message": "Registration successful. Please check your email for verification.",
  "user": {
    "id": "uuid-string",
    "email": "newuser@example.com",
    "first_name": "Ahmed",
    "last_name": "Hassan",
    "role": "student",
    "is_active": false
  }
}
```

**Error Responses:**
- `400 Bad Request` — Passwords don't match
- `400 Bad Request` — Email already exists
- `400 Bad Request` — Invalid school_id

---

### POST /api/v1/auth/token/refresh/

Refresh an expired access token.

**Auth Required:** No

**Request Body:**
```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `401 Unauthorized` — Invalid or expired refresh token

---

### GET /api/v1/auth/me/

Get the currently authenticated user's profile.

**Auth Required:** Yes

**Response (200 OK):**
```json
{
  "id": "uuid-string",
  "email": "user@example.com",
  "first_name": "Ahmed",
  "last_name": "Hassan",
  "role": "student",
  "is_active": true,
  "school": {
    "id": "uuid-string",
    "name": "Al-Falah Academy"
  },
  "date_joined": "2026-01-15T10:30:00Z",
  "last_login": "2026-07-20T08:15:00Z"
}
```

---

## 2. Users

### GET /api/v1/users/

List all users in the school.

**Auth Required:** Yes (admin, teacher)
**Query Parameters:**
- `role` — Filter by role (student, teacher, admin, parent)
- `search` — Search by name or email
- `page` — Page number (default: 1)
- `page_size` — Results per page (default: 20, max: 100)

**Response (200 OK):**
```json
{
  "count": 150,
  "next": "/api/v1/users/?page=2",
  "previous": null,
  "results": [
    {
      "id": "uuid-string",
      "email": "student@example.com",
      "first_name": "Ahmed",
      "last_name": "Hassan",
      "role": "student",
      "is_active": true,
      "date_joined": "2026-01-15T10:30:00Z"
    }
  ]
}
```

---

### POST /api/v1/users/

Create a new user.

**Auth Required:** Yes (admin)

**Request Body:**
```json
{
  "email": "newteacher@example.com",
  "password": "temporarypass123",
  "first_name": "Fatima",
  "last_name": "Ali",
  "role": "teacher",
  "phone": "+2348012345678",
  "gender": "female"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid-string",
  "email": "newteacher@example.com",
  "first_name": "Fatima",
  "last_name": "Ali",
  "role": "teacher",
  "is_active": true
}
```

---

### PUT /api/v1/users/{id}/

Update an existing user.

**Auth Required:** Yes (admin, or self)

**Request Body:**
```json
{
  "first_name": "Ahmed",
  "last_name": "Hassan Updated",
  "phone": "+2348098765432",
  "is_active": true
}
```

**Response (200 OK):**
```json
{
  "id": "uuid-string",
  "email": "student@example.com",
  "first_name": "Ahmed",
  "last_name": "Hassan Updated",
  "phone": "+2348098765432",
  "role": "student",
  "is_active": true
}
```

---

### DELETE /api/v1/users/{id}/

Delete a user (soft delete — marks as inactive).

**Auth Required:** Yes (admin)

**Response (204 No Content):**
No response body.

**Error Responses:**
- `403 Forbidden` — Cannot delete your own account
- `404 Not Found` — User not found

---

## 3. Curriculum

### GET /api/v1/curriculum/subjects/

List all subjects for the school.

**Auth Required:** Yes
**Query Parameters:**
- `grade_level` — Filter by grade level

**Response (200 OK):**
```json
{
  "count": 12,
  "results": [
    {
      "id": "uuid-string",
      "name": "Quran Studies",
      "name_arabic": "علوم القرآن",
      "code": "QUR101",
      "grade_level": "grade_5",
      "description": "Quran recitation, memorization, and tafsir",
      "topics_count": 24,
      "created_at": "2026-01-15T10:30:00Z"
    }
  ]
}
```

---

### POST /api/v1/curriculum/subjects/

Create a new subject.

**Auth Required:** Yes (admin)

**Request Body:**
```json
{
  "name": "Islamic Studies",
  "name_arabic": "الدراسات الإسلامية",
  "code": "ISL101",
  "grade_level": "grade_3",
  "description": "Core Islamic education covering aqeedah, fiqh, and seerah"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid-string",
  "name": "Islamic Studies",
  "name_arabic": "الدراسات الإسلامية",
  "code": "ISL101",
  "grade_level": "grade_3",
  "description": "Core Islamic education covering aqeedah, fiqh, and seerah",
  "created_at": "2026-07-20T10:30:00Z"
}
```

---

### PUT /api/v1/curriculum/subjects/{id}/

Update a subject.

**Auth Required:** Yes (admin)

**Request Body:**
```json
{
  "description": "Updated description for Islamic Studies"
}
```

**Response (200 OK):** Updated subject object.

---

### DELETE /api/v1/curriculum/subjects/{id}/

Delete a subject.

**Auth Required:** Yes (admin)

**Response (204 No Content)**

---

### GET /api/v1/curriculum/subjects/{id}/topics/

List all topics for a subject.

**Auth Required:** Yes

**Response (200 OK):**
```json
{
  "count": 24,
  "results": [
    {
      "id": "uuid-string",
      "name": "Surah Al-Fatiha",
      "name_arabic": "سورة الفاتحة",
      "subject": "uuid-string",
      "order": 1,
      "description": "Memorization and tafsir of Surah Al-Fatiha",
      "difficulty_level": "beginner",
      "quizzes_count": 3,
      "created_at": "2026-01-15T10:30:00Z"
    }
  ]
}
```

---

### POST /api/v1/curriculum/subjects/{id}/topics/

Create a new topic.

**Auth Required:** Yes (admin, teacher)

**Request Body:**
```json
{
  "name": "Surah Al-Baqarah (Part 1)",
  "name_arabic": "سورة البقرة (الجزء الأول)",
  "order": 2,
  "description": "Memorization and tafsir of first juz of Surah Al-Baqarah",
  "difficulty_level": "intermediate"
}
```

**Response (201 Created):** Created topic object.

---

### PUT /api/v1/curriculum/subjects/{id}/topics/{topic_id}/

Update a topic.

**Auth Required:** Yes (admin, teacher)

**Request Body:** Partial topic fields to update.

**Response (200 OK):** Updated topic object.

---

### DELETE /api/v1/curriculum/subjects/{id}/topics/{topic_id}/

Delete a topic.

**Auth Required:** Yes (admin, teacher)

**Response (204 No Content)**

---

## 4. Assessments

### GET /api/v1/assessments/quizzes/

List all quizzes.

**Auth Required:** Yes
**Query Parameters:**
- `subject` — Filter by subject ID
- `topic` — Filter by topic ID
- `status` — Filter by status (draft, published, archived)
- `page` — Page number

**Response (200 OK):**
```json
{
  "count": 45,
  "results": [
    {
      "id": "uuid-string",
      "title": "Surah Al-Fatiha Quiz",
      "title_arabic": "اختبار سورة الفاتحة",
      "subject": {
        "id": "uuid-string",
        "name": "Quran Studies"
      },
      "topic": {
        "id": "uuid-string",
        "name": "Surah Al-Fatiha"
      },
      "question_count": 10,
      "duration_minutes": 20,
      "total_marks": 20,
      "passing_marks": 12,
      "status": "published",
      "shuffle_questions": true,
      "show_answers": true,
      "deadline": "2026-08-01T23:59:59Z",
      "attempts_count": 35,
      "average_score": 72.5,
      "created_by": {
        "id": "uuid-string",
        "name": "Ustadh Ibrahim"
      },
      "created_at": "2026-07-15T10:30:00Z"
    }
  ]
}
```

---

### POST /api/v1/assessments/quizzes/

Create a new quiz.

**Auth Required:** Yes (admin, teacher)

**Request Body:**
```json
{
  "title": "Surah Al-Baqarah Quiz 1",
  "title_arabic": "اختبار سورة البقرة 1",
  "subject_id": "uuid-string",
  "topic_id": "uuid-string",
  "duration_minutes": 30,
  "total_marks": 30,
  "passing_marks": 18,
  "shuffle_questions": true,
  "show_answers": true,
  "deadline": "2026-08-15T23:59:59Z",
  "instructions": "Answer all questions. You have 30 minutes.",
  "instructions_arabic": "أجب عن جميع الأسئلة. لديك 30 دقيقة."
}
```

**Response (201 Created):** Created quiz object with `status: "draft"`.

---

### GET /api/v1/assessments/quizzes/{id}/

Get quiz details including questions.

**Auth Required:** Yes

**Response (200 OK):**
```json
{
  "id": "uuid-string",
  "title": "Surah Al-Fatiha Quiz",
  "subject": { "id": "uuid-string", "name": "Quran Studies" },
  "topic": { "id": "uuid-string", "name": "Surah Al-Fatiha" },
  "questions": [
    {
      "id": "uuid-string",
      "type": "mcq",
      "question_text": "What is the first ayah of Surah Al-Fatiha?",
      "question_text_arabic": "ما هي أول آية في سورة الفاتحة؟",
      "options": [
        { "key": "A", "text": "بسم الله الرحمن الرحيم" },
        { "key": "B", "text": "الحمد لله رب العالمين" },
        { "key": "C", "text": "مالك يوم الدين" },
        { "key": "D", "text": "إياك نعبد وإياك نستعين" }
      ],
      "correct_answer": "A",
      "marks": 2,
      "order": 1
    }
  ],
  "status": "published",
  "duration_minutes": 20,
  "total_marks": 20
}
```

---

### PUT /api/v1/assessments/quizzes/{id}/

Update quiz details.

**Auth Required:** Yes (admin, teacher — creator only)

**Request Body:** Partial quiz fields to update.

**Response (200 OK):** Updated quiz object.

---

### DELETE /api/v1/assessments/quizzes/{id}/

Delete a quiz.

**Auth Required:** Yes (admin, teacher — creator only)

**Response (204 No Content)**

---

### POST /api/v1/assessments/quizzes/{id}/publish/

Publish a draft quiz, making it available to students.

**Auth Required:** Yes (admin, teacher — creator only)

**Response (200 OK):**
```json
{
  "message": "Quiz published successfully",
  "quiz": {
    "id": "uuid-string",
    "status": "published",
    "published_at": "2026-07-20T14:00:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` — Quiz has no questions
- `400 Bad Request` — Quiz is already published

---

### GET /api/v1/assessments/questions/

List all questions in the question bank.

**Auth Required:** Yes (admin, teacher)
**Query Parameters:**
- `subject` — Filter by subject ID
- `topic` — Filter by topic ID
- `type` — Filter by type (mcq, fill_blank, short_answer, essay)
- `difficulty` — Filter by difficulty (easy, medium, hard)

**Response (200 OK):**
```json
{
  "count": 250,
  "results": [
    {
      "id": "uuid-string",
      "type": "mcq",
      "question_text": "Who was the first Caliph of Islam?",
      "question_text_arabic": "من كان أول خليفة في الإسلام؟",
      "options": [
        { "key": "A", "text": "Abu Bakr (RA)" },
        { "key": "B", "text": "Umar (RA)" },
        { "key": "C", "text": "Uthman (RA)" },
        { "key": "D", "text": "Ali (RA)" }
      ],
      "correct_answer": "A",
      "marks": 2,
      "difficulty": "easy",
      "subject": { "id": "uuid-string", "name": "Islamic History" },
      "topic": { "id": "uuid-string", "name": "The Rightly Guided Caliphs" },
      "created_at": "2026-07-10T10:30:00Z"
    }
  ]
}
```

---

### POST /api/v1/assessments/questions/

Create a new question.

**Auth Required:** Yes (admin, teacher)

**Request Body:**
```json
{
  "type": "mcq",
  "question_text": "What does 'Bismillah' mean?",
  "question_text_arabic": "ماذا يعني 'بسم الله'؟",
  "options": [
    { "key": "A", "text": "In the name of Allah" },
    { "key": "B", "text": "Praise be to Allah" },
    { "key": "C", "text": "Allah is greatest" },
    { "key": "D", "text": "There is no god but Allah" }
  ],
  "correct_answer": "A",
  "marks": 2,
  "difficulty": "easy",
  "subject_id": "uuid-string",
  "topic_id": "uuid-string",
  "explanation": "Bismillah means 'In the name of Allah' and is recited before starting many actions."
}
```

**Response (201 Created):** Created question object.

---

### POST /api/v1/assessments/quizzes/{id}/questions/

Add a question to a quiz.

**Auth Required:** Yes (admin, teacher — quiz creator)

**Request Body:** Same as POST /questions/ but linked to the quiz.

**Response (201 Created):** Created question linked to quiz.

---

### PUT /api/v1/assessments/questions/{id}/

Update a question.

**Auth Required:** Yes (admin, teacher)

**Request Body:** Partial question fields to update.

**Response (200 OK):** Updated question object.

---

### DELETE /api/v1/assessments/questions/{id}/

Delete a question.

**Auth Required:** Yes (admin, teacher)

**Response (204 No Content)**

---

### POST /api/v1/assessments/quiz-attempts/start/

Start a new quiz attempt.

**Auth Required:** Yes (student)

**Request Body:**
```json
{
  "quiz_id": "uuid-string"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid-string",
  "quiz": {
    "id": "uuid-string",
    "title": "Surah Al-Fatiha Quiz",
    "duration_minutes": 20,
    "questions": [
      {
        "id": "uuid-string",
        "type": "mcq",
        "question_text": "What is the first ayah of Surah Al-Fatiha?",
        "options": [
          { "key": "A", "text": "بسم الله الرحمن الرحيم" },
          { "key": "B", "text": "الحمد لله رب العالمين" },
          { "key": "C", "text": "مالك يوم الدين" },
          { "key": "D", "text": "إياك نعبد وإياك نستعين" }
        ],
        "marks": 2,
        "order": 1
      }
    ],
    "total_marks": 20
  },
  "started_at": "2026-07-20T10:00:00Z",
  "expires_at": "2026-07-20T10:20:00Z",
  "answers": []
}
```

**Error Responses:**
- `400 Bad Request` — Quiz not published
- `400 Bad Request` — Quiz deadline passed
- `400 Bad Request` — Already attempted (if single attempt)

---

### POST /api/v1/assessments/quiz-attempts/{id}/submit/

Submit a quiz attempt with answers.

**Auth Required:** Yes (student — must own the attempt)

**Request Body:**
```json
{
  "answers": [
    {
      "question_id": "uuid-string",
      "answer": "A"
    },
    {
      "question_id": "uuid-string",
      "answer": "The Prophet Muhammad (PBUH) was born in Makkah"
    },
    {
      "question_id": "uuid-string",
      "answer": "Al-Fatiha means The Opening"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "id": "uuid-string",
  "status": "completed",
  "score": 16,
  "total_marks": 20,
  "percentage": 80.0,
  "passed": true,
  "submitted_at": "2026-07-20T10:18:30Z",
  "time_taken_minutes": 18.5,
  "results": [
    {
      "question_id": "uuid-string",
      "answer": "A",
      "correct_answer": "A",
      "is_correct": true,
      "marks_awarded": 2,
      "marks_possible": 2,
      "explanation": "Correct! Al-Fatiha opens with Bismillah."
    }
  ]
}
```

---

## 5. Results

### GET /api/v1/results/exams/

List all exams.

**Auth Required:** Yes
**Query Parameters:**
- `subject` — Filter by subject ID
- `term` — Filter by term (first_term, second_term, third_term)
- `academic_year` — Filter by academic year (e.g., "2026-2027")

**Response (200 OK):**
```json
{
  "count": 8,
  "results": [
    {
      "id": "uuid-string",
      "name": "First Term Examination",
      "name_arabic": "اختبارات الفصل الأول",
      "subject": { "id": "uuid-string", "name": "Quran Studies" },
      "term": "first_term",
      "academic_year": "2026-2027",
      "total_marks": 100,
      "results_count": 45,
      "average_score": 68.5,
      "highest_score": 98,
      "lowest_score": 25,
      "status": "completed",
      "created_at": "2026-06-15T10:30:00Z"
    }
  ]
}
```

---

### POST /api/v1/results/exams/

Create a new exam.

**Auth Required:** Yes (admin)

**Request Body:**
```json
{
  "name": "Second Term Examination",
  "name_arabic": "اختبارات الفصل الثاني",
  "subject_id": "uuid-string",
  "term": "second_term",
  "academic_year": "2026-2027",
  "total_marks": 100
}
```

**Response (201 Created):** Created exam object.

---

### GET /api/v1/results/exams/{id}/

Get exam details.

**Auth Required:** Yes

**Response (200 OK):** Full exam object with metadata.

---

### PUT /api/v1/results/exams/{id}/

Update exam details.

**Auth Required:** Yes (admin)

**Request Body:** Partial exam fields.

**Response (200 OK):** Updated exam object.

---

### DELETE /api/v1/results/exams/{id}/

Delete an exam.

**Auth Required:** Yes (admin)

**Response (204 No Content)**

---

### GET /api/v1/results/exams/{id}/results/

Get all student results for an exam.

**Auth Required:** Yes (admin, teacher)
**Query Parameters:**
- `student` — Filter by student ID
- `grade` — Filter by grade level
- `sort` — Sort by (score, name, grade) — default: score desc

**Response (200 OK):**
```json
{
  "exam": {
    "id": "uuid-string",
    "name": "First Term Examination",
    "subject": "Quran Studies",
    "total_marks": 100
  },
  "summary": {
    "total_students": 45,
    "average_score": 68.5,
    "highest_score": 98,
    "lowest_score": 25,
    "pass_rate": 0.78,
    "grade_distribution": {
      "A": 8,
      "B": 12,
      "C": 10,
      "D": 7,
      "F": 8
    }
  },
  "results": [
    {
      "id": "uuid-string",
      "student": {
        "id": "uuid-string",
        "name": "Ahmed Hassan"
      },
      "score": 92,
      "grade": "A",
      "remark": "Excellent",
      "recorded_by": { "id": "uuid-string", "name": "Ustadh Ibrahim" },
      "recorded_at": "2026-06-20T14:30:00Z"
    }
  ]
}
```

---

### POST /api/v1/results/exams/{id}/record/

Record or update a student's result for an exam.

**Auth Required:** Yes (admin, teacher)

**Request Body:**
```json
{
  "student_id": "uuid-string",
  "score": 85,
  "grade": "B",
  "remark": "Very Good",
  "comments": "Good improvement in recitation"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid-string",
  "student": {
    "id": "uuid-string",
    "name": "Ahmed Hassan"
  },
  "score": 85,
  "grade": "B",
  "remark": "Very Good",
  "recorded_at": "2026-07-20T10:30:00Z"
}
```

---

### POST /api/v1/results/legacy-scores/bulk/

Bulk import legacy scores from CSV/spreadsheet.

**Auth Required:** Yes (admin)
**Content-Type:** `multipart/form-data`

**Request:**
- `file` — CSV file with columns: student_id, exam_id, score, grade
- `exam_id` — Target exam ID (optional, can be in CSV)

**Response (200 OK):**
```json
{
  "message": "Bulk import completed",
  "imported": 42,
  "skipped": 2,
  "errors": [
    {
      "row": 15,
      "student_id": "invalid-id",
      "error": "Student not found"
    }
  ]
}
```

---

## 6. Attendance

### GET /api/v1/school/attendance/

Get attendance records.

**Auth Required:** Yes (admin, teacher)
**Query Parameters:**
- `date` — Filter by date (YYYY-MM-DD)
- `student` — Filter by student ID
- `class` — Filter by class/grade
- `status` — Filter by status (present, absent, late, excused)
- `start_date` — Range start
- `end_date` — Range end
- `page` — Page number

**Response (200 OK):**
```json
{
  "count": 120,
  "summary": {
    "date": "2026-07-20",
    "total_students": 45,
    "present": 40,
    "absent": 3,
    "late": 2,
    "excused": 0,
    "attendance_rate": 0.89
  },
  "results": [
    {
      "id": "uuid-string",
      "student": {
        "id": "uuid-string",
        "name": "Ahmed Hassan",
        "student_id": "STU-001"
      },
      "date": "2026-07-20",
      "status": "present",
      "time_in": "08:00:00",
      "time_out": "14:00:00",
      "recorded_by": {
        "id": "uuid-string",
        "name": "Ustadh Ibrahim"
      },
      "notes": ""
    }
  ]
}
```

---

### POST /api/v1/school/attendance/bulk/

Record attendance for multiple students at once.

**Auth Required:** Yes (admin, teacher)

**Request Body:**
```json
{
  "date": "2026-07-20",
  "records": [
    {
      "student_id": "uuid-string",
      "status": "present",
      "time_in": "08:00:00",
      "notes": ""
    },
    {
      "student_id": "uuid-string",
      "status": "absent",
      "notes": "Parent called in sick"
    },
    {
      "student_id": "uuid-string",
      "status": "late",
      "time_in": "08:15:00",
      "notes": "Traffic"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "message": "Attendance recorded successfully",
  "date": "2026-07-20",
  "total_records": 45,
  "present": 40,
  "absent": 3,
  "late": 2
}
```

---

### POST /api/v1/school/attendance/qr/class/

Generate a QR code for class check-in.

**Auth Required:** Yes (teacher)

**Request Body:**
```json
{
  "class_id": "uuid-string",
  "duration_minutes": 15
}
```

**Response (201 Created):**
```json
{
  "qr_code_id": "uuid-string",
  "qr_code_url": "https://api.mothera.com/qr/uuid-string.png",
  "token": "abc123def456",
  "expires_at": "2026-07-20T08:15:00Z",
  "class": {
    "id": "uuid-string",
    "name": "Grade 5A"
  }
}
```

---

### POST /api/v1/school/attendance/qr/scan/

Student scans QR code to record attendance.

**Auth Required:** Yes (student)

**Request Body:**
```json
{
  "qr_code_id": "uuid-string",
  "token": "abc123def456"
}
```

**Response (200 OK):**
```json
{
  "message": "Attendance recorded",
  "status": "present",
  "time_in": "08:02:30",
  "student": {
    "id": "uuid-string",
    "name": "Ahmed Hassan"
  }
}
```

**Error Responses:**
- `400 Bad Request` — QR code expired
- `400 Bad Request` — Invalid token
- `400 Bad Request` — Not enrolled in this class

---

## 7. Fasaaha

### GET /api/v1/fasaaha/levels/

List all Fasaaha levels.

**Auth Required:** Yes

**Response (200 OK):**
```json
{
  "count": 10,
  "results": [
    {
      "id": 1,
      "name": "Al-Bidayah",
      "name_arabic": "البداية",
      "level_number": 1,
      "description": "Beginner level — basic greetings and self-introduction",
      "difficulty": "beginner",
      "categories_count": 5,
      "missions_count": 25,
      "estimated_duration_weeks": 4
    }
  ]
}
```

---

### POST /api/v1/fasaaha/levels/

Create a new level (admin only).

**Auth Required:** Yes (admin)

**Request Body:**
```json
{
  "name": "Al-Bidayah",
  "name_arabic": "البداية",
  "level_number": 1,
  "description": "Beginner level",
  "difficulty": "beginner",
  "estimated_duration_weeks": 4
}
```

**Response (201 Created):** Created level object.

---

### GET /api/v1/fasaaha/categories/

List all categories within a level.

**Auth Required:** Yes
**Query Parameters:**
- `level` — Level number (1-10)

**Response (200 OK):**
```json
{
  "count": 5,
  "results": [
    {
      "id": 1,
      "name": "Greetings",
      "name_arabic": "التحيات",
      "level": 1,
      "order": 1,
      "description": "Basic Arabic greetings and introductions",
      "missions_count": 5,
      "vocabulary_count": 20
    }
  ]
}
```

---

### POST /api/v1/fasaaha/categories/

Create a new category.

**Auth Required:** Yes (admin)

**Request Body:** Category fields.

**Response (201 Created):** Created category object.

---

### GET /api/v1/fasaaha/missions/

List all missions, optionally filtered by level/category.

**Auth Required:** Yes
**Query Parameters:**
- `level` — Level number
- `category` — Category ID
- `type` — Mission type (repeat, describe, retell, converse, complete, translate)

**Response (200 OK):**
```json
{
  "count": 25,
  "results": [
    {
      "id": 1,
      "title": "Say Hello",
      "title_arabic": "قل مرحباً",
      "category": { "id": 1, "name": "Greetings" },
      "level": 1,
      "type": "repeat",
      "difficulty": "beginner",
      "target_text": "السلام عليكم، اسمي أحمد",
      "target_text_translation": "Peace be upon you, my name is Ahmed",
      "audio_prompt_url": "https://storage.mothera.com/fasaaha/prompts/1.mp3",
      "max_duration_seconds": 30,
      "points": 10
    }
  ]
}
```

---

### POST /api/v1/fasaaha/missions/

Create a new mission.

**Auth Required:** Yes (admin)

**Request Body:**
```json
{
  "title": "Describe Your Family",
  "title_arabic": "صف عائلتك",
  "category_id": 2,
  "level": 2,
  "type": "describe",
  "difficulty": "beginner",
  "target_text": "عائلتي كبيرة. والدي يدعى محمد وأمي تدعى فاطمة",
  "target_text_translation": "My family is big. My father's name is Muhammad and my mother's name is Fatima",
  "image_url": "https://storage.mothera.com/fasaaha/images/family.jpg",
  "max_duration_seconds": 60,
  "points": 20,
  "rubric": {
    "pronunciation": "Correct pronunciation of family member names",
    "grammar": "Proper use of possessive constructs",
    "vocabulary": "Use of at least 5 family-related words"
  }
}
```

**Response (201 Created):** Created mission object.

---

### POST /api/v1/fasaaha/attempts/

Submit a Fasaaha attempt (audio recording).

**Auth Required:** Yes (student)
**Content-Type:** `multipart/form-data`

**Request:**
- `mission_id` — ID of the mission being attempted
- `audio` — Audio file (WebM, MP3, WAV — max 10MB)

**Response (201 Created):**
```json
{
  "id": "uuid-string",
  "mission": {
    "id": 1,
    "title": "Say Hello",
    "title_arabic": "قل مرحباً"
  },
  "student": {
    "id": "uuid-string",
    "name": "Ahmed Hassan"
  },
  "status": "processing",
  "submitted_at": "2026-07-20T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` — Invalid audio format
- `400 Bad Request` — Audio too long or too short
- `400 Bad Request` — Mission not found

---

### GET /api/v1/fasaaha/attempts/{id}/analysis/

Get the AI analysis of a completed attempt.

**Auth Required:** Yes (student, teacher)

**Response (200 OK):**
```json
{
  "id": "uuid-string",
  "mission": {
    "id": 1,
    "title": "Say Hello"
  },
  "status": "analyzed",
  "transcription": "السلام عليكم اسمي احمد",
  "scores": {
    "pronunciation": 82,
    "grammar": 88,
    "fluency": 75,
    "vocabulary": 80,
    "composite": 81
  },
  "feedback": {
    "overall": "Good attempt! Your pronunciation is clear and grammar is correct.",
    "pronunciation": "Good pronunciation of 'السلام عليكم'. Work on the 'ح' sound in 'أحمد'.",
    "grammar": "Excellent use of the introductory phrase structure.",
    "fluency": "Try to speak more fluidly with fewer pauses between words.",
    "vocabulary": "Good vocabulary for this level. Consider adding more descriptive words."
  },
  "badge_earned": null,
  "points_earned": 8,
  "analyzed_at": "2026-07-20T10:30:15Z"
}
```

---

### POST /api/v1/fasaaha/reviews/

Teacher reviews and optionally overrides AI scores.

**Auth Required:** Yes (teacher)

**Request Body:**
```json
{
  "attempt_id": "uuid-string",
  "override_scores": {
    "pronunciation": 85,
    "grammar": 90
  },
  "teacher_feedback": "Excellent improvement! Keep practicing the 'ح' sound.",
  "approved": true
}
```

**Response (200 OK):**
```json
{
  "message": "Review submitted",
  "attempt_id": "uuid-string",
  "final_scores": {
    "pronunciation": 85,
    "grammar": 90,
    "fluency": 75,
    "vocabulary": 80,
    "composite": 83
  },
  "reviewed_by": {
    "id": "uuid-string",
    "name": "Ustadh Ibrahim"
  }
}
```

---

### GET /api/v1/fasaaha/progress/

Get student's Fasaaha progress.

**Auth Required:** Yes
**Query Parameters:**
- `student` — Student ID (admin/teacher view)

**Response (200 OK):**
```json
{
  "student": {
    "id": "uuid-string",
    "name": "Ahmed Hassan"
  },
  "current_level": 3,
  "current_category": "Daily Routines",
  "levels_completed": [1, 2],
  "total_attempts": 45,
  "average_score": 76.5,
  "best_score": 95,
  "total_points": 380,
  "time_spent_minutes": 180,
  "missions_completed": 40,
  "missions_remaining": 5
}
```

---

### POST /api/v1/fasaaha/progress/

Update student's progress (system-generated).

**Auth Required:** Yes (system)

**Request Body:**
```json
{
  "student_id": "uuid-string",
  "level": 3,
  "category_id": 4,
  "missions_completed": [1, 2, 3, 4, 5]
}
```

**Response (200 OK):** Updated progress object.

---

### GET /api/v1/fasaaha/progress/streak/

Get student's current streak information.

**Auth Required:** Yes

**Response (200 OK):**
```json
{
  "current_streak": 7,
  "longest_streak": 12,
  "last_attempt_date": "2026-07-20",
  "streak_protected": false,
  "protections_remaining": 0,
  "next_milestone": {
    "days": 14,
    "badge": "Two Week Warrior",
    "days_remaining": 7
  }
}
```

---

### GET /api/v1/fasaaha/badges/

List all available badges.

**Auth Required:** Yes

**Response (200 OK):**
```json
{
  "count": 12,
  "results": [
    {
      "id": 1,
      "name": "First Words",
      "name_arabic": "أولى الكلمات",
      "description": "Complete your first Fasaaha attempt",
      "icon_url": "https://storage.mothera.com/fasaaha/badges/first_words.png",
      "rarity": "common",
      "requirement": "Complete 1 attempt",
      "points": 5
    }
  ]
}
```

---

### GET /api/v1/fasaaha/badges/my/

Get badges earned by the current student.

**Auth Required:** Yes (student)

**Response (200 OK):**
```json
{
  "earned": [
    {
      "id": 1,
      "name": "First Words",
      "name_arabic": "أولى الكلمات",
      "description": "Complete your first Fasaaha attempt",
      "icon_url": "https://storage.mothera.com/fasaaha/badges/first_words.png",
      "earned_at": "2026-07-15T10:30:00Z",
      "attempt_id": "uuid-string"
    }
  ],
  "locked": [
    {
      "id": 2,
      "name": "Level Up",
      "description": "Advance to the next level",
      "progress": "2/3 levels completed",
      "percentage": 66
    }
  ]
}
```

---

### GET /api/v1/fasaaha/analytics/class/

Get class-level Fasaaha analytics.

**Auth Required:** Yes (teacher, admin)
**Query Parameters:**
- `class_id` — Class ID (required)
- `level` — Filter by level
- `start_date` — Range start
- `end_date` — Range end

**Response (200 OK):**
```json
{
  "class": { "id": "uuid-string", "name": "Grade 5A" },
  "period": { "start": "2026-07-01", "end": "2026-07-20" },
  "summary": {
    "total_students": 25,
    "active_students": 22,
    "total_attempts": 180,
    "average_score": 74.2,
    "average_level": 2.8,
    "completion_rate": 0.88
  },
  "dimension_averages": {
    "pronunciation": 76.5,
    "grammar": 72.0,
    "fluency": 68.3,
    "vocabulary": 75.8
  },
  "top_performers": [
    { "student_id": "uuid", "name": "Ahmed Hassan", "average_score": 92 },
    { "student_id": "uuid", "name": "Fatima Ali", "average_score": 89 }
  ],
  "needs_improvement": [
    { "student_id": "uuid", "name": "Omar Yusuf", "average_score": 45, "weak_dimension": "fluency" }
  ]
}
```

---

### GET /api/v1/fasaaha/analytics/student/{id}/

Get detailed analytics for a specific student.

**Auth Required:** Yes (teacher, admin, self)

**Response (200 OK):**
```json
{
  "student": { "id": "uuid-string", "name": "Ahmed Hassan" },
  "overall": {
    "current_level": 3,
    "total_attempts": 45,
    "average_score": 76.5,
    "total_points": 380,
    "rank_in_class": 3,
    "rank_in_school": 12
  },
  "dimension_trends": {
    "pronunciation": [70, 72, 75, 78, 82],
    "grammar": [65, 68, 72, 80, 88],
    "fluency": [60, 62, 65, 70, 75],
    "vocabulary": [70, 72, 75, 78, 80]
  },
  "weekly_attempts": [5, 4, 6, 5, 3, 4, 5],
  "level_progression": [
    { "level": 1, "completed_at": "2026-07-01" },
    { "level": 2, "completed_at": "2026-07-10" }
  ]
}
```

---

### GET /api/v1/fasaaha/dashboard/student/

Get the student's Fasaaha dashboard.

**Auth Required:** Yes (student)

**Response (200 OK):**
```json
{
  "current_level": {
    "number": 3,
    "name": "Al-Mutawassit",
    "progress_percentage": 60,
    "next_mission": {
      "id": 45,
      "title": "My Daily Routine",
      "title_arabic": "روتيني اليومي"
    }
  },
  "streak": {
    "current": 7,
    "longest": 12,
    "next_milestone": "14 days"
  },
  "recent_attempts": [
    {
      "id": "uuid",
      "mission": "Say Hello",
      "score": 81,
      "date": "2026-07-20"
    }
  ],
  "badges": {
    "earned": 4,
    "total": 12,
    "latest": "First Words"
  },
  "points": 380,
  "rank": "3rd in class"
}
```

---

### GET /api/v1/fasaaha/dashboard/teacher/

Get the teacher's Fasaaha dashboard.

**Auth Required:** Yes (teacher)

**Response (200 OK):**
```json
{
  "classes": [
    {
      "id": "uuid",
      "name": "Grade 5A",
      "active_students": 22,
      "average_score": 74.2,
      "attempts_this_week": 45
    }
  ],
  "pending_reviews": 8,
  "recent_submissions": [
    {
      "id": "uuid",
      "student": "Ahmed Hassan",
      "mission": "Say Hello",
      "score": 81,
      "submitted_at": "2026-07-20T10:30:00Z",
      "reviewed": false
    }
  ],
  "top_performers": [
    { "name": "Ahmed Hassan", "average_score": 92 },
    { "name": "Fatima Ali", "average_score": 89 }
  ],
  "alerts": [
    { "student": "Omar Yusuf", "message": "No attempts in 7 days", "severity": "warning" }
  ]
}
```

---

## 8. AI Services

### POST /api/v1/ai/tutor/ask/

Ask the AI Tutor a question.

**Auth Required:** Yes (student)

**Request Body:**
```json
{
  "question": "What is the meaning of Surah Al-Fatiha?",
  "subject_id": "uuid-string",
  "context": "I am studying Quran Studies in Grade 5"
}
```

**Response (200 OK):**
```json
{
  "answer": "Surah Al-Fatiha, also known as 'The Opening', is the first chapter of the Holy Quran. It consists of 7 ayahs (verses) and is recited in every unit of Salah (prayer). The surah praises Allah as the Lord of all worlds, the Most Merciful, the Master of the Day of Judgment, and asks for guidance to the straight path.",
  "sources": ["Quran Studies Grade 5 Curriculum"],
  "confidence": 0.95,
  "suggested_follow_up": [
    "How many parts is the Quran divided into?",
    "What is the importance of Al-Fatiha in Salah?"
  ],
  "model_used": "gpt-4",
  "tokens_used": 250
}
```

---

### POST /api/v1/ai/questions/generate/

Generate assessment questions using AI.

**Auth Required:** Yes (admin, teacher)

**Request Body:**
```json
{
  "topic_id": "uuid-string",
  "question_type": "mcq",
  "count": 5,
  "difficulty": "medium",
  "language": "english"
}
```

**Response (200 OK):**
```json
{
  "questions": [
    {
      "type": "mcq",
      "question_text": "Who compiled the Quran into a single book during the time of Abu Bakr (RA)?",
      "question_text_arabic": "من جمع القرآن في عهد أبي بكر رضي الله عنه؟",
      "options": [
        { "key": "A", "text": "Zaid ibn Thabit (RA)" },
        { "key": "B", "text": "Umar ibn Khattab (RA)" },
        { "key": "C", "text": "Uthman ibn Affan (RA)" },
        { "key": "D", "text": "Ali ibn Abi Talib (RA)" }
      ],
      "correct_answer": "A",
      "explanation": "Zaid ibn Thabit (RA) was tasked by Abu Bakr (RA) to compile the Quran into a single manuscript.",
      "marks": 2,
      "difficulty": "medium",
      "subject": "Quran Studies",
      "topic": "History of Quran Compilation"
    }
  ],
  "model_used": "gpt-4",
  "tokens_used": 800
}
```

---

### POST /api/v1/ai/lessons/generate/

Generate lesson plan materials using AI.

**Auth Required:** Yes (admin, teacher)

**Request Body:**
```json
{
  "topic_id": "uuid-string",
  "grade_level": "grade_5",
  "duration_minutes": 45,
  "materials": ["lesson_plan", "homework"],
  "teaching_style": "interactive",
  "language": "english",
  "special_notes": "Mixed ability class, 2 students with learning difficulties"
}
```

**Response (200 OK):**
```json
{
  "lesson_plan": {
    "title": "Introduction to Surah Al-Baqarah",
    "objectives": [
      "Students will be able to identify the main themes of Surah Al-Baqarah",
      "Students will recite the first 5 ayahs with proper tajweed",
      "Students will understand the historical context of revelation"
    ],
    "materials_needed": ["Quran", "Whiteboard", "Audio recitation"],
    "warm_up": {
      "activity": "Recite Al-Fatiha together as a class",
      "duration_minutes": 5
    },
    "main_activities": [
      {
        "activity": "Teacher explains the historical context of Surah Al-Baqarah",
        "duration_minutes": 10,
        "method": "Lecture with discussion"
      },
      {
        "activity": "Listen to recitation of first 5 ayahs",
        "duration_minutes": 10,
        "method": "Audio playback with following along"
      },
      {
        "activity": "Small group practice of tajweed rules",
        "duration_minutes": 15,
        "method": "Group work"
      }
    ],
    "closure": {
      "activity": "Class recitation of first 3 ayahs together",
      "duration_minutes": 5
    }
  },
  "homework": [
    {
      "title": "Practice Recitation",
      "description": "Practice reciting Ayahs 1-5 of Surah Al-Baqarah at home. Record yourself and bring the recording next class.",
      "due_date": "next_class",
      "marks": 10
    }
  ],
  "model_used": "gpt-4",
  "tokens_used": 1200
}
```

---

### POST /api/v1/ai/career/generate/

Generate career guidance for a student.

**Auth Required:** Yes (admin, teacher, student — self only)

**Request Body:**
```json
{
  "student_id": "uuid-string"
}
```

**Response (200 OK):**
```json
{
  "student": { "id": "uuid-string", "name": "Ahmed Hassan" },
  "recommendations": [
    {
      "career": "Islamic Scholar / Imam",
      "confidence": 0.85,
      "reasoning": "Ahmed consistently scores highest in Quran Studies and Islamic Studies. His Fasaaha level is advanced, indicating strong Arabic proficiency.",
      "required_education": ["Islamic Studies degree", "Arabic Language proficiency", "Ijazah in Quran recitation"],
      "skills_to_develop": ["Public speaking", "Leadership", "Advanced Fiqh"],
      "islamic_perspective": "Seeking knowledge is a duty upon every Muslim. The Prophet (PBUH) said: 'Seeking knowledge is an obligation upon every Muslim.'"
    },
    {
      "career": "Doctor / Medical Professional",
      "confidence": 0.72,
      "reasoning": "Strong performance in Science and Mathematics. Good analytical skills demonstrated in assessments.",
      "required_education": ["Pre-med qualification", "Medical degree", "Residency"],
      "skills_to_develop": ["Biology", "Chemistry", "Critical thinking"],
      "islamic_perspective": "Healing is a noble profession in Islam. The Prophet (PBUH) said: 'Make use of medical treatment, for Allah has not made a disease without appointing a remedy for it.'"
    }
  ],
  "model_used": "gpt-4",
  "tokens_used": 900
}
```

---

## Error Response Format

All error responses follow a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "field_name": ["This field is required."]
    }
  }
}
```

**Common Error Codes:**
| Code | HTTP Status | Description |
|---|---|---|
| `AUTHENTICATION_REQUIRED` | 401 | No valid authentication token |
| `AUTHORIZATION_DENIED` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Rate Limiting

| Endpoint Category | Rate Limit |
|---|---|
| Authentication | 5 requests/minute |
| CRUD Operations | 60 requests/minute |
| AI Services | 20 requests/minute |
| Fasaaha Submissions | 10 requests/hour |
| File Uploads | 10 requests/hour |

---

*API versioning: Major version in URL path (`/api/v1/`). Breaking changes require new version. Deprecation notice: 6 months before removal.*
