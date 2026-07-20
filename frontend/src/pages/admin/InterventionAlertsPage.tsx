import { useState, useEffect } from 'react';
import { interventionAPI } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import LoadingSpinner from '../../components/LoadingSpinner';

interface Alert {
  type: string;
  severity: string;
  message_ar: string;
  message_en: string;
}

interface StudentAlerts {
  student: { id: number; name: string; email: string };
  alerts: Alert[];
}

export default function InterventionAlertsPage() {
  const { t, language } = useLanguage();
  const [data, setData] = useState<{ total_alerts: number; students_with_alerts: number; alerts: StudentAlerts[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    interventionAPI.alerts()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load alerts'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (error) return <div className="max-w-5xl mx-auto px-4 py-8"><div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">{error}</div></div>;
  if (!data) return null;

  const getSeverityStyle = (severity: string) => {
    if (severity === 'critical') return 'border-red-200 bg-red-50 text-red-700';
    if (severity === 'warning') return 'border-amber-200 bg-amber-50 text-amber-700';
    return 'border-blue-200 bg-blue-50 text-blue-700';
  };

  const getSeverityIcon = (type: string) => {
    if (type === 'struggling') return '⚠️';
    if (type === 'inactive') return '😴';
    return '🌟';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('interventions.title')}</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-400">{t('interventions.studentsAtRisk')}</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{data.students_with_alerts}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-400">{language === 'ar' ? 'إجمالي التنبيهات' : 'Total Alerts'}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{data.total_alerts}</p>
        </div>
      </div>

      {data.alerts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <p className="text-sm font-medium text-gray-900">{t('interventions.noAlerts')}</p>
          <p className="mt-1 text-xs text-gray-400">{language === 'ar' ? 'جميع الطلاب ي progresses بشكل جيد' : 'All students are progressing well'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.alerts.map((sa) => (
            <div key={sa.student.id} className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 border-b border-gray-50 bg-gray-50/50 px-5 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                  {sa.student.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{sa.student.name}</p>
                  <p className="text-xs text-gray-400">{sa.student.email}</p>
                </div>
                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                  {sa.alerts.length} {language === 'ar' ? 'تنبيه' : 'alerts'}
                </span>
              </div>
              <ul className="divide-y divide-gray-50">
                {sa.alerts.map((alert, i) => (
                  <li key={i} className="flex items-start gap-3 px-5 py-3">
                    <span className="mt-0.5 text-lg">{getSeverityIcon(alert.type)}</span>
                    <div className="flex-1">
                      <p className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${getSeverityStyle(alert.severity)}`}>
                        {alert.severity}
                      </p>
                      <p className="mt-1 text-sm text-gray-700">
                        {language === 'ar' ? alert.message_ar : alert.message_en}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
