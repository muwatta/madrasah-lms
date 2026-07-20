import { useEffect, useState } from 'react';
import { attendanceAPI } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatCard from '../../components/StatCard';

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
  present: { bg: 'bg-emerald-100', text: 'text-emerald-700', labelKey: 'attendance.present' },
  absent: { bg: 'bg-red-100', text: 'text-red-700', labelKey: 'attendance.absent' },
  late: { bg: 'bg-amber-100', text: 'text-amber-700', labelKey: 'attendance.late' },
  excused: { bg: 'bg-blue-100', text: 'text-blue-700', labelKey: 'attendance.excused' },
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

  useEffect(() => {
    attendanceAPI.analytics()
      .then((res) => setAnalytics(res.data))
      .catch((err) => setError(err.response?.data?.detail || t('attendance.loadFailed')))
      .finally(() => setLoading(false));
  }, [t]);

  if (loading) return <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (error) return <div className="max-w-5xl mx-auto px-4 py-8"><div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">{error}</div></div>;
  if (!analytics) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900">{t('attendance.myAttendance')}</h1>
      </div>
      <p className="text-sm text-gray-500 mb-6">{t('guides.studentAttendance')}</p>

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

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
          <h2 className="text-sm font-semibold text-gray-700">{t('attendance.recentRecords')}</h2>
        </div>
        {analytics.recent_records.length === 0 ? (
          <p className="p-6 text-sm text-gray-500 text-center">{t('attendance.noRecords')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500">{t('attendance.date')}</th>
                  {analytics.recent_records[0]?.subject_name !== undefined && (
                    <th className="px-6 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500">{t('fields.subject')}</th>
                  )}
                  <th className="px-6 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500">{t('fields.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {analytics.recent_records.map((record) => {
                  const style = STATUS_STYLES[record.status] || STATUS_STYLES.absent;
                  return (
                    <tr key={record.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-3.5 text-sm text-gray-700">{formatDate(record.date)}</td>
                      {record.subject_name !== undefined && (
                        <td className="px-6 py-3.5 text-sm text-gray-700">{record.subject_name}</td>
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
