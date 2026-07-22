export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: 'ustaadh' | 'mudeer' | 'idaarah' | 'student' | 'parent';
  madrasah: number;
  madrasah_name: string;
  is_active: boolean;
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

export interface Quiz {
  id: number;
  madrasah: number;
  subject: number;
  subject_name: string;
  created_by: number;
  created_by_name: string;
  title: string;
  description: string;
  question_ids: number[];
  quiz_type: 'practice' | 'assignment' | 'test';
  time_limit_minutes: number | null;
  passing_score: number;
  is_published: boolean;
  question_count: number;
  attempt_count: number;
  average_score: number;
  created_at: string;
  updated_at: string;
}

export interface QuizAttempt {
  id: number;
  quiz: number;
  quiz_title: string;
  student: number;
  student_name: string;
  answers: Record<string, string>;
  score: number | null;
  percentage: number | null;
  attempt_number: number;
  started_at: string;
  submitted_at: string | null;
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
  ustaadh: number | null;
  ustaadh_name: string | null;
  enrolled_at: string;
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
  status: 'pending' | 'processing' | 'scored' | 'reviewed' | 'needs_review';
  attempt_number: number;
  is_best_attempt: boolean;
  ai_analysis: AIAnalysis | null;
  teacher_review: TeacherReview | null;
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
  pronunciation_feedback: string;
  grammar_feedback: string;
  fluency_feedback: string;
  word_scores: Record<string, unknown>;
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
