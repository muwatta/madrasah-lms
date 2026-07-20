import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { enrollmentAPI, dashboardAPI } from '../../api';
import { unwrapPaginated } from '../../api/client';
import type { Enrollment } from '../../types';
import { Skeleton, SkeletonTable, SkeletonStatsGrid } from '../../components/Skeleton';
import { useLanguage } from '../../context/LanguageContext';

interface StudentPerformance {
  student: {
    id: number;
    name: string;
    email: string;
  };
  overall_average: number | null;
  quiz_attempts: {
    id: number;
    quiz_title: string;
    percentage: number | null;
    submitted_at: string | null;
  }[];
  exam_results: {
    id: number;
    exam_title: string;
    score: number;
    grade: string;
    exam_date: string;
  }[];
}

export default function StudentPerformancePage() {
  const { t } = useLanguage();
  const [students, setStudents] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [performance, setPerformance] = useState<StudentPerformance | null>(null);
  const [perfLoading, setPerfLoading] = useState(false);

  useEffect(() => {
    enrollmentAPI.teacherStudents()
      .then((res) => setStudents(unwrapPaginated(res.data)))
      .catch(() => setError(t('teacher.loadStudentsFailed')))
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    if (selectedStudentId === null) {
      setPerformance(null);
      return;
    }
    setPerfLoading(true);
    dashboardAPI.teacherStudentPerformance(selectedStudentId)
      .then((res) => setPerformance(res.data))
      .catch(() => setError(t('teacher.loadPerformanceFailed')))
      .finally(() => setPerfLoading(false));
  }, [selectedStudentId, t]);

  const chartData = performance
    ? performance.quiz_attempts
        .filter((a) => a.submitted_at && a.percentage !== null)
        .map((a) => ({
          name: a.quiz_title.length > 20 ? a.quiz_title.slice(0, 20) + '...' : a.quiz_title,
          score: a.percentage,
          date: a.submitted_at ? new Date(a.submitted_at).toLocaleDateString() : '',
        }))
    : [];

  const uniqueStudents = students.reduce<Enrollment[]>((acc, e) => {
    if (!acc.some((s) => s.student === e.student)) acc.push(e);
    return acc;
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-80 mb-6" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="rounded-lg border border-[var(--color-border)] dark:border-gray-700 bg-[var(--color-bg-primary)] dark:bg-gray-800 shadow-sm lg:col-span-1">
            <div className="border-b border-[var(--color-border)] dark:border-gray-700 px-4 py-3">
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="table-row" />)}
            </div>
          </div>
          <div className="lg:col-span-2">
            <SkeletonTable rows={4} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-1 text-2xl font-bold text-[var(--color-text-primary)] dark:text-gray-100">{t('teacher.studentPerformance')}</h1>
      <p className="text-sm text-[var(--color-text-muted)] dark:text-gray-400 mb-6">{t('guides.studentPerformance')}</p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">
          {error}
          <button onClick={() => setError(null)} className="me-2 underline">{t('common.close')}</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="rounded-lg border border-[var(--color-border)] dark:border-gray-700 bg-[var(--color-bg-primary)] dark:bg-gray-800 shadow-sm lg:col-span-1">
          <div className="border-b border-[var(--color-border)] dark:border-gray-700 px-4 py-3">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] dark:text-gray-100">{t('teacher.students')}</h2>
          </div>
          <ul className="max-h-[600px] divide-y divide-[var(--color-border-light)] dark:divide-gray-700/50 overflow-y-auto">
            {uniqueStudents.length === 0 ? (
              <li className="p-4 text-sm text-[var(--color-text-muted)] dark:text-gray-400">{t('teacher.noStudents')}</li>
            ) : (
              uniqueStudents.map((s) => (
                <li key={s.student}>
                  <button
                    onClick={() => setSelectedStudentId(s.student)}
                    className={`w-full px-4 py-3 text-end text-sm hover:bg-[var(--color-bg-secondary)] dark:hover:bg-gray-700/50 ${
                      selectedStudentId === s.student ? 'bg-primary-50 dark:bg-primary-900/20 border-s-2 border-primary-600' : ''
                    }`}
                  >
                    <div className="font-medium text-[var(--color-text-primary)] dark:text-gray-100">{s.student_name}</div>
                    <div className="text-xs text-[var(--color-text-muted)] dark:text-gray-400">{s.subject_name}</div>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="lg:col-span-2">
          {selectedStudentId === null ? (
            <div className="rounded-lg border border-[var(--color-border)] dark:border-gray-700 bg-[var(--color-bg-primary)] dark:bg-gray-800 p-12 text-center shadow-sm">
              <p className="text-[var(--color-text-muted)] dark:text-gray-400">{t('teacher.selectStudent')}</p>
            </div>
          ) : perfLoading ? (
            <div className="space-y-6">
              <SkeletonStatsGrid />
              <SkeletonTable rows={5} />
            </div>
          ) : performance ? (
            <div className="space-y-6">
              <div className="rounded-lg border border-[var(--color-border)] dark:border-gray-700 bg-[var(--color-bg-primary)] dark:bg-gray-800 p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)] dark:text-gray-100">
                  {performance.student.name}
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-lg bg-primary-50 dark:bg-primary-900/20 p-4 text-center">
                    <p className="text-sm text-primary-700 dark:text-primary-400">{t('teacher.overallAverage')}</p>
                    <p className="mt-1 text-2xl font-bold text-primary-800 dark:text-primary-300">
                      {performance.overall_average !== null ? `${performance.overall_average.toFixed(1)}%` : t('teacher.notAvailable')}
                    </p>
                  </div>
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 text-center">
                    <p className="text-sm text-blue-700 dark:text-blue-400">{t('teacher.quizAttempts')}</p>
                    <p className="mt-1 text-2xl font-bold text-blue-800 dark:text-blue-300">
                      {performance.quiz_attempts.length}
                    </p>
                  </div>
                  <div className="rounded-lg bg-purple-50 dark:bg-purple-900/20 p-4 text-center">
                    <p className="text-sm text-purple-700 dark:text-purple-400">{t('teacher.examResults')}</p>
                    <p className="mt-1 text-2xl font-bold text-purple-800 dark:text-purple-300">
                      {performance.exam_results.length}
                    </p>
                  </div>
                </div>
              </div>

              {chartData.length > 0 && (
                <div className="rounded-lg border border-[var(--color-border)] dark:border-gray-700 bg-[var(--color-bg-primary)] dark:bg-gray-800 p-6 shadow-sm">
                  <h4 className="mb-4 text-sm font-semibold text-[var(--color-text-primary)] dark:text-gray-100">{t('teacher.scoreTrend')}</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                      <YAxis domain={[0, 100]} tick={{ fill: 'var(--color-text-muted)' }} />
                      <Tooltip
                        formatter={(value) => [`${value}%`, t('fields.score')]}
                        labelFormatter={(label) => `${t('teacher.quiz')}: ${label}`}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#16a34a"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name={t('teacher.scorePercent')}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {performance.quiz_attempts.length > 0 && (
                <div className="rounded-lg border border-[var(--color-border)] dark:border-gray-700 bg-[var(--color-bg-primary)] dark:bg-gray-800 shadow-sm">
                  <div className="border-b border-[var(--color-border)] dark:border-gray-700 px-6 py-3">
                    <h4 className="text-sm font-semibold text-[var(--color-text-primary)] dark:text-gray-100">{t('teacher.quizAttempts')}</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-[var(--color-border-light)] dark:divide-gray-700/50">
                      <thead className="bg-[var(--color-bg-secondary)] dark:bg-gray-700/50">
                        <tr>
                           <th className="px-6 py-2 text-end text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] dark:text-gray-400">{t('teacher.quiz')}</th>
                           <th className="px-6 py-2 text-end text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] dark:text-gray-400">{t('fields.score')}</th>
                           <th className="px-6 py-2 text-end text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] dark:text-gray-400">{t('teacher.enrollmentDate')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border-light)] dark:divide-gray-700/50">
                        {performance.quiz_attempts.map((a) => (
                          <tr key={a.id} className="hover:bg-[var(--color-bg-secondary)] dark:hover:bg-gray-700/30">
                            <td className="px-6 py-3 text-sm font-medium text-[var(--color-text-primary)] dark:text-gray-100">{a.quiz_title}</td>
                            <td className="px-6 py-3 text-sm text-[var(--color-text-secondary)] dark:text-gray-300">
                              {a.percentage !== null ? `${a.percentage.toFixed(1)}%` : t('enrollmentStatus.pending')}
                            </td>
                            <td className="px-6 py-3 text-sm text-[var(--color-text-muted)] dark:text-gray-400">
                              {a.submitted_at ? new Date(a.submitted_at).toLocaleDateString() : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {performance.exam_results.length > 0 && (
                <div className="rounded-lg border border-[var(--color-border)] dark:border-gray-700 bg-[var(--color-bg-primary)] dark:bg-gray-800 shadow-sm">
                  <div className="border-b border-[var(--color-border)] dark:border-gray-700 px-6 py-3">
                    <h4 className="text-sm font-semibold text-[var(--color-text-primary)] dark:text-gray-100">{t('teacher.examResults')}</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-[var(--color-border-light)] dark:divide-gray-700/50">
                      <thead className="bg-[var(--color-bg-secondary)] dark:bg-gray-700/50">
                        <tr>
                           <th className="px-6 py-2 text-end text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] dark:text-gray-400">{t('teacher.exam')}</th>
                           <th className="px-6 py-2 text-end text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] dark:text-gray-400">{t('fields.score')}</th>
                           <th className="px-6 py-2 text-end text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] dark:text-gray-400">{t('fields.grade')}</th>
                           <th className="px-6 py-2 text-end text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] dark:text-gray-400">{t('fields.date')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border-light)] dark:divide-gray-700/50">
                        {performance.exam_results.map((r) => (
                          <tr key={r.id} className="hover:bg-[var(--color-bg-secondary)] dark:hover:bg-gray-700/30">
                            <td className="px-6 py-3 text-sm font-medium text-[var(--color-text-primary)] dark:text-gray-100">{r.exam_title}</td>
                            <td className="px-6 py-3 text-sm text-[var(--color-text-secondary)] dark:text-gray-300">{r.score}</td>
                            <td className="px-6 py-3 text-sm">
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                r.grade === 'A' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                                : r.grade === 'B' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                                : r.grade === 'C' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                              }`}>
                                {r.grade}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-sm text-[var(--color-text-muted)] dark:text-gray-400">{r.exam_date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-[var(--color-border)] dark:border-gray-700 bg-[var(--color-bg-primary)] dark:bg-gray-800 p-12 text-center shadow-sm">
              <p className="text-[var(--color-text-muted)] dark:text-gray-400">{t('teacher.noPerformanceData')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
