# Fasaaha — AI Arabic Speaking Intelligence Platform
## Architecture Document v1.0

---

## 1. Executive Summary

Fasaaha is an AI-powered Arabic speaking practice module within Mothera LMS. It enables students to practice speaking Arabic through structured missions, receive AI-assisted feedback on pronunciation, grammar, and fluency, and have teachers review and guide their progress.

**Phase 1 Scope**: Speaking Levels 1–3, teacher assignments, student recording, AI processing pipeline, teacher review, dashboards, analytics foundation.

---

## 2. Integration with Mothera

### 2.1 Reusable Models

| Model | App | Fasaaha Usage |
|-------|-----|---------------|
| `User` | `users` | Students, teachers (FK) |
| `Madrasah` | `users` | Multi-tenancy (FK on every model) |
| `SchoolClass` | `curriculum` | Class-level assignment grouping |
| `Subject` | `curriculum` | Arabic subject reference (optional FK) |
| `Enrollment` | `curriculum` | Identify enrolled students |
| `Session` | `academic` | Academic year scoping |
| `Term` | `academic` | Term scoping |
| `Announcement` | `school_ops` | Fasaaha announcements |
| `Notification` | `school_ops` | Push notifications for reviews |

### 2.2 Reusable Infrastructure

| Component | Source | Fasaaha Usage |
|-----------|--------|---------------|
| `TenantAwareMixin` | `config.mixins` | Auto-filter by madrasah |
| `IsMudeer`, `IsStaff`, `IsAdminOrTeacher`, `IsStudent` | `config.permissions` | Permission gating |
| `validate_audio` | `config.validators` | Audio upload validation |
| `ALLOWED_AUDIO_EXTENSIONS` | `config.validators` | Audio format enforcement |
| JWT Authentication | `users.authentication` | API auth |
| Celery + Redis | `config.settings` | Async AI processing |
| OpenAI client pattern | `guidance/services.AIService` | AI provider integration |

### 2.3 URL Namespace

```
api/v1/fasaaha/          ← New namespace
```

---

## 3. Functional Requirements

### 3.1 Speaking Levels

| Level | Description | Vocabulary | Complexity |
|-------|-------------|------------|------------|
| 1 | Greetings & basics | 50 words | Single words, short phrases |
| 2 | Daily conversations | 150 words | Simple sentences, Q&A |
| 3 | Descriptive speech | 300 words | Paragraphs, opinions, descriptions |
| 4-10 | *(Phase 2+)* | | |

### 3.2 Missions

Each level contains **missions** (speaking tasks). Each mission has:
- A prompt (text in Arabic + transliteration + English translation)
- Expected vocabulary/phrases
- Difficulty rating (1-5)
- Category (greetings, food, family, travel, etc.)
- Audio example (optional, teacher-recorded)

### 3.3 Student Recording Flow

1. Student sees mission prompt
2. Student records audio (browser MediaRecorder API)
3. Audio uploads to server
4. AI processes asynchronously (Celery):
   - Speech-to-text (transcription)
   - Pronunciation scoring
   - Grammar analysis
   - Fluency assessment
5. Results stored; student sees feedback
6. Teacher can review and override

### 3.4 AI Feedback Dimensions

| Dimension | Score Range | Description |
|-----------|-------------|-------------|
| Pronunciation | 0-100 | Accuracy of Arabic sounds |
| Grammar | 0-100 | Correct sentence structure |
| Fluency | 0-100 | Speed, pauses, natural flow |
| Vocabulary | 0-100 | Appropriate word usage |
| Overall | Weighted avg | Composite score |

### 3.5 Teacher Review

- Teachers see all student attempts for their assigned classes
- Can override AI scores
- Can add written feedback
- Can approve/reject attempts
- Can assign missions to students/classes

### 3.6 Gamification

- **Badges**: Awarded for milestones (first attempt, streak, level completion)
- **Streaks**: Consecutive days of practice
- **Points**: Accumulated from mission completions

---

## 4. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Audio upload | ≤20MB, formats: mp3, wav, ogg, m4a |
| AI processing latency | <30s for transcription, <10s for scoring |
| Concurrent users | 100+ per school |
| Storage | S3-compatible object storage |
| Availability | 99.5% uptime |
| Mobile support | Responsive UI, mobile recording |
| Offline capability | *(Phase 2)* |

