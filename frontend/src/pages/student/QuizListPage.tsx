import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { quizAPI, subjectAPI, attemptAPI } from '../../api';
import type { Quiz, Subject, QuizAttempt } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function QuizListPage() {
  const { t, language } = useLanguage();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [filterSubject, setFilterSubject] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true);
      try {
        const params: Record<string, number> = {};
        if (filterSubject !== '') params.subject = filterSubject;
        const [quizRes, attemptRes] = await Promise.all([
          quizAPI.list(params),
          attemptAPI.myAttempts(),
        ]);
        setQuizzes(quizRes.data.results || quizRes.data || []);
        setAttempts(attemptRes.data.results || attemptRes.data || []);
      } catch (err: any) {
        setError(err.response?.data?.detail || t('student.loadQuizzesFailed'));
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, [filterSubject]);

  useEffect(() => {
    subjectAPI.list().then((res) => setSubjects(res.data.results || res.data || [])).catch(() => {});
  }, []);

  const attemptMap = useMemo(() => {
    const map = new Map<number, QuizAttempt[]>();
    attempts.forEach((a) => {
      const existing = map.get(a.quiz) || [];
      existing.push(a);
      map.set(a.quiz, existing);
    });
    return map;
  }, [attempts]);

  const groupedQuizzes = useMemo(() => {
    if (filterSubject !== '') return null;
    const groups = new Map<number, { subject: Subject; quizzes: Quiz[] }>();
    quizzes.forEach((q) => {
      const existing = groups.get(q.subject);
      if (existing) {
        existing.quizzes.push(q);
      } else {
        const subj = subjects.find((s) => s.id === q.subject);
        groups.set(q.subject, {
          subject: subj || { id: q.subject, name_ar: q.subject_name, name_en: q.subject_name } as Subject,
          quizzes: [q],
        });
      }
    });
    return Array.from(groups.values());
  }, [quizzes, filterSubject, subjects]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
        <h1 className="text-2xl font-bold text-gray-800">{t('student.quizzes')}</h1>
        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value ? Number(e.target.value) : '')}
          className="px-4 py-2 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
        >
          <option value="">{t('filters.allSubjects')}</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{language === 'ar' ? s.name_ar : s.name_en}</option>
          ))}
        </select>
      </div>
      <p className="text-sm text-gray-500 mb-6">{t('guides.quizList')}</p>

      {loading ? (
        <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">{error}</div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">{t('student.noQuizzesAvailable')}</div>
      ) : groupedQuizzes ? (
        <div className="space-y-8">
          {groupedQuizzes.map((group) => (
            <div key={group.subject.id}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg font-semibold text-gray-800">{language === 'ar' ? group.subject.name_ar : group.subject.name_en}</h2>
                <span className="text-sm text-gray-400">({group.quizzes.length})</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.quizzes.map((quiz) => {
                  const quizAttempts = attemptMap.get(quiz.id) || [];
                  const completedAttempts = quizAttempts.filter((a) => a.score !== null);
                  const avgScore = completedAttempts.length > 0
                    ? Math.round(completedAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / completedAttempts.length)
                    : null;
                  return (
                    <div key={quiz.id} className="bg-white rounded-xl shadow border border-emerald-100 p-6 flex flex-col">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">{quiz.title}</h3>
                        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{quiz.description}</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">{quiz.subject_name}</span>
                          <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                            {quiz.quiz_type === 'practice' ? t('quizTypes.practice') : quiz.quiz_type === 'assignment' ? t('quizTypes.assignment') : t('quizTypes.test')}
                          </span>
                          <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600">{quiz.question_count} {t('student.questions')}</span>
                          {quiz.time_limit_minutes && (
                            <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700">{quiz.time_limit_minutes} {t('student.minutes')}</span>
                          )}
                        </div>
                        {completedAttempts.length > 0 && (
                          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                            <span>{completedAttempts.length} {t('quizManagement.attempts')}</span>
                            <span className={`font-semibold ${avgScore !== null && avgScore >= quiz.passing_score ? 'text-green-600' : 'text-red-500'}`}>
                              {avgScore}%
                            </span>
                            <span className="text-gray-400">{t('fields.passingScore')}: {quiz.passing_score}%</span>
                          </div>
                        )}
                      </div>
                      <Link
                        to={`/student/quizzes/${quiz.id}/take`}
                        className="mt-4 block text-center py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition"
                      >
                        {completedAttempts.length > 0 ? t('student.continueLabel') : t('student.startQuiz')}
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => {
            const quizAttempts = attemptMap.get(quiz.id) || [];
            const completedAttempts = quizAttempts.filter((a) => a.score !== null);
            const avgScore = completedAttempts.length > 0
              ? Math.round(completedAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / completedAttempts.length)
              : null;
            return (
              <div key={quiz.id} className="bg-white rounded-xl shadow border border-emerald-100 p-6 flex flex-col">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-800 mb-2">{quiz.title}</h2>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{quiz.description}</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">{quiz.subject_name}</span>
                    <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                      {quiz.quiz_type === 'practice' ? t('quizTypes.practice') : quiz.quiz_type === 'assignment' ? t('quizTypes.assignment') : t('quizTypes.test')}
                    </span>
                    <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600">{quiz.question_count} {t('student.questions')}</span>
                    {quiz.time_limit_minutes && (
                      <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700">{quiz.time_limit_minutes} {t('student.minutes')}</span>
                    )}
                  </div>
                  {completedAttempts.length > 0 && (
                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                      <span>{completedAttempts.length} {t('quizManagement.attempts')}</span>
                      <span className={`font-semibold ${avgScore !== null && avgScore >= quiz.passing_score ? 'text-green-600' : 'text-red-500'}`}>
                        {avgScore}%
                      </span>
                      <span className="text-gray-400">{t('fields.passingScore')}: {quiz.passing_score}%</span>
                    </div>
                  )}
                </div>
                <Link
                  to={`/student/quizzes/${quiz.id}/take`}
                  className="mt-4 block text-center py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition"
                >
                  {completedAttempts.length > 0 ? t('student.continueLabel') : t('student.startQuiz')}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
