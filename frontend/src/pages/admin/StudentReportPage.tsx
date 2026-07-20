import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { schoolAPI, userAPI } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import { Skeleton, SkeletonCard, SkeletonChart } from '../../components/Skeleton';

interface Student {
  id: number;
  name: string;
  email: string;
}

interface SubjectPerformance {
  subject: string;
  subject_en: string;
  average: number;
  attempts: number;
}

interface Recommendation {
  type: string;
  subject?: string;
  message_ar: string;
  message_en: string;
}

interface ReportData {
  student: Student;
  overall_average: number;
  total_attempts: number;
  subject_performance: SubjectPerformance[];
  attendance: { rate: number; present: number; total: number };
  strong_subjects: string[];
  weak_subjects: string[];
  recommendations: Recommendation[];
}

function getScoreColor(score: number) {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-500';
}

function getScoreBg(score: number) {
  if (score >= 80) return 'bg-emerald-50 border-emerald-200';
  if (score >= 60) return 'bg-amber-50 border-amber-200';
  return 'bg-red-50 border-red-200';
}

function getBarFill(score: number) {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

function getRecommendationIcon(type: string) {
  if (type === 'weak_subject') return { icon: '⚠️', style: 'border-amber-200 bg-amber-50' };
  if (type === 'attendance') return { icon: '📋', style: 'border-blue-200 bg-blue-50' };
  return { icon: '🌟', style: 'border-emerald-200 bg-emerald-50' };
}

export default function StudentReportPage() {
  const { t, language } = useLanguage();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedId, setSelectedId] = useState<number | ''>('');
  const [report, setReport] = useState<ReportData | null>(null);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    userAPI.list({ role: 'student' })
      .then((res) => setStudents(res.data.results || res.data))
      .catch(() => setError(language === 'ar' ? 'فشل تحميل الطلاب' : 'Failed to load students'))
      .finally(() => setLoadingStudents(false));
  }, [language]);

  useEffect(() => {
    if (selectedId === '') {
      setReport(null);
      return;
    }
    setLoadingReport(true);
    setError('');
    schoolAPI.studentReport(selectedId as number)
      .then((res) => setReport(res.data))
      .catch((err) => setError(err.response?.data?.detail || t('studentReport.loadFailed')))
      .finally(() => setLoadingReport(false));
  }, [selectedId, language, t]);

  const chartData = report?.subject_performance.map((s) => ({
    name: language === 'ar' ? s.subject : s.subject_en,
    average: s.average,
    attempts: s.attempts,
  })) || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-[var(--color-text-primary)]">{t('studentReport.title')}</h1>

      <div className="rounded-xl border border-gray-100 dark:border-[var(--color-border-light)] bg-white dark:bg-[var(--color-bg-secondary)] p-4 shadow-sm opacity-0 animate-slide-up">
        <label className="mb-1 block text-xs font-medium text-gray-500">{t('studentReport.selectStudent')}</label>
        {loadingStudents ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : '')}
            className="w-full rounded-lg border border-gray-200 dark:border-[var(--color-border)] bg-gray-50 dark:bg-[var(--color-bg-primary)] px-3 py-2.5 text-sm text-gray-900 dark:text-[var(--color-text-primary)] focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">{language === 'ar' ? '-- اختر طالب --' : '-- Select a student --'}</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400">{error}</div>
      )}

      {loadingReport && (
        <div className="space-y-6"><SkeletonCard /><SkeletonChart /><SkeletonCard /></div>
      )}

      {report && !loadingReport && (
        <>
          <div className="rounded-xl border border-gray-100 dark:border-[var(--color-border-light)] bg-white dark:bg-[var(--color-bg-secondary)] p-6 shadow-sm opacity-0 animate-slide-up">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-xl font-bold text-primary-700">
                {report.student.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-[var(--color-text-primary)]">{report.student.name}</h2>
                <p className="text-sm text-gray-400">{report.student.email}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className={`card-hover rounded-xl border p-5 shadow-sm ${getScoreBg(report.overall_average)}`}>
              <p className="text-xs font-medium text-gray-500 dark:text-[var(--color-text-muted)]">{t('studentReport.overallAverage')}</p>
              <p className={`mt-1 text-3xl font-bold ${getScoreColor(report.overall_average)}`}>{report.overall_average}%</p>
            </div>
            <div className="card-hover rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-gray-500 dark:text-[var(--color-text-muted)]">{t('studentReport.totalAttempts')}</p>
              <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-[var(--color-text-primary)]">{report.total_attempts}</p>
            </div>
            <div className={`card-hover rounded-xl border p-5 shadow-sm ${getScoreBg(report.attendance.rate)}`}>
              <p className="text-xs font-medium text-gray-500 dark:text-[var(--color-text-muted)]">{t('studentReport.attendanceRate')}</p>
              <p className={`mt-1 text-3xl font-bold ${getScoreColor(report.attendance.rate)}`}>{report.attendance.rate}%</p>
              <p className="mt-1 text-xs text-gray-400 dark:text-[var(--color-text-muted)]">{report.attendance.present}/{report.attendance.total} {t('student.days')}</p>
            </div>
          </div>

          {report.subject_performance.length > 0 && (
            <div className="rounded-xl border border-gray-100 dark:border-[var(--color-border-light)] bg-white dark:bg-[var(--color-bg-secondary)] p-6 shadow-sm opacity-0 animate-slide-up">
              <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-[var(--color-text-secondary)]">{t('studentReport.subjectPerformance')}</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: any) => [`${value}%`, t('studentReport.average')]} />
                    <Bar dataKey="average" radius={[0, 6, 6, 0]} barSize={24}>
                      {chartData.map((entry, index) => (
                        <Cell key={index} fill={getBarFill(entry.average)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {report.subject_performance.map((s) => (
                  <div key={s.subject_en} className="flex items-center justify-between rounded-lg border border-gray-50 dark:border-[var(--color-border-light)] bg-gray-50/50 dark:bg-[var(--color-bg-primary)] px-3 py-2">
                    <span className="text-xs text-gray-700 dark:text-[var(--color-text-secondary)]">{language === 'ar' ? s.subject : s.subject_en}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400">{s.attempts} {language === 'ar' ? 'محاولة' : 'attempts'}</span>
                      <span className={`text-xs font-bold ${getScoreColor(s.average)}`}>{s.average}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-gray-100 dark:border-[var(--color-border-light)] bg-white dark:bg-[var(--color-bg-secondary)] p-6 shadow-sm opacity-0 animate-slide-up">
            <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-[var(--color-text-secondary)]">{t('attendance.title')}</h2>
            <div className="flex items-center gap-6">
              <div className="relative h-24 w-24">
                <svg width={96} height={96} className="-rotate-90">
                  <circle cx={48} cy={48} r={40} fill="none" stroke="#f3f4f6" strokeWidth="8" />
                  <circle
                    cx={48} cy={48} r={40} fill="none"
                    stroke={report.attendance.rate >= 80 ? '#22c55e' : report.attendance.rate >= 60 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - report.attendance.rate / 100)}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-lg font-bold ${getScoreColor(report.attendance.rate)}`}>{report.attendance.rate}%</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-700 dark:text-[var(--color-text-secondary)]">
                  <span className="font-semibold text-emerald-600">{report.attendance.present}</span> {language === 'ar' ? 'أيام حضور من أصل' : 'days present out of'} <span className="font-semibold">{report.attendance.total}</span>
                </p>
                <p className="mt-1 text-xs text-gray-400 dark:text-[var(--color-text-muted)]">
                  {report.attendance.rate >= 90
                    ? (language === 'ar' ? 'حضور ممتاز' : 'Excellent attendance')
                    : report.attendance.rate >= 75
                    ? (language === 'ar' ? 'حضور جيد' : 'Good attendance')
                    : (language === 'ar' ? 'يحتاج تحسين الحضور' : 'Attendance needs improvement')}
                </p>
              </div>
            </div>
          </div>

          {(report.strong_subjects.length > 0 || report.weak_subjects.length > 0) && (
            <div className="grid gap-4 sm:grid-cols-2 opacity-0 animate-slide-up">
              {report.strong_subjects.length > 0 && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100">
                      <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h3 className="text-sm font-semibold text-emerald-800">{t('studentReport.strongSubjects')}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {report.strong_subjects.map((s) => (
                      <span key={s} className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {report.weak_subjects.length > 0 && (
                <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100">
                      <svg className="h-4 w-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                    </div>
                    <h3 className="text-sm font-semibold text-amber-800">{t('studentReport.weakSubjects')}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {report.weak_subjects.map((s) => (
                      <span key={s} className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {report.recommendations.length > 0 && (
            <div className="rounded-xl border border-gray-100 dark:border-[var(--color-border-light)] bg-white dark:bg-[var(--color-bg-secondary)] p-6 shadow-sm opacity-0 animate-slide-up">
              <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-[var(--color-text-secondary)]">{t('studentReport.recommendations')}</h2>
              <div className="space-y-3">
                {report.recommendations.map((rec, i) => {
                  const { icon, style } = getRecommendationIcon(rec.type);
                  return (
                    <div key={i} className={`flex items-start gap-3 rounded-lg border p-4 ${style}`}>
                      <span className="mt-0.5 text-lg">{icon}</span>
                      <div className="flex-1">
                        <p className="inline-block rounded-full bg-white/60 dark:bg-gray-800/60 px-2 py-0.5 text-[10px] font-semibold text-gray-600 dark:text-[var(--color-text-secondary)]">
                          {rec.type === 'weak_subject' ? (language === 'ar' ? 'مادة ضعيفة' : 'Weak Subject') : rec.type === 'attendance' ? (language === 'ar' ? 'حضور' : 'Attendance') : (language === 'ar' ? 'متقدم' : 'Advanced')}
                        </p>
                        <p className="mt-1 text-sm text-gray-700">{language === 'ar' ? rec.message_ar : rec.message_en}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {!loadingReport && !report && selectedId === '' && !error && (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-[var(--color-border)] bg-white dark:bg-[var(--color-bg-secondary)] py-16 text-center opacity-0 animate-slide-up">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-[var(--color-text-primary)]">{t('studentReport.noStudent')}</p>
        </div>
      )}
    </div>
  );
}