---

## 5. User Stories

### Student
- As a student, I want to see my current speaking level and progress
- As a student, I want to see available missions for my level
- As a student, I want to record myself speaking Arabic
- As a student, I want to see AI feedback on my pronunciation and grammar
- As a student, I want to see my improvement over time
- As a student, I want to earn badges and maintain streaks
- As a student, I want to retry missions to improve my score

### Teacher
- As a teacher, I want to assign missions to students or classes
- As a teacher, I want to review student recordings and AI feedback
- As a teacher, I want to override AI scores and add comments
- As a teacher, I want to see class-wide speaking analytics
- As a teacher, I want to see which students are struggling
- As a teacher, I want to create custom missions

### Admin (Mudeer/Idaarah)
- As an admin, I want to see school-wide Fasaaha analytics
- As an admin, I want to manage speaking levels and content
- As an admin, I want to configure AI providers

---

## 6. User Flows

### 6.1 Student Practice Flow
```
Dashboard → Select Level → View Missions → Select Mission
  → Read Prompt → Tap Record → Speak Arabic → Stop Recording
  → Upload Audio → (Processing...) → View AI Feedback
  → Retry or Move On → Earn Points/Badges
```

### 6.2 Teacher Assignment Flow
```
Dashboard → Fasaaha → Assign Mission
  → Select Class/Students → Select Level → Select Missions
  → Set Deadline → Confirm Assignment
```

### 6.3 Teacher Review Flow
```
Dashboard → Fasaaha → Pending Reviews
  → Select Student Attempt → Listen to Audio
  → View AI Analysis → Override Scores (optional)
  → Write Feedback → Approve → Student Notified
```

---

## 7. Database Design (ER Diagram)

### 7.1 Entity Relationships

```
Madrasah (1) ──── (N) SpeakingLevel
SpeakingLevel (1) ──── (N) Mission
Mission (1) ──── (N) MissionCategory (M2M through MissionCategories)
MissionCategory (standalone)

SpeakingLevel (N) ──── (N) StudentProgress [through]

User (student) (1) ──── (N) SpeakingAttempt
Mission (1) ──── (N) SpeakingAttempt
SpeakingAttempt (1) ──── (1) AIAnalysis
SpeakingAttempt (1) ──── (N) TeacherReview

User (student) (1) ──── (N) StudentStreak
User (student) (1) ──── (N) StudentBadge
Badge (1) ──── (N) StudentBadge

User (teacher) (1) ──── (N) MissionAssignment
Mission (1) ──── (N) MissionAssignment
SchoolClass (N) ──── (N) MissionAssignment

User (student) (1) ──── (N) StudentLevelProgress
SpeakingLevel (1) ──── (N) StudentLevelProgress
```

---

## 8. Model Design

### 8.1 SpeakingLevel
```python
class SpeakingLevel(models.Model):
    madrasah = FK(Madrasah)
    number = PositiveSmallIntegerField()  # 1-10
    name = CharField(max_length=100)      # "Basics"
    name_ar = CharField(max_length=100)   # "الأساسيات"
    description = TextField()
    target_vocabulary_count = PositiveIntegerField(default=50)
    difficulty = PositiveSmallIntegerField(default=1)  # 1-5
    is_active = BooleanField(default=True)
    sort_order = IntegerField(default=0)
    created_at = DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['madrasah', 'number']
        ordering = ['sort_order']
```

### 8.2 MissionCategory
```python
class MissionCategory(models.Model):
    madrasah = FK(Madrasah)
    name = CharField(max_length=100)
    name_ar = CharField(max_length=100)
    icon = CharField(max_length=50, blank=True)  # emoji or icon class
    sort_order = IntegerField(default=0)
    is_active = BooleanField(default=True)

    class Meta:
        unique_together = ['madrasah', 'name']
        ordering = ['sort_order']
```

