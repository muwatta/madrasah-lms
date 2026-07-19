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
