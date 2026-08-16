export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  gender?: 'male' | 'female' | '';
  address?: string;
  role: 'guest' | 'ustaadh' | 'mudeer' | 'idaarah' | 'student' | 'parent';
  madrasah: number;
  madrasah_name: string;
  is_active: boolean;
  email_verified?: boolean;
  date_of_birth?: string | null;
  date_joined: string;
  student_ids?: number[];
}

export interface Madrasah {
  id: number;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  created_at: string;
}

export interface Subject {
  id: number;
  name: string;
  madrasah: number;
  name_ar: string;
  name_en: string;
  code: string;
  description: string;
  topics: Topic[];
  topic_count: number;
  created_at: string;
}

export interface Topic {
  id: number;
  subject: number;
  name: string;
  surah_number: number | null;
  description: string;
  created_at: string;
}

export interface Question {
  id: number;
  madrasah: number;
  topic: number;
  topic_name: string;
  question_text: string;
  question_type: 'mcq' | 'fill_blank' | 'short_answer' | 'essay';
  options: string[] | null;
  correct_answer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  created_by: number;
  created_by_name: string;
  created_at: string;
}

export interface Exam {
  id: number;
  madrasah: number;
  subject: number;
  subject_name: string;
  created_by: number;
  created_by_name: string;
  title: string;
  exam_date: string;
  description: string;
  total_marks: number;
  result_count: number;
  created_at: string;
}

export interface ExamResult {
  id: number;
  exam: number;
  exam_title: string;
  student: number;
  student_name: string;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  remarks: string;
  recorded_at: string;
}

export interface Enrollment {
  id: number;
  madrasah: number;
  student: number;
  student_email: string;
  student_name: string;
  subject: number;
  subject_name: string;
  subject_name_en: string;
  school_class: number | null;
  school_class_name: string | null;
  school_class_name_ar: string | null;
  ustaadh: number | null;
  ustaadh_name: string | null;
  enrolled_at: string;
}

export interface SchoolClass {
  id: number;
  madrasah: number;
  name_ar: string;
  name_en: string;
  order: number;
  class_teacher: number | null;
  class_teacher_name: string | null;
}

export interface ClassSubject {
  id: number;
  madrasah: number;
  school_class: number;
  school_class_name: string | null;
  school_class_name_ar: string | null;
  subject: number;
  subject_name: string;
  subject_name_en: string;
  created_at: string;
}

export interface GradingResult {
  score: number;
  total: number;
  percentage: number;
  results: Record<string, {
    is_correct: boolean;
    user_answer: string;
    correct_answer: string | null;
    explanation: string;
  }>;
}

export interface TeacherDashboard {
  total_students: number;
  total_quizzes: number;
  total_attempts: number;
  subject_performance: {
    subject_id: number;
    subject_name: string;
    student_count: number;
    average_score: number;
  }[];
  recent_activity: {
    quiz_id: number;
    quiz_title: string;
    subject: string;
    attempt_count: number;
    average_score: number;
    created_at: string;
  }[];
}

export interface ParentDashboard {
  children: {
    id: number;
    name: string;
    email: string;
    overall_average: number | null;
    total_quizzes: number;
    subjects: string[];
    recent_attempts: {
      quiz_title: string;
      percentage: number | null;
      submitted_at: string | null;
    }[];
    exam_results: {
      exam_title: string;
      score: number;
      grade: string;
      exam_date: string;
    }[];
  }[];
  fee_summary: {
    total_due: number;
    total_paid: number;
    outstanding: number;
    overdue_count: number;
    overdue_amount: number;
  };
  attendance_summary: {
    total_days: number;
    present: number;
    absent: number;
    overall_rate: number;
  };
}

export interface AdminDashboard {
  total_users: number;
  total_students: number;
  total_teachers: number;
  total_parents: number;
  pending_guests: number;
  total_subjects: number;
  total_quizzes: number;
  total_exams: number;
  average_performance: number;
  subject_stats: {
    id: number;
    name_ar: string;
    student_count: number;
    quiz_count: number;
  }[];
}

export interface StudentDashboard {
  enrollments: Enrollment[];
  quizzes: Quiz[];
  attempts: QuizAttempt[];
  exam_results: ExamResult[];
}

export interface BoardDashboard {
  total_students: number;
  total_teachers: number;
  total_subjects: number;
  average_performance: number;
  teacher_effectiveness: {
    teacher_id: number;
    name: string;
    quiz_count: number;
    average_student_score: number;
    total_attempts: number;
  }[];
  top_subjects: {
    name: string;
    avg_score: number;
  }[];
}

// ─── Quizzes Module ──