### 8.3 Mission
```python
class Mission(models.Model):
    DIFFICULTY_CHOICES = [(1, 'Easy'), (2, 'Medium'), (3, 'Hard'), (4, 'Expert'), (5, 'Master')]

    madrasah = FK(Madrasah)
    level = FK(SpeakingLevel, related_name='missions')
    category = FK(MissionCategory, null=True, blank=True)
    title = CharField(max_length=200)
    title_ar = CharField(max_length=200)
    prompt_ar = TextField()              # Arabic prompt text
    prompt_transliteration = TextField(blank=True)  # Latin script
    prompt_translation = TextField()     # English translation
    expected_phrases = JSONField(default=list)  # Expected vocabulary
    hints = JSONField(default=list, blank=True)
    difficulty = PositiveSmallIntegerField(choices=DIFFICULTY_CHOICES, default=2)
    max_time_seconds = PositiveIntegerField(default=60)
    example_audio = FileField(upload_to='fasaaha/examples/', null=True, blank=True)
    is_active = BooleanField(default=True)
    sort_order = IntegerField(default=0)
    created_by = FK(User, null=True, related_name='created_missions')
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['madrasah', 'title']
        ordering = ['level__number', 'sort_order']
```

### 8.4 SpeakingAttempt
```python
class SpeakingAttempt(models.Model):
    STATUS_CHOICES = [
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('reviewed', 'Reviewed'),
    ]

    madrasah = FK(Madrasah)
    student = FK(User, related_name='speaking_attempts')
    mission = FK(Mission, related_name='attempts')
    audio_file = FileField(upload_to='fasaaha/recordings/%Y/%m/')
    audio_duration_ms = PositiveIntegerField(null=True)
    audio_size_bytes = PositiveIntegerField(null=True)
    status = CharField(max_length=20, choices=STATUS_CHOICES, default='processing')
    attempt_number = PositiveSmallIntegerField(default=1)
    is_best_attempt = BooleanField(default=False)
    created_at = DateTimeField(auto_now_add=True)
    completed_at = DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['student', 'mission', 'attempt_number']
        ordering = ['-created_at']
        indexes = [
            Index(fields=['madrasah', 'student', 'mission']),
            Index(fields=['madrasah', 'status']),
        ]
```

### 8.5 AIAnalysis
```python
class AIAnalysis(models.Model):
    PROVIDER_CHOICES = [
        ('whisper', 'Whisper'),
        ('azure_speech', 'Azure Speech'),
        ('google_speech', 'Google Speech'),
        ('local_whisper', 'Local Whisper'),
    ]

    attempt = OneToOneField(SpeakingAttempt, related_name='ai_analysis')
    madrasah = FK(Madrasah)

    # Transcription
    transcribed_text = TextField(blank=True)
    transcription_provider = CharField(max_length=30, choices=PROVIDER_CHOICES)
    transcription_confidence = DecimalField(max_digits=5, decimal_places=4, null=True)
    transcription_raw = JSONField(default=dict, blank=True)  # Full provider response

    # Scores (0-100)
    pronunciation_score = DecimalField(max_digits=5, decimal_places=2, null=True)
    grammar_score = DecimalField(max_digits=5, decimal_places=2, null=True)
    fluency_score = DecimalField(max_digits=5, decimal_places=2, null=True)
    vocabulary_score = DecimalField(max_digits=5, decimal_places=2, null=True)
    overall_score = DecimalField(max_digits=5, decimal_places=2, null=True)

    # Detailed feedback
    pronunciation_feedback = JSONField(default=dict, blank=True)
    grammar_feedback = JSONField(default=dict, blank=True)
    fluency_feedback = JSONField(default=dict, blank=True)

    # Word-level analysis
    word_scores = JSONField(default=list, blank=True)  # [{word, score, issues}]

    # Provider metadata
    scoring_provider = CharField(max_length=30)
    processing_time_ms = PositiveIntegerField(null=True)
    raw_response = JSONField(default=dict, blank=True)

    created_at = DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            Index(fields=['attempt', 'created_at']),
        ]
```

### 8.6 TeacherReview
```python
class TeacherReview(models.Model):
    attempt = FK(SpeakingAttempt, related_name='teacher_reviews')
    madrasah = FK(Madrasah)
    teacher = FK(User, related_name='fasaaha_reviews')
    overall_score = DecimalField(max_digits=5, decimal_places=2, null=True,
                                  help_text='Override score (null = use AI)')
    feedback = TextField(blank=True)
    pronunciation_notes = TextField(blank=True)
    grammar_notes = TextField(blank=True)
    is_approved = BooleanField(null=True)  # null=pending, true=approved, false=needs_work
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['attempt', 'teacher']
        ordering = ['-created_at']
```

