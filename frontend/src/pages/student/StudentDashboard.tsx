import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardAPI } from '../../api';
import type { Quiz, QuizAttempt, Enrollment, ExamResult } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';

interface SubjectJourney {
  subjectId: number;
  subjectName: string;
  enrolled: boolean;
  quizzes: Quiz[];
  attempts: QuizAttempt[];
  avgScore: number;
  completedCount: number;
  lastActivity: string | null;
}

function getGradeColor(score: number): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-500';
}

function getProgressColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-400';
}

function getGradeBg(score: number): string {
  if (score >= 80) return 'bg-emerald-100';
  if (score >= 60) return 'bg-amber-100';
  return 'bg-red-100';
}

export default function StudentDashboard() {
  const { t } = useLanguage();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await dashboardAPI.student();
        const data = res.data;
        setEnrollments(data.enrollments || []);
        setQuizzes(data.quizzes || []);
        setAttempts(data.attempts || []);
        setExamResults(data.exam_results || []);
      } catch (err: any) {
        setError(err.response?.data?.detail || t('student.loadDashboardFailed'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const completedAttempts = useMemo(() => attempts.filter((a) => a.score !== null), [attempts]);
  const sortedAttempts = useMemo(() =>
    [...completedAttempts].sort((a, b) =>
      new Date(a.submitted_at || a.started_at).getTime() - new Date(b.submitted_at || b.started_at).getTime()
    ), [completedAttempts]);

  const subjectJourneys = useMemo(() => {
    const subjectMap = new Map<number, SubjectJourney>();

    enrollments.forEach((e) => {
      subjectMap.set(e.subject, {
        subjectId: e.subject,
        subjectName: e.subject_name,
        enrolled: true,
        quizzes: [],
        attempts: [],
        avgScore: 0,
        completedCount: 0,
        lastActivity: null,
      });
    });

    quizzes.forEach((q) => {
      const journey = subjectMap.get(q.subject);
      if (journey) {
        journey.quizzes.push(q);
      } else if (!subjectMap.has(q.subject)) {
        subjectMap.set(q.subject, {
          subjectId: q.subject,
          subjectName: q.subject_name,
          enrolled: false,
          quizzes: [q],
          attempts: [],
          avgScore: 0,
          completedCount: 0,
          lastActivity: null,
        });
      }
    });

    completedAttempts.forEach((a) => {
      const quiz = quizzes.find((q) => q.id === a.quiz);
      if (quiz) {
        const journey = subjectMap.get(quiz.subject);
        if (journey) {
          journey.attempts.push(a);
        }
      }
    });

    subjectMap.forEach((journey) => {
      if (journey.attempts.length > 0) {
        journey.avgScore = Math.round(
          journey.attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / journey.attempts.length
        );
        journey.completedCount = journey.attempts.length;
        const lastAttempt = journey.attempts[journey.attempts.length - 1];
        journey.lastActivity = lastAttempt.submitted_at || lastAttempt.started_at;
      }
    });

    return Array.from(subjectMap.values()).sort((a, b) => {
      if (a.enrolled !== b.enrolled) return a.enrolled ? -1 : 1;
      return b.avgScore - a.avgScore;
    });
  }, [enrollments, quizzes, completedAttempts]);

  const overallAvg = useMemo(() => {
    if (completedAttempts.length === 0) return 0;
    return Math.round(
      completedAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / completedAttempts.length
    );
  }, [completedAttempts]);

  const studyStreak = useMemo(() => {
    if (completedAttempts.length === 0) return 0;
    const dates = new Set(
      completedAttempts.map((a) => {
        const d = new Date(a.submitted_at || a.started_at);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      })
    );
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const key = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
      if (dates.has(key)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  }, [completedAttempts]);

  const chartData = useMemo(() =>
    sortedAttempts.slice(-12).map((a, i) => ({
      name: a.quiz_title.length > 20 ? a.quiz_title.slice(0, 20) + '...' : a.quiz_title,
      score: a.percentage || 0,
      idx: i + 1,
    })), [sortedAttempts]);

  const recentAttempts = useMemo(() =>
    [...completedAttempts]
      .sort((a, b) => new Date(b.submitted_at || b.started_at).getTime() - new Date(a.submitted_at || a.started_at).getTime())
      .slice(0, 5),
    [completedAttempts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">{t('student.myJourney')}</h1>
        <p className="text-gray-500 mt-1">{t('student.journeySubtitle')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title={t('student.enrolledSubjects')}
          value={subjectJourneys.filter((j) => j.enrolled).length}
          delay={0}
          icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>}
        />
        <StatCard
          title={t('student.quizzesCompleted')}
          value={completedAttempts.length}
          color="bg-blue-600"
          delay={60}
          icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          title={t('student.averageScore')}
          value={`${overallAvg}%`}
          color="bg-emerald-600"
          delay={120}
          icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>}
        />
        <StatCard
          title={t('student.studyStreak')}
          value={`${studyStreak} ${t('student.days')}`}
          color="bg-amber-600"
          delay={180}
          icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" /></svg>}
        />
      </div>

      {subjectJourneys.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">{t('student.enrolledSubjects')}</h2>
            <Link to="/student/quizzes" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
              {t('student.browseQuizzes')}
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectJourneys.filter((j) => j.enrolled).map((journey, i) => (
              <div key={journey.subjectId} className="card-hover bg-white rounded-xl shadow-sm border border-gray-100 p-5 opacity-0 animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-800 truncate">{journey.subjectName}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {journey.quizzes.length} {t('student.quizzesAvailable')}
                    </p>
                  </div>
                  {journey.completedCount > 0 && (
                    <span className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getGradeBg(journey.avgScore)} ${getGradeColor(journey.avgScore)}`}>
                      {journey.avgScore}%
                    </span>
                  )}
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>{journey.completedCount} / {journey.quizzes.length} {t('student.quizzesCompleted')}</span>
                    {journey.lastActivity && (
                      <span>{new Date(journey.lastActivity).toLocaleDateString()}</span>
                    )}
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${journey.completedCount > 0 ? getProgressColor(journey.avgScore) : 'bg-gray-300'}`}
                      style={{ width: `${journey.quizzes.length > 0 ? Math.min((journey.completedCount / journey.quizzes.length) * 100, 100) : 0}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {journey.completedCount > 0 ? t('student.started') : t('student.notStarted')}
                  </span>
                  <Link
                    to={`/student/quizzes?subject=${journey.subjectId}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    {journey.completedCount > 0 ? t('student.continueLabel') : t('student.startQuiz')}
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8 opacity-0 animate-slide-up" style={{ animationDelay: '250ms' }}>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('student.performanceTrend')}</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="idx" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                formatter={(value) => [`${value}%`, t('fields.score')]}
                labelFormatter={(label) => `${t('student.quiz')} #${label}`}
              />
              <Line type="monotone" dataKey="score" stroke="#059669" strokeWidth={2.5} dot={{ r: 4, fill: '#059669' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 opacity-0 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">{t('student.recentActivity')}</h2>
            <Link to="/student/results" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors">
              {t('student.quizResults')}
            </Link>
          </div>
          {recentAttempts.length === 0 ? (
            <p className="text-gray-500 text-sm">{t('student.noActivity')}</p>
          ) : (
            <div className="space-y-3">
              {recentAttempts.map((attempt) => {
                const quiz = quizzes.find((q) => q.id === attempt.quiz);
                const passingScore = quiz?.passing_score ?? 50;
                return (
                  <div key={attempt.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${getGradeBg(attempt.percentage || 0)}`}>
                      <span className={`text-sm font-bold ${getGradeColor(attempt.percentage || 0)}`}>
                        {attempt.percentage}%
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">{attempt.quiz_title}</p>
                      <p className="text-xs text-gray-400">
                        {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString() : '-'}
                      </p>
                    </div>
                    <span className={`shrink-0 inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      (attempt.percentage || 0) >= passingScore
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {(attempt.percentage || 0) >= passingScore ? t('enrollmentStatus.passed') : t('enrollmentStatus.failed')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 opacity-0 animate-slide-up" style={{ animationDelay: '350ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">{t('student.examResults')}</h2>
            <Link to="/student/exams" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors">
              {t('student.viewAll')}
            </Link>
          </div>
          {examResults.length > 0 ? (
            <div className="space-y-3">
              {examResults.slice(0, 5).map((result) => (
                <div key={result.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    result.grade === 'A' || result.grade === 'B' ? 'bg-emerald-100' :
                    result.grade === 'C' ? 'bg-amber-100' : 'bg-red-100'
                  }`}>
                    <span className={`text-sm font-bold ${
                      result.grade === 'A' || result.grade === 'B' ? 'text-emerald-600' :
                      result.grade === 'C' ? 'text-amber-600' : 'text-red-500'
                    }`}>{result.grade}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{result.exam_title}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(result.recorded_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-gray-700">{result.score}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">{t('student.noExamResults')}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 opacity-0 animate-slide-up" style={{ animationDelay: '400ms' }}>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to="/student/attendance" className="card-hover flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
              <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">{t('student.myAttendance')}</p>
              <p className="text-xs text-gray-500">{t('student.viewAttendance')}</p>
            </div>
          </Link>
          <Link to="/student/announcements" className="card-hover flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100">
              <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38a.5.5 0 01-.702-.422 7.746 7.746 0 01-.123-2.936m0 0a60.426 60.426 0 00-2.09.09m2.09-.09c1.03-.085 2.072-.13 3.124-.13m0 0c2.79 0 5.128.725 6.248 1.976.285.322.502.68.637 1.066.298.855-1.023 1.427-1.712.803-1.34-1.214-3.438-1.845-5.173-1.845m0 0v-2.25M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">{t('nav.announcements')}</p>
              <p className="text-xs text-gray-500">{t('student.viewAnnouncements')}</p>
            </div>
          </Link>
          <Link to="/student/progress" className="card-hover flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
              <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">{t('student.myProgress')}</p>
              <p className="text-xs text-gray-500">{t('student.trackProgress')}</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