export interface QuizQuestion {
  id: number;
  uuid: string;
  madrasah: number;
  subject: number;
  subject_name: string;
  topic: number | null;
  topic_name: string;
  school_class: number | null;
  school_class_name: string;
  question_type: 'mcq' | 'true_false' | 'short_answer' | 'essay';
  difficulty: number;
  marks: number;
  question_text: string;
  question_text_ar: string;
  options: Array<{ key: string; text: string; text_ar?: string }>;
  correct_answer: string;
  explanation: string;
  explanation_ar: string;
  is_active: boolean;
  question_bank: number | null;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface Quiz {
  id: number;
  uuid: string;
  madrasah: number;
  created_by: number;
  created_by_name: string;
  title: string;
  description: string;
  instructions: string;
  subject: number;
  subject_name: string;
  school_class: number;
  school_class_name: string;
  session: number | null;
  term: number | null;
  difficulty: number;
  estimated_duration_minutes: number;
  available_from: string | null;
  available_until: string | null;
  time_limit_minutes: number;
  grace_period_minutes: number;
  max_attempts: number;
  passing_score: number;
  marks_per_question: number;
  negative_marking: boolean;
  negative_mark_fraction: number;
  randomize_questions: boolean;
  randomize_options: boolean;
  one_question_per_page: boolean;
  allow_review: boolean;
  allow_back_navigation: boolean;
  show_question_numbers: boolean;
  auto_save: boolean;
  grading_mode: 'auto_immediate' | 'auto_release_later' | 'manual';
  require_fullscreen: boolean;
  max_violations: number;
  auto_submit_on_violations: boolean;
  status: 'draft' | 'published' | 'archived';
  is_published: boolean;
  source_bank: number | null;
  total_marks: number;
  question_count: number;
  attempt_count: number;
  average_score: number;
  is_available_now: boolean;
  quiz_type?: 'practice' | 'assignment' | 'test';
  question_ids?: number[];
  shuffle_questions?: boolean;
  show_results_immediately?: boolean;
  show_correct_answers?: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuizAnswerItem {
  id: number;
  attempt: number;
  question: number;
  question_text: string;
  question_text_ar: string;
  question_type: string;
  options: Array<{ key: string; text: string; text_ar?: string }>;
  selected_answer: string;
  is_correct: boolean | null;
  marks_awarded: number;
  is_flagged: boolean;
  time_spent_seconds: number | null;
  answered_at: string | null;
  correct_answer: string;
  explanation: string;
  explanation_ar: string;
}

export interface QuizAttempt {
  id: number;
  uuid: string;
  madrasah: number;
  quiz: number;
  quiz_title: string;
  source_bank: number | null;
  student: number;
  student_name: string;
  attempt_number: number;
  status: 'in_progress' | 'submitted' | 'graded' | 'released';
  score: number | null;
  total_marks: number | null;
  percentage: number | null;
  is_pass: boolean | null;
  started_at: string;
  submitted_at: string | null;
  time_spent_seconds: number | null;
  ip_address: string | null;
  answers: QuizAnswerItem[];
  violation_count: number;
  created_at: string;
}

export interface QuestionBank {
  id: number;
  madrasah: number;
  created_by: number;
  created_by_name: string;
  subject: number;
  subject_name: string;
  school_class: number;
  school_class_name: string;
  session: number;
  session_name: string;
  term: number;
  term_name: string;
  term_number: number;
  title: string;
  description: string;
  file: string | null;
  file_url: string | null;
  file_type: 'docx' | 'pdf';
  original_size: number;
  stored_size: number;
  size_saved: number;
  status: 'processing' | 'ready' | 'failed';
  error_message: string;
  question_count: number;
  converted_quiz: number | null;
  created_at: string;
  updated_at: string;
}

export interface GapAnalysis {
  analysis: string;
  cached: boolean;
  wrong_count: number;
  attempt: string;
}

export interface ViolationLog {
  id: number;
  attempt: number;
  violation_type: string;
  violation_display: string;
  details: Record<string, any>;
  timestamp: string;
}



// ── Fasaaha (Arabic Speaking Intelligence) ──
export interface SpeakingLevel {
  id: number;
  number: number;
  name: string;
  name_ar: string;
  description: string;
  target_vocabulary_count: number;
  difficulty: number;
  is_active: boolean;
  sort_order: number;
  total_missions: number;
  created_at: string;
  updated_at: string;
}

export interface MissionCategory {
  id: number;
  name: string;
  name_ar: string;
  icon: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Mission {
  id: number;
  level: number;
  level_number: number;
  level_name: string;
  category: number | null;
  category_name: string | null;
  title: string;
  title_ar: string;
  prompt_ar: string;
  prompt_transliteration: string;
  prompt_translation: string;
  expected_phrases: string[];
  hints: string[];
  difficulty: number;
  mission_type: string;
  max_time_seconds: number;
  example_audio: string | null;
  is_active: boolean;
  sort_order: number;
  created_by: number;
  created_by_name: string;
  attempt_count: number;
  created_at: string;
  updated_at: string;
}

export type MissionType =
  | 'reading' | 'pronunciation' | 'repeat_after_me' | 'free_speaking'
  | 'storytelling' | 'picture_description' | 'conversation'
  | 'role_play' | 'debate' | 'presentation'
  | 'recitation' | 'translation' | 'vocabulary' | 'grammar' | 'listening';

export const MISSION_TYPE_LABELS: Record<MissionType, string> = {
  reading: 'Reading',
  pronunciation: 'Pronunciation',
  repeat_after_me: 'Repeat After Me',
  free_speaking: 'Free Speaking',
  storytelling: 'Storytelling',
  picture_description: 'Picture Description',
  conversation: 'Conversation',
  role_play: 'Role Play',
  debate: 'Debate',
  presentation: 'Presentation',
  recitation: 'Recitation',
  translation: 'Translation',
  vocabulary: 'Vocabulary',
  grammar: 'Grammar',
  listening: 'Listening',
};

export const MISSION_TYPE_ICONS: Record<MissionType, string> = {
  reading: '📖',
  pronunciation: '🗣️',
  repeat_after_me: '🔁',
  free_speaking: '💬',
  storytelling: '📖',
  picture_description: '🖼️',
  conversation: '💭',
  role_play: '🎭',
  debate: '⚖️',
  presentation: '🎤',
  recitation: '🎵',
  translation: '🌍',
  vocabulary: '📝',
  grammar: '📐',
  listening: '🎧',
};

export interface SpeakingAttempt {
  id: number;
  uuid: string;
  student: number;
  student_name: string;
  mission: number;
  mission_title: string;
  mission_title_ar: string;
  level_number: number;
  audio_file: string;
  audio_url: string | null;
  audio_duration_ms: number | null;
  audio_size_bytes: number | null;
  notes: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'reviewed';
  activity_type: string;
  attempt_number: number;
  is_best_attempt: boolean;
  ai_analysis: AIAnalysis | null;
  teacher_review: TeacherReview | null;
  time_spent_seconds: number | null;
  final_score: number | null;
  created_at: string;
  completed_at: string | null;
}

export interface AIAnalysis {
  id: number;
  attempt: number;
  transcribed_text: string;
  transcription_provider: string;
  transcription_confidence: number;
  pronunciation_score: number;
  grammar_score: number;
  fluency_score: number;
  vocabulary_score: number;
  overall_score: number;
  pronunciation_feedback: Record<string, unknown>;
  grammar_feedback: Record<string, unknown>;
  fluency_feedback: Record<string, unknown>;
  word_scores: Array<{
    word: string;
    score: number;
    phonemes?: Array<{ phoneme: string; score: number }>;
    issues?: Array<{ type: string; severity: string; suggestion: string }>;
  }>;
  confidence_score: number | null;
  topic_relevance_score: number | null;
  fluency_words_per_minute: number | null;
  fluency_pause_ratio: number | null;
  scoring_provider: string;
  processing_time_ms: number;
  created_at: string;
}

export interface TeacherReview {
  id: number;
  attempt: number;
  teacher: number;
  teacher_name: string;
  student_name: string;
  mission_title: string;
  overall_score: number | null;
  feedback: string;
  pronunciation_notes: string;
  grammar_notes: string;
  is_approved: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface MissionAssignment {
  id: number;
  mission: number;
  mission_title: string;
  mission_title_ar: string;
  assigned_by: number;
  assigned_by_name: string;
  target_student: number | null;
  target_student_name: string | null;
  target_class: number | null;
  target_class_name: string | null;
  due_date: string | null;
  is_required: boolean;
  notes: string;
  created_at: string;
}

export interface StudentLevelProgress {
  id: number;
  student: number;
  student_name: string;
  level: number;
  level_number: number;
  level_name: string;
  level_name_ar: string;
  status: string;
  missions_attempted: number;
  missions_completed: number;
  average_score: number;
  best_score: number;
  total_time_seconds: number;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
}

export interface StudentStreak {
  id: number;
  student: number;
  student_name: string;
  current_streak: number;
  longest_streak: number;
  last_practice_date: string | null;
  total_practice_days: number;
  total_points: number;
  updated_at: string;
}

export interface Badge {
  id: number;
  name: string;
  name_ar: string;
  description: string;
  icon: string;
  category: string;
  criteria: Record<string, unknown>;
  points: number;
  is_active: boolean;
  created_at: string;
}

export interface StudentBadge {
  id: number;
  student: number;
  student_name: string;
  badge: number;
  badge_name: string;
  badge_name_ar: string;
  badge_icon: string;
  badge_category: string;
  awarded_at: string;
  awarded_by: number | null;
  awarded_by_name: string | null;
}

export interface FasaahaStudentDashboard {
  current_level: SpeakingLevel | null;
  total_attempts: number;
  completed_missions: number;
  current_streak: number;
  longest_streak: number;
  total_points: number;
  badge_count: number;
}

export interface FasaahaTeacherDashboard {
  classes_taught: number[];
  total_students: number;
  pending_reviews_count: number;
  total_attempts: number;
  average_class_score: number;
  pending_reviews: SpeakingAttempt[];
}

// ── Fasaaha Phase 3 ──

export interface DialogueSession {
  uuid: string;
  student: number;
  student_name: string;
  topic: string;
  level_number: number;
  mission: number | null;
  status: 'active' | 'completed' | 'abandoned';
  total_score: number | null;
  turn_count: number;
  duration_seconds: number;
  created_at: string;
  completed_at: string | null;
  turns?: DialogueTurn[];
}

export interface DialogueTurn {
  id: number;
  session: number;
  role: 'student' | 'ai';
  text_ar: string;
  text_en: string;
  transliteration: string;
  pronunciation_score: number | null;
  fluency_score: number | null;
  vocabulary_score: number | null;
  turn_score: number | null;
  correction: string;
  sort_order: number;
  created_at: string;
}

export interface DialogueTurnResponse {
  student_turn: DialogueTurn;
  ai_turn: DialogueTurn;
}

export interface DialogueEvaluation {
  pronunciation_score: number;
  fluency_score: number;
  vocabulary_score: number;
  turn_score: number;
  feedback: string;
}

export interface DailyGoal {
  id: number;
  student: number;
  student_name?: string;
  date: string;
  missions_target: number;
  missions_completed: number;
  minutes_target: number;
  minutes_practiced: number;
  points_earned: number;
  is_achieved: boolean;
  progress_pct: number;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardEntry {
  id: number;
  student: number;
  student_name: string;
  madrasah?: number;
  rank: number;
  points: number;
  missions_completed: number;
  average_score: number;
  current_streak: number;
  period: 'weekly' | 'monthly' | 'all_time';
  updated_at: string;
}

export interface ScoreTrend {
  date: string;
  attempts: number;
  avg_score: number;
  avg_pronunciation: number;
  avg_grammar: number;
  avg_fluency: number;
}

// ── Auth / Users ──

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  madrasah: number;
}

export interface UpdateProfilePayload {
  first_name?: string;
  last_name?: string;
  phone?: string;
  gender?: string;
  address?: string;
  date_of_birth?: string | null;
  email?: string;
}

export interface ResetPasswordPayload {
  uidb64: string;
  token: string;
  new_password: string;
}

export interface ChangePasswordPayload {
  old_password: string;
  new_password: string;
}

export interface UserCreatePayload {
  email: string;
  password?: string;
  password_confirm?: string;
  first_name: string;
  last_name: string;
  role?: string;
  madrasah?: number;
  gender?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string | null;
  is_active?: boolean;
}

export interface UserUpdatePayload {
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  madrasah?: number;
  gender?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string | null;
  is_active?: boolean;
}

export interface UserApprovePayload {
  role?: string;
  approved?: boolean;
}

export interface UserListParams {
  role?: string;
  search?: string;
  madrasah?: number;
  is_active?: boolean;
  page?: number;
  page_size?: number;
}

export interface MessagePayload {
  recipient: number;
  subject: string;
  body: string;
}

// ── Curriculum ──

export interface SubjectPayload {
  name_ar: string;
  name_en: string;
  code?: string;
  description?: string;
}

export interface TopicPayload {
  subject?: number;
  name: string;
  surah_number?: number | null;
  description?: string;
}

export interface SchoolClassPayload {
  name_ar?: string;
  name_en?: string;
  order?: number;
  class_teacher?: number | null;
}

export interface ClassSubjectPayload {
  school_class: number;
  subject: number;
}

export interface QuestionPayload {
  topic?: number;
  question_text: string;
  question_type: 'mcq' | 'fill_blank' | 'short_answer' | 'essay';
  options?: string[] | null;
  correct_answer?: string;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface ExamPayload {
  subject: number;
  title: string;
  exam_date: string;
  description?: string;
  total_marks?: number;
}

export interface ExamResultPayload {
  student: number;
  score: number;
  grade?: string;
  remarks?: string;
}

// ── Enrollments ──

export interface EnrollmentPayload {
  student: number;
  subject: number;
  ustaadh?: number | null;
  school_class?: number | null;
}

// ── Results Module ──

export interface TeacherSubject {
  id: number;
  name_ar: string;
  name_en: string;
  code: string;
}

export interface GradeScaleBand {
  id: number;
  grade_scale: number;
  min_score: number;
  max_score: number;
  grade: string;
  gpa_points: number;
  remark: string;
}

export interface GradeScale {
  id: number;
  madrasah: number;
  madrasah_name: string;
  name: string;
  is_default: boolean;
  bands: GradeScaleBand[];
  band_count: number;
  created_at: string;
}

export interface BlueprintComponent {
  id: number;
  blueprint: number;
  name: string;
  component_type: string;
  weight: number;
  max_score: number;
  order: number;
}

export interface AssessmentBlueprint {
  id: number;
  madrasah: number;
  school_class: number;
  school_class_name: string;
  name: string;
  description: string;
  is_active: boolean;
  components: BlueprintComponent[];
  total_weight: number;
  component_count: number;
  created_by: number | null;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface Assessment {
  id: number;
  madrasah: number;
  subject: number;
  subject_name: string;
  term: number;
  term_name: string;
  school_class: number;
  school_class_name: string;
  component_type: string;
  name: string;
  max_score: number;
  weight: number;
  order: number;
  score_count: number;
  created_by: number | null;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface AssessmentScore {
  id: number;
  assessment: number;
  assessment_name: string;
  assessment_max_score: number;
  student: number;
  student_name: string;
  score: number;
  remarks: string;
  entered_by: number | null;
  entered_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface ResultComponent {
  id: number;
  madrasah: number;
  subject: number;
  subject_name: string;
  term: number;
  term_name: string;
  school_class: number;
  class_name: string;
  template_item: number | null;
  component_type: string;
  name: string;
  max_score: number;
  weight: number;
  score_count: number;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface ResultComponentPayload {
  subject: number;
  term: number;
  school_class: number;
  name: string;
  component_type: string;
  max_score: number;
  weight: number;
}

export interface StudentScore {
  student: number | string;
  score: string;
  remarks?: string;
}

export interface BulkScorePayload {
  scores: StudentScore[];
}

export interface ResultSubmitPayload {
  subject: number;
  term: number;
}

export interface ResultPublishPayload {
  subject: number;
  term: number;
  action: 'publish' | 'unpublish';
}

export interface StudentResult {
  id: number;
  component: number;
  component_name: string;
  student: number;
  student_name: string;
  score: number;
  remarks: string;
  entered_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface ComponentScore {
  id?: number;
  assessment_id?: number;
  assessment_name: string;
  component_type: string;
  score: number;
  max_score: number;
  weight: number;
  remarks?: string;
}

export interface SubjectResult {
  id: number;
  student: number;
  student_name: string;
  subject: number;
  subject_name: string;
  term: number;
  term_name: string;
  school_class: number;
  school_class_name: string;
  total_score: number;
  grade: string;
  grade_remark: string;
  gpa_points: number;
  teacher_comment: string;
  status: string;
  component_scores: ComponentScore[];
  weighted_score: number;
  submitted_by: number | null;
  submitted_by_name: string;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TermResult {
  id: number;
  student: number;
  student_name: string;
  term: number;
  term_name: string;
  term_number: number;
  session_name: string;
  school_class: number;
  school_class_name: string;
  average_score: number;
  gpa: number;
  grade: string;
  grade_remark: string;
  position: number | null;
  rank_position: string;
  position_display: string;
  class_size: number;
  total_subjects: number;
  subjects_passed: number;
  subjects_failed: number;
  pass_rate: number;
  teacher_comment: string;
  principal_comment: string;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnnualResult {
  id: number;
  student: number;
  student_name: string;
  session: number;
  session_name: string;
  school_class: number;
  school_class_name: string;
  annual_average: number;
  annual_gpa: number;
  grade: string;
  grade_remark: string;
  position: number | null;
  class_size: number;
  total_subjects: number;
  subjects_passed: number;
  subjects_failed: number;
  pass_rate: number;
  promoted: boolean;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResultTemplateItem {
  id: number;
  template: number;
  component_type: string;
  name: string;
  weight: number;
  order: number;
}

export interface ResultTemplateItemPayload {
  component_type: string;
  name: string;
  weight: number;
}

export interface ResultTemplate {
  id: number;
  madrasah: number;
  school_class: number;
  school_class_name: string;
  name: string;
  items: ResultTemplateItem[];
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface ResultTemplatePayload {
  school_class?: number;
  name: string;
}

export interface AuditLogEntry {
  id: string;
  actor: number | null;
  actor_name: string;
  actor_email: string;
  action: string;
  model_name: string;
  object_id: string;
  object_repr: string;
  previous_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  reason: string;
  ip_address: string | null;
  user_agent: string;
  created_at: string;
}

// ── School Ops (fees / attendance / announcements / notifications) ──

export interface FeeStructure {
  id: number;
  madrasah: number;
  name: string;
  name_ar: string;
  amount: number;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface FeeStructurePayload {
  name: string;
  name_ar?: string;
  amount: number;
  description?: string;
  is_active?: boolean;
}

export interface FeePayment {
  id: number;
  fee: number;
  amount_paid: number;
  payment_date: string;
  payment_method: string;
  transaction_id: string;
  notes: string;
  recorded_by: number | null;
  recorded_by_name: string | null;
  created_at: string;
}

export interface Fee {
  id: number;
  madrasah: number;
  student: number;
  student_name: string;
  fee_structure: number | null;
  fee_structure_name: string | null;
  amount: string;
  paid: string;
  balance: string;
  due_date: string;
  description: string;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  payments: FeePayment[];
  created_at: string;
}

export interface FeePayload {
  student: number;
  amount?: number | string;
  due_date?: string;
  description?: string;
  status?: string;
}

export interface FeeBulkPayload {
  fee_structure?: number;
  amount?: number | string;
  due_date?: string;
  description?: string;
  assign_all?: boolean;
  selected_students?: number[];
}

export interface FeePayPayload {
  amount: number | string;
  payment_method: string;
  transaction_id?: string;
  notes?: string;
}

export interface AttendanceRecord {
  id: number;
  madrasah: number;
  student: number;
  student_name: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  marked_by: number | null;
  marked_by_name: string | null;
  notes: string;
  marked_at: string;
}

export interface AttendanceBulkRecord {
  student: number;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
}

export interface AttendanceBulkPayload {
  date: string;
  records: AttendanceBulkRecord[];
}

export interface AttendanceScanPayload {
  qr_data?: string;
  student_identifier?: string;
  scanner_location?: string;
}

export interface AttendanceScanResult {
  status: string;
  student: string;
  attendance_status: string;
  attendance_id?: number;
  scan_id?: number;
}

export interface AttendanceQRScan {
  id: number;
  madrasah: number;
  student: number;
  student_name: string;
  school_class: number | null;
  scanned_at: string;
  scanner_location: string;
  method: string;
  attendance: number | null;
  attendance_status: string | null;
}

export interface QRCodeResult {
  qr_data_url: string;
  payload: { v: number; m: number; s: number; c: number; t: string; h: string };
  expires_in_seconds: number;
}

export interface AttendanceAnalytics {
  total_days: number;
  days_present: number;
  days_absent: number;
  days_late: number;
  days_excused: number;
  weekly_rate: number;
  recent_records: { id: number; date: string; status: 'present' | 'absent' | 'late' | 'excused'; subject_name?: string }[];
  children?: { student_id: number; name: string; attendance_rate: number; total_days: number; present: number }[];
  today_absent?: number;
  today_late?: number;
  week_attendance_rate?: number;
  daily_trend?: { date: string; present: number; total: number }[];
  student_rates?: { student_id: number; name: string; attendance_rate: number; days_total: number }[];
}

export interface Announcement {
  id: number;
  madrasah: number;
  created_by: number;
  created_by_name: string;
  title: string;
  title_ar: string;
  message: string;
  audience: 'all' | 'parents' | 'teachers' | 'students';
  is_pinned: boolean;
  created_at: string;
}

export interface AnnouncementPayload {
  title: string;
  title_ar?: string;
  message: string;
  audience?: string;
  is_pinned?: boolean;
}

export interface AppNotification {
  id: number;
  recipient: number;
  notification_type: string;
  title: string;
  message: string;
  link: string;
  is_read: boolean;
  created_at: string;
}

export interface Message {
  id: number;
  madrasah: number;
  sender: number;
  sender_name: string;
  recipient: number;
  recipient_name: string;
  subject: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export interface ParentStudent {
  id: number;
  student: number;
  student_email: string;
  student_name: string;
  parent: number;
  parent_email: string;
  parent_name: string;
  relationship: string;
}

export interface MessageRecipient {
  id: number;
  name: string;
  email: string;
}

export interface InterventionResponse {
  total_alerts: number;
  students_with_alerts: number;
  alerts: {
    student: { id: number; name: string; email: string };
    alerts: { type: string; severity: string; message_ar: string; message_en: string }[];
  }[];
}

export interface AdminEngagement {
  weekly_active_students: number;
  daily_attempts: { date: string; count: number }[];
  teacher_stats: { teacher_id: number; name: string; total_attempts: number; average_score: number; student_count: number }[];
  subject_trends: { subject_id: number; name_ar: string; name_en: string; average_score: number; attempt_count: number }[];
}

export interface StudentReportPayload {
  student: { id: number; name: string; email: string };
  overall_average: number;
  total_attempts: number;
  subject_performance: { subject: string; subject_en: string; average: number; attempts: number }[];
  attendance: { rate: number; present: number; total: number };
  strong_subjects: string[];
  weak_subjects: string[];
  recommendations: { type: string; subject?: string; message_ar: string; message_en: string }[];
}

export interface PushSubscriptionPayload {
  endpoint: string;
  keys?: { p256dh: string; auth: string };
  p256dh?: string;
  auth?: string;
}

export interface VapidKey {
  publicKey: string;
}

// ── Academic ──

export interface AcademicSession {
  id: number;
  madrasah: number;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at: string;
}

export interface AcademicSessionPayload {
  name: string;
  start_date: string;
  end_date: string;
  is_current?: boolean;
}

export interface AcademicTerm {
  id: number;
  madrasah: number;
  session: number;
  session_name: string;
  name: string;
  term_number: number;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at: string;
}

export interface AcademicTermPayload {
  session?: number;
  name: string;
  term_number?: number;
  start_date: string;
  end_date: string;
  is_current?: boolean;
}

export interface AcademicCalendarEvent {
  id: number;
  madrasah: number;
  title: string;
  description: string;
  event_type: string;
  start_date: string;
  end_date: string;
  is_recurring: boolean;
  created_at: string;
}

export interface AcademicCalendarEventPayload {
  title: string;
  description?: string;
  event_type?: string;
  start_date: string;
  end_date: string;
  is_recurring?: boolean;
}

export interface ClassArm {
  id: number;
  madrasah: number;
  school_class: number;
  school_class_name: string;
  name: string;
  created_at: string;
}

export interface ClassArmPayload {
  school_class: number;
  name: string;
}

export interface TimetableSlot {
  id: number;
  timetable: number;
  day: string;
  day_of_week: number;
  period: number;
  start_time: string;
  end_time: string;
  subject: number;
  subject_name: string;
  teacher: number;
  teacher_name: string;
  room: string;
  created_at: string;
}

export interface TimetableSlotPayload {
  timetable?: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject: number;
  teacher?: number | null;
  room?: string;
}

export interface Timetable {
  id: number;
  madrasah: number;
  name: string;
  school_class: number;
  school_class_name: string;
  class_arm: number;
  class_arm_name: string;
  term: number;
  term_name: string;
  is_active: boolean;
  slot_count: number;
  created_at: string;
  updated_at: string;
}

export interface TimetableDetail extends Timetable {
  slots: TimetableSlot[];
}

export interface TimetablePayload {
  school_class?: number;
  class_arm?: number | null;
  term?: number;
  name?: string;
  is_active?: boolean;
}

export interface TimetableBulkSlotsPayload {
  slots: TimetableSlotPayload[];
}

export interface TimetableConflictResponse {
  conflicts: { teacher: string; day: string; slot1: string; slot2: string }[];
  has_conflicts: boolean;
}

export interface StudentCalendarEvents {
  events: AcademicCalendarEvent[];
  homework: { id: number; title: string; description: string; due_date: string; subject_name: string }[];
}

// ── Admissions ──

export interface AdmissionDocument {
  id: number;
  application: number;
  document_type: string;
  file: string;
  uploaded_at: string;
}

export interface AdmissionApplication {
  id: number;
  madrasah: number;
  application_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  address: string;
  previous_school: string;
  applying_for_class: number | null;
  applying_for_class_name: string | null;
  status: string;
  interview_date: string | null;
  interview_notes: string;
  entrance_score: number | null;
  entrance_result: Record<string, unknown>;
  accepted_at: string | null;
  enrolled_at: string | null;
  rejected_reason: string;
  documents: AdmissionDocument[];
  created_at: string;
  updated_at: string;
}

export interface AdmissionApplicationListItem {
  id: number;
  madrasah: number;
  application_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  address: string;
  previous_school: string;
  applying_for_class: number | null;
  applying_for_class_name: string | null;
  class_applied: number;
  class_applied_name: string;
  status: 'pending' | 'reviewed' | 'interviewed' | 'accepted' | 'rejected' | 'enrolled';
  rejection_reason: string;
  interview_date: string;
  interview_notes: string;
  entrance_score: string;
  documents: { id: number; name: string; file: string; uploaded_at: string }[];
  notes: string;
  accepted_at: string | null;
  enrolled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdmissionApplicationPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  address?: string;
  previous_school?: string;
  applying_for_class?: number | null;
  class_applied?: number | null;
  status?: string;
  interview_date?: string | null;
  interview_notes?: string;
  entrance_score?: number | null;
  entrance_result?: Record<string, unknown>;
  rejected_reason?: string;
  notes?: string;
}

export interface AdmissionEnrollResult {
  detail: string;
  application: AdmissionApplication;
  student_id: number;
  email: string;
}

// ── Lessons ──

export interface LessonResource {
  id: number;
  lesson: number;
  resource_type: string;
  title: string;
  url: string;
  file: string;
  description: string;
  order: number;
  created_at: string;
}

export interface LessonPlan {
  id: number;
  uuid: string;
  madrasah: number;
  teacher: number;
  teacher_name: string;
  subject: number;
  subject_name: string;
  school_class: number;
  school_class_name: string;
  class_obj: number;
  class_name: string;
  class_arm: number | null;
  class_arm_name: string | null;
  term: number | null;
  term_name: string | null;
  scheme_week: number | null;
  timetable_slot: number | null;
  title: string;
  lesson_date: string;
  date: string;
  start_time: string;
  end_time: string;
  room: string;
  duration_minutes: number;
  learning_objectives: string[];
  success_criteria: string[];
  keywords: string[];
  prior_knowledge: string;
  teaching_materials: string[];
  references: string[];
  teaching_methods: string[];
  introduction: string;
  lesson_development: string;
  student_activities: string[];
  differentiation: string;
  assessment: string;
  homework: string;
  resources: string;
  objectives: string;
  notes: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  approved_by: number | null;
  approved_by_name: string | null;
  approval_notes: string;
  submitted_at: string | null;
  approved_at: string | null;
  ai_generated: boolean;
  ai_prompt: string;
  attachments: unknown[];
  resources_list: LessonResource[];
  created_at: string;
  updated_at: string;
}

export interface LessonPlanPayload {
  subject?: number;
  school_class?: number;
  title?: string;
  lesson_date?: string;
  class_obj?: number;
  date?: string;
  objectives?: string;
  notes?: string;
  status?: string;
  duration_minutes?: number;
  start_time?: string | null;
  end_time?: string | null;
  room?: string;
  class_arm?: number | null;
  term?: number | null;
  scheme_week?: number | null;
  timetable_slot?: number | null;
  learning_objectives?: string[];
  success_criteria?: string[];
  keywords?: string[];
  prior_knowledge?: string;
  teaching_materials?: string[];
  references?: string[];
  teaching_methods?: string[];
  introduction?: string;
  lesson_development?: string;
  student_activities?: string[];
  differentiation?: string;
  assessment?: string;
  homework?: string;
  resources?: string;
  ai_generated?: boolean;
  ai_prompt?: string;
  attachments?: unknown[];
}

export interface LessonPlanApprovalPayload {
  status: 'approved' | 'rejected';
  notes?: string;
}

export interface Homework {
  id: number;
  madrasah: number;
  lesson_plan: number | null;
  teacher: number;
  teacher_name: string;
  subject: number;
  subject_name: string;
  school_class: number;
  school_class_name: string;
  class_obj: number;
  class_name: string;
  title: string;
  description: string;
  due_date: string;
  total_marks: number;
  attachments: string[];
  file: string | null;
  is_published: boolean;
  published: boolean;
  late_submission_allowed: boolean;
  submission_count: number;
  submissions_count: number;
  status: 'active' | 'overdue' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface HomeworkPayload {
  lesson_plan?: number | null;
  subject?: number;
  school_class?: number;
  class_obj?: number;
  title: string;
  description: string;
  due_date: string;
  total_marks?: number;
  attachments?: unknown[];
  file?: File | string | null;
  is_published?: boolean;
  late_submission_allowed?: boolean;
}

export interface HomeworkSubmission {
  id: number;
  madrasah: number;
  homework: number;
  homework_title: string;
  student: number;
  student_name: string;
  submitted_at: string;
  content: string;
  answer: string;
  answer_text: string;
  file: string;
  attachments: unknown[];
  is_late: boolean;
  grade: number | null;
  score: string | null;
  feedback: string;
  graded_by: number | null;
  graded_by_name: string | null;
  graded_at: string | null;
  status: 'submitted' | 'graded' | 'returned';
  is_graded: boolean;
}

export interface HomeworkSubmitPayload {
  answer?: string;
  content?: string;
  file?: File | string | null;
  attachments?: unknown[];
}

export interface HomeworkGradePayload {
  score?: number;
  feedback?: string;
  status?: string;
}

// ── Quran ──

export interface QuranMemorization {
  id: number;
  madrasah: number;
  student: number;
  student_name: string;
  surah_number: number;
  surah_name: string;
  surah: number;
  ayah_start: number;
  ayah_end: number;
  memorization_date: string;
  date: string;
  score: number;
  notes: string;
  teacher: number | null;
  teacher_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuranMemorizationPayload {
  student?: number;
  surah_number?: number;
  surah_name?: string;
  surah?: number;
  ayah_start: number;
  ayah_end: number;
  memorization_date?: string;
  date?: string;
  score?: number;
  notes?: string;
  teacher?: number | null;
}

export interface QuranRevision {
  id: number;
  madrasah: number;
  student: number;
  student_name: string;
  surah_number: number;
  surah_name: string;
  surah: number;
  ayah_start: number;
  ayah_end: number;
  revision_date: string;
  memorization: number;
  scheduled_date: string;
  completed: boolean;
  completed_at: string | null;
  score: number | null;
  notes: string;
  created_at: string;
}

export interface QuranRevisionPayload {
  student?: number;
  surah_number?: number;
  surah_name?: string;
  surah?: number;
  ayah_start: number;
  ayah_end: number;
  revision_date?: string;
  memorization?: number;
  scheduled_date?: string;
  completed?: boolean;
  completed_at?: string | null;
  score?: number | null;
  notes?: string;
}

export interface QuranTajwid {
  id: number;
  madrasah: number;
  student: number;
  student_name: string;
  teacher: number | null;
  teacher_name: string | null;
  assessment_date: string;
  surah_number: number;
  surah_name: string;
  ayah_range: string;
  makharij_score: number | null;
  sifaat_score: number | null;
  ghunna_score: number | null;
  madd_score: number | null;
  waqf_score: number | null;
  overall_score: number | null;
  notes: string;
  audio_submission: string | null;
  created_at: string;
}

export interface QuranTajwidPayload {
  student?: number;
  teacher?: number | null;
  assessment_date?: string;
  date?: string;
  surah_number?: number;
  surah_name?: string;
  ayah_range?: string;
  makharij_score?: number | null;
  sifaat_score?: number | null;
  ghunna_score?: number | null;
  qalqalah_score?: number | null;
  madd_score?: number | null;
  waqf_score?: number | null;
  overall_score?: number | null;
  notes?: string;
  audio_submission?: string | null;
}

export interface QuranStudentProgress {
  student_id: number;
  total_surahs: number;
  total_ayahs: number;
  average_score: number;
  total_surahs_memorized: number;
  total_ayahs_memorized: number;
  recent_scores: number[];
  average_memorization_score: number | null;
  average_tajwid_score: number | null;
  upcoming_revisions: QuranRevision[];
}

// ── Analytics ──

export interface AtRiskStudent {
  id: number;
  madrasah: number;
  student: number;
  student_name: string;
  risk_score: number;
  risk_level: 'low' | 'moderate' | 'high' | 'critical';
  factors: Record<string, number>;
  recommendations: string[];
  created_at: string;
  is_active: boolean;
}

export interface AtRiskGenerateResult {
  created: number;
  updated: number;
  [key: string]: unknown;
}

export interface SkillAssessment {
  id: number;
  madrasah: number;
  student: number;
  student_name: string;
  teacher: number | null;
  teacher_name: string | null;
  skill_name: string;
  score: number;
  assessment_date: string;
  notes: string;
  created_at: string;
}

export interface SkillAssessmentPayload {
  student?: number;
  teacher?: number | null;
  skill_name: string;
  score: number;
  assessment_date: string;
  notes?: string;
}

export interface PortfolioItem {
  id: number;
  madrasah: number;
  student: number;
  student_name: string;
  item_type: string;
  title: string;
  description: string;
  url: string;
  file: string | null;
  file_url?: string;
  date_achieved: string | null;
  date: string;
  created_at: string;
}

export interface PortfolioItemPayload {
  student?: number;
  item_type: string;
  title: string;
  description?: string;
  url?: string;
  file?: File | string | null;
  date?: string;
  date_achieved?: string | null;
}

export interface TeacherWorkload {
  teacher: number;
  teacher_name: string;
  lesson_plans_count: number;
  homework_count: number;
  ungraded_submissions_count: number;
  upcoming_lessons: number;
}

export interface AdminAnalyticsDashboard {
  total_students: number;
  total_teachers: number;
  today_attendance_rate: number;
  today_absentees: number;
  fees_collected_this_month: number;
  outstanding_fees: number;
  upcoming_exams: number;
  at_risk_count: number;
  ungraded_submissions: number;
  performance_trend: { month: string; avg_score: number }[];
  recent_notifications: { id: number; title: string; message: string; type: string; created_at: string }[];
}

export interface QuestionGeneratePayload {
  subject?: number;
  topic?: number | null;
  school_class?: number | null;
  question_type?: string;
  count?: number;
  difficulty?: number;
}

// ── Learning ──

export interface LearningPathItem {
  id: number;
  learning_path: number;
  title: string;
  item_type: string;
  content: string;
  order: number;
  is_completed: boolean;
  completed_at: string | null;
  score: number | null;
  created_at: string;
}

export interface LearningPath {
  id: number;
  student: number;
  student_name: string;
  subject: number;
  subject_name: string;
  title: string;
  current_level: number;
  total_levels: number;
  progress_percent: number;
  is_active: boolean;
  items: LearningPathItem[];
  total_items: number;
  completed_items: number;
  created_at: string;
  updated_at: string;
}

export interface LearningPathGeneratePayload {
  student?: number;
  subject?: number;
}

export interface LearningPathCompletePayload {
  completed?: boolean;
}

export interface FlashCardDeck {
  id: number;
  madrasah: number;
  subject: number | null;
  subject_name: string | null;
  title: string;
  description: string;
  is_shared: boolean;
  created_by: number;
  created_by_name: string;
  card_count: number;
  created_at: string;
}

export interface FlashCardDeckPayload {
  subject?: number | null;
  title: string;
  description?: string;
  is_shared?: boolean;
}

export interface FlashCard {
  id: number;
  deck: number;
  front: string;
  back: string;
  hint: string;
  difficulty: 'easy' | 'medium' | 'hard';
  order: number;
  created_at: string;
  review_count: number;
  next_review: string | null;
}

export interface FlashCardPayload {
  deck?: number;
  front: string;
  back: string;
  hint?: string;
  difficulty?: string;
  order?: number;
}

export interface FlashCardReviewPayload {
  quality: number;
}

// ── Guidance ──

export interface CareerRecommendation {
  id: number;
  madrasah: number;
  student: number;
  student_name: string;
  recommendations: { career: string; description: string; required_skills: string[]; avg_salary: string; growth_outlook: string }[];
  recommended_universities: { name: string; location: string; website: string }[];
  recommended_courses: { name: string; provider: string; duration: string }[];
  generated_at: string;
  is_current: boolean;
}

export interface SessionAttachment {
  id: number;
  filename: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
  file: string;
}

export interface AITutorSession {
  id: number;
  madrasah: number;
  student: number;
  student_name: string;
  subject: number | null;
  subject_name: string | null;
  session_id: string;
  question: string;
  response: string;
  created_at: string;
  attachments: SessionAttachment[];
}

export interface AITutorAskPayload {
  question: string;
  subject_id?: number;
  session_id?: string;
  files?: File[];
}

export interface TranscriptionResult {
  text: string;
}

// ── Character ──

export interface CharacterTrait {
  id: number;
  madrasah: number;
  name: string;
  name_ar: string;
  description: string;
  category: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface CharacterTraitPayload {
  name: string;
  name_ar?: string;
  description?: string;
  category?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface CharacterScore {
  id?: number;
  trait: number;
  trait_name?: string;
  trait_name_ar?: string;
  score: number;
  notes?: string;
}

export interface CharacterEvaluation {
  id: number;
  madrasah: number;
  student: number;
  student_name: string;
  teacher: number;
  teacher_name: string;
  evaluation_date: string;
  term: number | null;
  overall_notes: string;
  scores: CharacterScore[];
  average_score?: number | null;
  created_at: string;
  updated_at: string;
}

export interface CharacterEvaluationPayload {
  student: number;
  evaluation_date: string;
  term?: number | null;
  overall_notes?: string;
  scores: { trait: number; score: number; notes?: string }[];
}

// ── WhatsApp ──

export interface WhatsAppRecipient {
  id: number;
  madrasah: number;
  parent: number;
  parent_name: string;
  parent_email: string;
  phone_number: string;
  is_opted_in: boolean;
  opted_in_at: string | null;
  opted_out_at: string | null;
  language: 'ar' | 'en';
  created_at: string;
  updated_at: string;
}

export interface WhatsAppOptInPayload {
  parent_id: number;
  phone_number: string;
  language?: string;
}

export interface WhatsAppTemplate {
  id: number;
  madrasah: number;
  name: string;
  message_type: string;
  body_ar: string;
  body_en: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppTemplatePayload {
  name: string;
  message_type: string;
  body_ar: string;
  body_en: string;
  variables?: unknown[];
  is_active?: boolean;
}

export interface WhatsAppMessage {
  id: number;
  madrasah: number;
  recipient: number;
  recipient_name: string;
  recipient_phone: string;
  message_type: string;
  template_name: string;
  body: string;
  media_url: string;
  status: string;
  whatsapp_message_id: string;
  error_message: string;
  sent_at: string | null;
  created_at: string;
}

export interface WhatsAppSendPayload {
  parent_id: number;
  message_type?: string;
  body: string;
  phone_number?: string;
  language?: string;
}

// ── Certificates ──

export interface Certificate {
  id: string;
  madrasah: number;
  student: number;
  student_name: string;
  certificate_type: string;
  title: string;
  description: string;
  metadata: Record<string, unknown>;
  file: string | null;
  certificate_number: string;
  issued_at: string;
  created_at: string;
}

export interface CertificateGeneratePayload {
  student: number | string;
  certificate_type: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

// ── Quizzes payloads ──

export interface QuizQuestionPayload {
  subject: number;
  topic?: number | null;
  school_class?: number | null;
  question_type: string;
  difficulty?: number;
  marks?: number;
  question_text: string;
  question_text_ar?: string;
  options?: Array<{ key: string; text: string; text_ar?: string }>;
  correct_answer: string;
  explanation?: string;
  explanation_ar?: string;
}

export interface QuizPayload {
  title: string;
  description?: string;
  instructions?: string;
  subject: number;
  school_class: number;
  session?: number | null;
  term?: number | null;
  difficulty?: number;
  estimated_duration_minutes?: number;
  available_from?: string | null;
  available_until?: string | null;
  time_limit_minutes?: number;
  grace_period_minutes?: number;
  max_attempts?: number;
  passing_score?: number;
  marks_per_question?: number;
  negative_marking?: boolean;
  negative_mark_fraction?: number;
  randomize_questions?: boolean;
  randomize_options?: boolean;
  one_question_per_page?: boolean;
  allow_review?: boolean;
  allow_back_navigation?: boolean;
  show_question_numbers?: boolean;
  auto_save?: boolean;
  grading_mode?: string;
  require_fullscreen?: boolean;
  max_violations?: number;
  auto_submit_on_violations?: boolean;
  question_ids?: number[];
  assignment_class_ids?: number[];
}

export interface QuizSaveAnswerPayload {
  question_id: number;
  selected_answer: string;
}

export interface QuizViolationPayload {
  violation_type: string;
  details?: Record<string, unknown>;
}

// ── Fasaaha payloads ──

export interface SpeakingLevelPayload {
  number?: number;
  name?: string;
  name_ar?: string;
  description?: string;
  target_vocabulary_count?: number;
  difficulty?: number;
  is_active?: boolean;
  sort_order?: number;
}

export interface MissionCategoryPayload {
  name: string;
  name_ar?: string;
  icon?: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface MissionPayload {
  level?: number;
  category?: number | null;
  title: string;
  title_ar: string;
  prompt_ar: string;
  prompt_transliteration?: string;
  prompt_translation?: string;
  expected_phrases?: string[];
  hints?: string[];
  difficulty?: number;
  mission_type?: string;
  max_time_seconds?: number;
  is_active?: boolean;
  sort_order?: number;
}

export interface FasaahaReviewPayload {
  attempt: number;
  overall_score: number;
  feedback: string;
  pronunciation_notes?: string;
  grammar_notes?: string;
}

export interface FasaahaReviewUpdatePayload {
  overall_score?: number;
  feedback?: string;
  is_approved?: boolean;
  pronunciation_notes?: string;
  grammar_notes?: string;
}

export interface FasaahaAssignmentPayload {
  mission: number;
  target_student?: number | null;
  target_class?: number | null;
  due_date?: string | null;
  is_required?: boolean;
  notes?: string;
}

export interface FasaahaBadgePayload {
  name: string;
  name_ar?: string;
  description?: string;
  icon?: string;
  category?: string;
  criteria?: Record<string, unknown>;
  points?: number;
  is_active?: boolean;
}

export interface FasaahaDialogueStartPayload {
  topic: string;
  level_number?: number;
  mission?: number;
}

export interface FasaahaDialogueTurnPayload {
  text_ar: string;
}

// ── Fasaaha (Arabic Speaking Intelligence) ──