### 8.7 MissionAssignment
```python
class MissionAssignment(models.Model):
    madrasah = FK(Madrasah)
    mission = FK(Mission, related_name='assignments')
    assigned_by = FK(User, related_name='mission_assignments_created')
    target_student = FK(User, null=True, blank=True, related_name='mission_assignments')
    target_class = FK(SchoolClass, null=True, blank=True, related_name='mission_assignments')
    due_date = DateTimeField(null=True, blank=True)
    is_required = BooleanField(default=False)
    created_at = DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
```

### 8.8 StudentLevelProgress
```python
class StudentLevelProgress(models.Model):
    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('mastered', 'Mastered'),
    ]

    madrasah = FK(Madrasah)
    student = FK(User, related_name='level_progress')
    level = FK(SpeakingLevel, related_name='student_progress')
    status = CharField(max_length=20, choices=STATUS_CHOICES, default='not_started')
    missions_attempted = PositiveIntegerField(default=0)
    missions_completed = PositiveIntegerField(default=0)  # Score >= 70
    average_score = DecimalField(max_digits=5, decimal_places=2, default=0)
    best_score = DecimalField(max_digits=5, decimal_places=2, default=0)
    total_time_seconds = PositiveIntegerField(default=0)
    started_at = DateTimeField(null=True, blank=True)
    completed_at = DateTimeField(null=True, blank=True)
    updated_at = DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'level']
        ordering = ['level__number']
```

### 8.9 StudentStreak
```python
class StudentStreak(models.Model):
    madrasah = FK(Madrasah)
    student = FK(User, related_name='fasaaha_streaks')
    current_streak = PositiveIntegerField(default=0)
    longest_streak = PositiveIntegerField(default=0)
    last_practice_date = DateField(null=True, blank=True)
    total_practice_days = PositiveIntegerField(default=0)
    updated_at = DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'madrasah']
```

### 8.10 Badge
```python
class Badge(models.Model):
    CATEGORY_CHOICES = [
        ('milestone', 'Milestone'),
        ('streak', 'Streak'),
        ('level', 'Level'),
        ('special', 'Special'),
    ]

    madrasah = FK(Madrasah)
    name = CharField(max_length=100)
    name_ar = CharField(max_length=100)
    description = TextField()
    icon = CharField(max_length=50)  # emoji or icon identifier
    category = CharField(max_length=20, choices=CATEGORY_CHOICES)
    criteria = JSONField(default=dict)  # {"type": "streak", "value": 7}
    points = PositiveIntegerField(default=10)
    is_active = BooleanField(default=True)

    class Meta:
        unique_together = ['madrasah', 'name']
```

### 8.11 StudentBadge
```python
class StudentBadge(models.Model):
    madrasah = FK(Madrasah)
    student = FK(User, related_name='fasaaha_badges')
    badge = FK(Badge, related_name='awarded_to')
    awarded_at = DateTimeField(auto_now_add=True)
    awarded_by = FK(User, null=True, related_name='badges_awarded')

    class Meta:
        unique_together = ['student', 'badge']
        ordering = ['-awarded_at']
```

---

## 9. API Design

### 9.1 Endpoints

