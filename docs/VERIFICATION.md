# Frontend–Backend Verification Report

Date: 2026-08-16
Scope: route coverage, page render smoke tests, and API contract cross-check.

## 1. Route Map

All routes are defined in `frontend/src/App.tsx` under role-gated `<ProtectedRoute>` wrappers:

| Role       | Prefix       | Pages |
|------------|--------------|-------|
| mudeer     | `/admin`     | dashboard, users, subjects, enrollments, class-subjects, exams, parent-students, interventions, engagement, messages, finance, attendance, announcements, reports, academic, admissions, at-risk, teacher-workload, character, whatsapp, results, audit |
| idaarah    | `/admin`     | same tree (share the admin layout) |
| ustaadh    | `/teacher`   | dashboard, timetable, homework, lessons, assessments, results, attendance, quran, fasaaha, learning, ai-tutor |
| student    | `/student`   | dashboard, timetable, homework, assessments, results, attendance, quran, fasaaha, learning, ai-tutor, messages |
| parent     | `/parent`    | dashboard, child results, messages, announcements, fees |

## 2. Gaps Found and Fixed

1. **Missing `/admin/change-password` route** — the layout's "change password" link (used by all roles) pointed at a route that did not exist. Added the route in `App.tsx`.
2. **8 pages with unguarded nested API access** — dashboards and detail pages dereferenced potentially-undefined API fields and could throw on render. Added defensive guards in:
   - `pages/admin/AdminDashboard.tsx`
   - `pages/admin/AdminEngagementPage.tsx`
   - `pages/admin/InterventionAlertsPage.tsx`
   - `pages/board/BoardDashboard.tsx`
   - `pages/student/StudentAttendancePage.tsx`
   - `pages/student/StudentProgressPage.tsx`
   - `pages/teacher/TeacherDashboard.tsx`
   - `pages/teacher/fasaaha/FasaahaTeacherDashboard.tsx`
3. **`ExamManagementPage` called non-existent backend endpoints** — `examAPI` used `/results/exams/` CRUD + results routes the backend did not expose. Added `ExamViewSet` (with `results` and `bulk_results` actions) and a writable `ExamResultWriteSerializer` with madrasah-scoped student validation. See commit "feat: add exam CRUD and result recording endpoints to results API".

## 3. API Cross-Check

Method: extracted every `api.<verb>(url)` string from `frontend/src` (template literals normalized to `<id>`), resolved the backend URLconf via Django's resolver, and matched by path segments.

- Frontend API calls scanned: **251**
- Backend API URLs (resolved, deduplicated): **330**
- Frontend calls with no matching backend URL: **0** (was 4 — all `results/exams`, fixed in §2.3)

## 4. Backend URLs Never Called by Frontend

76 backend routes have no frontend caller. These are not defects — most are newer results-workflow and AI endpoints awaiting UI integration:

- `results/` new workflow: `assessments`, `assessment-scores`, `blueprints`, `grade-scales`, `subject-results`, `term-results`, `annual-results`, `ranks`, `publications`, `report-cards`, `audit-logs`, `bulk-scores`
- `results/` legacy leftovers: `export/exams/{id}`, `export/quizzes/{id}`, `bulk-scores`
- `lessons/` AI + ops: `ai/generate-homework`, `ai/generate-lesson-plan`, `ai/generate-scheme`, `ai/refine`, `analytics`, `audit-logs`, `objectives`, `schemes`, `teacher-classes`, `teacher-subjects`, lesson-plan delivery/reflections/resources/submit
- `guidance/`: `student-summary`
- `fasaaha/`: `trends`
- `quran/`: `revision/{id}`, `tajwid/{id}`
- `whatsapp/webhook`, `search`, `users/madrasahs`, `users/messages/{id}`

## 5. Test Coverage

- Backend: `results` app suite passes **58/58** (51 pre-existing + 7 new exam endpoint tests).
- Frontend: new `pageRender.test.tsx` renders every route for every role (122 smoke assertions); required `ResizeObserver` / `scrollTo` / `scrollIntoView` stubs added to `test/setup.ts`.
- `manage.py check` clean; `tsc --noEmit` clean; `npm run build` succeeds.

## 6. Documentation Drift

`docs/07-API.md` §5 "Results" still describes a legacy exam schema (`name`, `name_arabic`, `subject_id`, `term`, `academic_year`, UUID ids) that does not match the implemented `Exam` model (`title`, `subject` FK, `exam_date`, `total_marks`, integer ids). The exam section should be rewritten to match the live API.
