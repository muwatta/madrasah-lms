import { useEffect, useMemo, useState } from 'react';
import { attendanceAPI } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import StatCard from '../../components/StatCard';
import { SkeletonStatsGrid, SkeletonTable } from '../../components/Skeleton';

interface AttendanceRecord {
  id: number;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  subject_name?: string;
}

interface AttendanceAnalytics {
  weekly_rate: number;
  days_present: number;
  days_absent: number;
  days_late: number;
  days_excused: number;
  total_days: number;
  recent_records: AttendanceRecord[];
}

const STATUS_STYLES: Record<string, { bg: string; text: string; labelKey: string }> = {
  present: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', labelKey: 'attendance.present' },
  absent: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', labelKey: 'attendance.absent' },
  late: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', labelKey: 'attendance.late' },
  excused: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', labelKey: 'attendance.excused' },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function StudentAttendancePage() {
  const { t } = useLanguage();
  const [analytics, setAnalytics] = useState<AttendanceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const attendanceStatus = useMemo(() => {
    if (!analytics) return { label: t('attendance.weeklyRate'), color: 'text-primary-600 dark:text-primary-400' };
    if (analytics.weekly_rate >= 90) return { label: t('attendance.excellent'), color: 'text-emerald-600 dark:text-emerald-400' };
    if (analytics.weekly_rate >= 75) return { label: t('attendance.good'), color: 'text-primary-600 dark:text-primary-400' };
    if (analytics.weekly_rate >= 60) return { label: t('attendance.fair'), color: 'text-amber-600 dark:text-amber-400' };
    return { label: t('attendance.needsAttention'), color: 'text-red-600 dark:text-red-400' };
  }, [analytics, t]);

  const attendanceBreakdown = useMemo(() => {
    if (!analytics) return [];
    return [
      { key: 'present', label: t('attendance.present'), value: analytics.days_present, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
      { key: 'absent', label: t('attendance.absent'), value: analytics.days_absent, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
      { key: 'late', label: t('attendance.late'), value: analytics.days_late, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
      { key: 'excused', label: t('attendance.excused'), value: analytics.days_excused, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    ];
  }, [analytics, t]);

  useEffect(() => {
    attendanceAPI.analytics()
      .then((res) => setAnalytics(res.data))
      .catch((err) => setError(err.response?.data?.detail || t('attendance.loadFailed')))
      .finally(() => setLoading(false));
  }, [t]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="h-4 w-64 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <SkeletonStatsGrid />
        <SkeletonTable rows={5} />
      </div>
    );
  }
  if (error) return <div className="max-w-5xl mx-auto px-4 py-8"><div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-red-700 dark:text-red-400">{error}</div></div>;
  if (!analytics) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('attendance.myAttendance')}</h1>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('guides.studentAttendance')}</p>

      <div className="mb-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">{t('attendance.weeklyRate')}</p>
            <h2 className={`mt-2 text-3xl font-bold ${attendanceStatus.color}`}>{analytics.weekly_rate}%</h2>
          </div>
          <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
            <span className="font-semibold">{attendanceStatus.label}</span>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {analytics.total_days > 0 ? `${analytics.total_days} ${t('attendance.daysTracked')}` : t('attendance.noAttendanceYet')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        <StatCard
          title={t('attendance.weeklyRate')}
          value={`${analytics.weekly_rate}%`}
          icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          color="bg-primary-600"
          delay={0}
        />
        <StatCard
          title={t('attendance.present')}
          value={analytics.days_present}
          icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
          color="bg-emerald-500"
          delay={80}
        />
        <StatCard
          title={t('attendance.absent')}
          value={analytics.days_absent}
          icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>}
          color="bg-red-500"
          delay={160}
        />
        <StatCard
          title={t('attendance.late')}
          value={analytics.days_late}
          icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          color="bg-amber-500"
          delay={240}
        />
      </div>

      <div className="mb-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">{t('attendance.statusBreakdown')}</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {attendanceBreakdown.map((item) => (
            <div key={item.key} className={`rounded-lg border border-transparent p-3 ${item.color}`}>
              <p className="text-xs font-medium uppercase tracking-wider opacity-80">{item.label}</p>
              <p className="mt-2 text-2xl font-bold">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 px-6 py-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('attendance.recentRecords')}</h2>
        </div>
        {(analytics.recent_records ?? []).length === 0 ? (
          <p className="p-6 text-sm text-gray-500 dark:text-gray-400 text-center">{t('attendance.noRecords')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('attendance.date')}</th>
                  {(analytics.recent_records ?? [])[0]?.subject_name !== undefined && (
                    <th className="px-6 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('fields.subject')}</th>
                  )}
                  <th className="px-6 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('fields.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {[...(analytics.recent_records ?? [])]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((record) => {
                    const style = STATUS_STYLES[record.status] || STATUS_STYLES.absent;
                    return (
                      <tr key={record.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-3.5 text-sm text-gray-700 dark:text-gray-300">{formatDate(record.date)}</td>
                        {record.subject_name !== undefined && (
                          <td className="px-6 py-3.5 text-sm text-gray-700 dark:text-gray-300">{record.subject_name}</td>
                        )}
                        <td className="px-6 py-3.5">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.bg} ${style.text}`}>
                            {t(style.labelKey)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