```
# Levels
GET    /api/v1/fasaaha/levels/                    — List levels
GET    /api/v1/fasaaha/levels/{id}/               — Level detail
GET    /api/v1/fasaaha/levels/{id}/missions/      — Missions for level

# Missions
GET    /api/v1/fasaaha/missions/                   — List missions (filterable)
GET    /api/v1/fasaaha/missions/{id}/              — Mission detail
POST   /api/v1/fasaaha/missions/                   — Create mission (teacher/admin)
PUT    /api/v1/fasaaha/missions/{id}/              — Update mission
DELETE /api/v1/fasaaha/missions/{id}/              — Delete mission

# Categories
GET    /api/v1/fasaaha/categories/                 — List categories
POST   /api/v1/fasaaha/categories/                 — Create category (admin)

# Attempts
GET    /api/v1/fasaaha/attempts/                   — List attempts (my attempts / class attempts)
POST   /api/v1/fasaaha/attempts/                   — Submit recording (upload audio)
GET    /api/v1/fasaaha/attempts/{id}/              — Attempt detail with AI analysis
POST   /api/v1/fasaaha/attempts/{id}/retry/        — Retry mission (increments attempt_number)

# Teacher Review
GET    /api/v1/fasaaha/reviews/pending/            — Pending reviews for teacher
POST   /api/v1/fasaaha/reviews/                    — Submit teacher review
PUT    /api/v1/fasaaha/reviews/{id}/               — Update review

# Assignments
GET    /api/v1/fasaaha/assignments/                — List assignments
POST   /api/v1/fasaaha/assignments/                — Create assignment
DELETE /api/v1/fasaaha/assignments/{id}/           — Remove assignment

# Progress
GET    /api/v1/fasaaha/progress/                   — My progress across levels
GET    /api/v1/fasaaha/progress/{level_id}/        — Progress for specific level
GET    /api/v1/fasaaha/progress/streak/            — My streak data

# Badges
GET    /api/v1/fasaaha/badges/                     — All available badges
GET    /api/v1/fasaaha/badges/my/                  — My earned badges

# Analytics (teacher/admin)
GET    /api/v1/fasaaha/analytics/class/            — Class-wide analytics
GET    /api/v1/fasaaha/analytics/student/{id}/     — Student analytics
GET    /api/v1/fasaaha/analytics/school/           — School-wide analytics (admin)

# Dashboard
GET    /api/v1/fasaaha/dashboard/student/          — Student dashboard summary
GET    /api/v1/fasaaha/dashboard/teacher/          — Teacher dashboard summary
```

### 9.2 Key Request/Response Shapes

**POST /api/v1/fasaaha/attempts/**
```
Request: multipart/form-data
  - mission: int (mission ID)
  - audio: file (audio recording)

Response:
{
  "id": 1,
  "mission": { "id": 5, "title": "Greet someone", "title_ar": "...." },
  "status": "processing",
  "attempt_number": 1,
  "created_at": "2026-07-22T10:30:00Z"
}
```

**GET /api/v1/fasaaha/attempts/{id}/**
```
Response:
{
  "id": 1,
  "mission": { ... },
  "status": "completed",
  "audio_url": "/media/fasaaha/recordings/2026/07/rec.mp3",
  "audio_duration_ms": 12500,
  "ai_analysis": {
    "transcribed_text": "مرحبا، كيف حالك؟",
    "pronunciation_score": 82.5,
    "grammar_score": 90.0,
    "fluency_score": 75.0,
    "vocabulary_score": 85.0,
    "overall_score": 83.1,
    "pronunciation_feedback": {
      "strengths": ["Clear hamza pronunciation"],
      "improvements": ["Practice عين sound"]
    },
    "word_scores": [
      { "word": "مرحبا", "score": 95, "issues": [] },
      { "word": "حالك", "score": 78, "issues": ["ha sound unclear"] }
    ]
  },
  "teacher_review": null,
  "created_at": "2026-07-22T10:30:00Z"
}
```

---

## 10. Permission Matrix

| Action | Student | Teacher (ustaadh) | Admin (mudeer/idaarah) |
|--------|---------|-------------------|----------------------|
| View levels | ✅ | ✅ | ✅ |
| View missions | ✅ | ✅ | ✅ |
| Create missions | ❌ | ✅ | ✅ |
| Submit attempt | ✅ | ❌ | ❌ |
| View own attempts | ✅ | ❌ | ❌ |
| View class attempts | ❌ | ✅ | ✅ |
| Review attempts | ❌ | ✅ | ✅ |
| Override AI scores | ❌ | ✅ | ✅ |
| Assign missions | ❌ | ✅ | ✅ |
| View own progress | ✅ | ❌ | ❌ |
| View class analytics | ❌ | ✅ | ✅ |
| View school analytics | ❌ | ❌ | ✅ |
| Manage levels | ❌ | ❌ | ✅ |
| Manage categories | ❌ | ❌ | ✅ |
| Configure AI providers | ❌ | ❌ | ✅ |
| View own badges | ✅ | ❌ | ❌ |
| Award badges | ❌ | ✅ | ✅ |

---

## 11. AI Pipeline Architecture

### 11.1 Pipeline Flow

```
Audio Upload
    │
    ▼
┌─────────────────┐
│  Receive Upload  │  → Validate format, size
│  Store in S3     │  → Generate signed URL
│  Create Attempt  │  → status = 'processing'
└────────┬────────┘
         │
         ▼ (Celery task: process_speaking_attempt)
┌─────────────────┐
│  Speech-to-Text  │  → Provider: Whisper/Azure/Google/Local
│  (Transcription) │  → Store: transcribed_text, confidence
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Pronunciation   │  → Compare transcribed vs expected
│  Scoring         │  → Word-level scoring
│                  │  → Score: 0-100
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Grammar         │  → LLM analysis of sentence structure
│  Analysis        │  → Identify errors, suggestions
│                  │  → Score: 0-100
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Fluency         │  → Audio duration vs text length
│  Assessment      │  → Pause detection
│                  │  → Score: 0-100
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Composite       │  → Weighted average
│  Scoring         │  → overall = 0.35*pron + 0.25*gram + 0.2*fluen + 0.2*vocab
│                  │  → Update attempt status = 'completed'
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Badge Check     │  → Evaluate criteria
│  Streak Update   │  → Award badges if earned
│  Progress Update │  → Update level progress
└─────────────────┘
```

### 11.2 Provider Abstraction

```python
# fasaaha/ai/providers/base.py

class SpeechToTextProvider(ABC):
    @abstractmethod
    def transcribe(self, audio_path: str, language: str = 'ar') -> TranscriptionResult:
        """Transcribe audio to text."""
        pass

class PronunciationScorer(ABC):
    @abstractmethod
    def score(self, audio_path: str, expected_text: str, transcribed_text: str) -> PronunciationResult:
        """Score pronunciation accuracy."""
        pass

class GrammarAnalyzer(ABC):
    @abstractmethod
    def analyze(self, text: str, context: dict = None) -> GrammarResult:
        """Analyze grammar correctness."""
        pass

class FluencyAssessor(ABC):
    @abstractmethod
    def assess(self, audio_path: str, text: str) -> FluencyResult:
        """Assess speech fluency."""
        pass
```

### 11.3 Provider Implementations

| Provider | STT | Pronunciation | Grammar | Fluency |
|----------|-----|---------------|---------|---------|
| OpenAI Whisper | ✅ | ❌ | ❌ | ❌ |
| Azure Speech | ✅ | ✅ (Pronunciation Assessment) | ❌ | ✅ |
| Google Speech | ✅ | ❌ | ❌ | ❌ |
| Local Whisper | ✅ | ❌ | ❌ | ❌ |
| Claude/GPT | ❌ | ❌ | ✅ | ❌ |

### 11.4 Celery Tasks

```python
# fasaaha/tasks.py

@shared_task(bind=True, max_retries=3)
def process_speaking_attempt(self, attempt_id: int):
    """Main processing pipeline for a speaking attempt."""
    ...

@shared_task
def transcribe_audio(attempt_id: int, provider: str = 'whisper'):
    """STT transcription."""
    ...

@shared_task
def score_pronunciation(attempt_id: int):
    """Pronunciation scoring."""
    ...

@shared_task
def analyze_grammar(attempt_id: int):
    """Grammar analysis."""
    ...

@shared_task
def assess_fluency(attempt_id: int):
    """Fluency assessment."""
    ...

@shared_task
def check_and_award_badges(student_id: int, madrasah_id: int):
    """Evaluate badge criteria and award."""
    ...

@shared_task
def update_student_streak(student_id: int, madrasah_id: int):
    """Update practice streak."""
    ...
```

---

## 12. Background Task Architecture

### 12.1 Queue Design

| Queue | Purpose | Priority |
|-------|---------|----------|
| `fasaaha.audio` | STT transcription | High |
| `fasaaha.analysis` | Grammar/fluency scoring | Normal |
| `fasaaha.badges` | Badge/streak updates | Low |

### 12.2 Processing Flow

1. Audio uploaded → `process_speaking_attempt.delay(attempt_id)`
2. Task chains: `transcribe → score_pronunciation → analyze_grammar → assess_fluency → composite_score`
3. On completion: `check_and_award_badges.delay(student_id, madrasah_id)`
4. Error handling: 3 retries with exponential backoff, then status='failed'

---

## 13. Security Considerations

| Concern | Mitigation |
|---------|------------|
| Audio file size | Max 20MB, validated on upload |
| Audio format | Only mp3, wav, ogg, m4a |
| Tenant isolation | FK to madrasah on every model, TenantAwareMixin |
| API auth | JWT required on all endpoints |
| Rate limiting | 200 req/hour per user |
| Student data | Students can only view own attempts |
| Teacher access | Teachers only see assigned class attempts |
| Audio storage | S3 signed URLs, time-limited |
| AI API keys | Environment variables, never in code |
| SQL injection | DRF serializers + ORM (no raw SQL) |
| File upload | Django validators before storage |

---

## 14. Scalability Strategy

| Dimension | Strategy |
|-----------|----------|
| Storage | S3-compatible object storage (audio files) |
| Processing | Celery workers can scale horizontally |
| Database | PostgreSQL with proper indexes |
| Caching | Redis for session progress, streak data |
| CDN | S3 + CloudFront for audio delivery |
| Rate limiting | Per-user throttling |
| Async processing | All AI work is async via Celery |

---

## 15. Testing Strategy

| Test Type | Coverage Target | Tools |
|-----------|----------------|-------|
| Unit Tests | Models, services, providers | pytest, factory_boy |
| Serializer Tests | All CRUD serializers | pytest |
| Permission Tests | Every endpoint × every role | pytest |
| API Tests | All endpoints, happy + error paths | pytest + DRF test client |
| Service Tests | AI pipeline, scoring logic | pytest + mocks |
| Integration Tests | Full upload → processing → feedback | pytest |
| Frontend Tests | Components, hooks, pages | Vitest |

---

## 16. Implementation Roadmap

### Phase 1 (Current Scope)
1. Django app setup + models + migrations
2. AI provider abstraction layer
3. Speaking levels + missions CRUD
4. Audio upload + Celery processing pipeline
5. AI analysis storage + display
6. Student attempt flow
7. Teacher review flow
8. Student dashboard
9. Teacher dashboard
10. Progress tracking + streaks
11. Badges system
12. Analytics foundation
13. Frontend pages (all dashboards)
14. Full test suite

### Phase 2 (Future)
- Levels 4-10
- Custom mission creation by teachers
- Group speaking exercises
- Live speaking sessions
- Advanced ML pronunciation models
- Comparative analytics
- Certificate generation
- Standalone SaaS mode

---

## 17. File Structure

```
backend/fasaaha/
├── __init__.py
├── admin.py
├── apps.py
├── models.py
├── serializers.py
├── views.py
├── urls.py
├── selectors.py
├── services.py
├── permissions.py
├── validators.py
├── tasks.py
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_models.py
│   ├── test_serializers.py
│   ├── test_permissions.py
│   ├── test_api.py
│   ├── test_services.py
│   └── test_tasks.py
└── ai/
    ├── __init__.py
    ├── base.py          # Abstract provider interfaces
    ├── pipeline.py      # Main processing pipeline
    ├── whisper_stt.py   # Whisper STT provider
    ├── azure_speech.py  # Azure Speech provider
    ├── grammar_llm.py   # LLM-based grammar analyzer
    └── scoring.py       # Composite scoring logic

frontend/src/pages/fasaaha/
├── StudentDashboard.tsx
├── StudentMissionList.tsx
├── StudentMissionDetail.tsx
├── StudentAttemptDetail.tsx
├── StudentProgress.tsx
├── StudentBadges.tsx
├── TeacherDashboard.tsx
├── TeacherAssignMission.tsx
├── TeacherReviewAttempts.tsx
├── TeacherAnalytics.tsx
└── AdminLevels.tsx
```

---

## 18. Environment Variables

```env
# AI Providers
FASAaha_STT_PROVIDER=whisper          # whisper | azure_speech | google_speech | local_whisper
FASAaha_GRAMMAR_PROVIDER=openai       # openai | claude | gemini
FASAaha_SCORING_PROVIDER=azure        # azure | custom

# Azure Speech (if used)
AZURE_SPEECH_KEY=
AZURE_SPEECH_REGION=

# Storage
FASAaha_AUDIO_STORAGE=s3              # s3 | local
AWS_STORAGE_BUCKET_NAME=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_REGION_NAME=

# Processing
FASAaha_MAX_AUDIO_SIZE_MB=20
FASAaha_PROCESSING_TIMEOUT=60
```
