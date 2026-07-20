import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { analyticsAPI } from '../../api';
import { unwrapPaginated } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { Skeleton, SkeletonStatsGrid, SkeletonChart, SkeletonTable } from '../../components/Skeleton';

interface AtRiskStudent {
  id: number;
  student: number;
  student_name: string;
  risk_score: number;
  risk_level: 'critical' | 'high' | 'moderate' | 'low';
  factors: Record<string, number>;
  recommendations: string[];
  created_at: string;
}

const RISK_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  high: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  moderate: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  low: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AtRiskPage() {
  const { t, language } = useLanguage();
  const [students, setStudents] = useState<AtRiskStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>('');

  const loadData = () => {
    setLoading(true);
    analyticsAPI.atRisk.list()
      .then((res) => setStudents(unwrapPaginated(res.data)))
      .catch(() => setError(t('common.loadFailed')))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [t]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    try {
      await analyticsAPI.atRisk.generate();
      loadData();
    } catch {
      setError(t('common.saveFailed'));
    } finally {
      setGenerating(false);
    }
  };

  const counts = {
    total: students.length,
    critical: students.filter((s) => s.risk_level === 'critical').length,
    high: students.filter((s) => s.risk_level === 'high').length,
    moderate: students.filter((s) => s.risk_level === 'moderate').length,
    low: students.filter((s) => s.risk_level === 'low').length,
  };

  const chartData = [
    { name: language === 'ar' ? 'حرج' : 'Critical', count: counts.critical, fill: '#ef4444' },
    { name: language === 'ar' ? 'عالي' : 'High', count: counts.high, fill: '#f97316' },
    { name: language === 'ar' ? 'متوسط' : 'Moderate', count: counts.moderate, fill: '#f59e0b' },
    { name: language === 'ar' ? 'منخفض' : 'Low', count: counts.low, fill: '#10b981' },
  ];

  const filtered = filterLevel ? students.filter((s) => s.risk_level === filterLevel) : students;

  if (loading) return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <Skeleton className="h-8 w-64" />
      <SkeletonStatsGrid />
      <SkeletonChart />
      <SkeletonTable rows={5} />
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-[var(--color-text-primary)]">{language === 'ar' ? 'الطلاب المعرضون للخطر' : 'At-Risk Students'}</h1>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="btn-press inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {generating ? (
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" /></svg>
          )}
          {language === 'ar' ? 'توليد التوقعات' : 'Generate Predictions'}
        </button>
      </div>
      <p className="text-sm text-gray-500 dark:text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] mb-6">{language === 'ar' ? 'تنبؤ بالطلاب المعرضين للخطر وتقديم التوصيات' : 'Predict at-risk students and provide recommendations'}</p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">
          {error}
          <button onClick={() => setError('')} className="me-2 underline">{t('common.close')}</button>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {[
          { label: language === 'ar' ? 'إجمالي' : 'Total', value: counts.total, color: 'text-gray-900' },
          { label: language === 'ar' ? 'حرج' : 'Critical', value: counts.critical, color: 'text-red-600' },
          { label: language === 'ar' ? 'عالي' : 'High', value: counts.high, color: 'text-orange-600' },
          { label: language === 'ar' ? 'متوسط' : 'Moderate', value: counts.moderate, color: 'text-amber-600' },
          { label: language === 'ar' ? 'منخفض' : 'Low', value: counts.low, color: 'text-emerald-600' },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-gray-100 dark:border-[var(--color-border-light)] bg-white dark:bg-[var(--color-bg-secondary)] p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-400 dark:text-[var(--color-text-muted)]">{c.label}</p>
            <p className={`mt-1 text-2xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {students.length > 0 && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-[var(--color-text-secondary)]">{language === 'ar' ? 'توزيع مستويات الخطورة' : 'Risk Level Distribution'}</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mb-4">
        <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}
          className="rounded-lg border border-gray-200 dark:border-[var(--color-border)] bg-gray-50 dark:bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-gray-700 dark:text-[var(--color-text-secondary)] focus:border-primary-400 focus:outline-none">
          <option value="">{language === 'ar' ? 'جميع المستويات' : 'All Levels'}</option>
          <option value="critical">{language === 'ar' ? 'حرج' : 'Critical'}</option>
          <option value="high">{language === 'ar' ? 'عالي' : 'High'}</option>
          <option value="moderate">{language === 'ar' ? 'متوسط' : 'Moderate'}</option>
          <option value="low">{language === 'ar' ? 'منخفض' : 'Low'}</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-[var(--color-border)] bg-white dark:bg-[var(--color-bg-secondary)] py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-[var(--color-text-primary)]">{language === 'ar' ? 'لا يوجد طلاب معرضون للخطر' : 'No at-risk students found'}</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-[var(--color-text-muted)]">{language === 'ar' ? 'اضغط "توليد التوقعات" للبدء' : 'Click "Generate Predictions" to start'}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-[var(--color-border)] bg-white dark:bg-[var(--color-bg-secondary)] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[var(--color-text-muted)]">{language === 'ar' ? 'الطالب' : 'Student'}</th>
                  <th className="px-6 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[var(--color-text-muted)]">{language === 'ar' ? 'درجة الخطورة' : 'Risk Score'}</th>
                  <th className="px-6 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[var(--color-text-muted)]">{language === 'ar' ? 'مستوى الخطورة' : 'Risk Level'}</th>
                  <th className="px-6 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[var(--color-text-muted)]">{language === 'ar' ? 'العوامل' : 'Factors'}</th>
                  <th className="px-6 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[var(--color-text-muted)]">{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((s) => {
                  const style = RISK_STYLES[s.risk_level] || RISK_STYLES.low;
                  const isExpanded = expandedId === s.id;
                  return (
                    <tr key={s.id} className={`hover:bg-gray-50/50 cursor-pointer ${isExpanded ? 'bg-gray-50/30' : ''}`}
                      onClick={() => setExpandedId(isExpanded ? null : s.id)}>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                            {s.student_name?.charAt(0) || '?'}
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-[var(--color-text-primary)]">{s.student_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-sm font-bold text-gray-900">{s.risk_score.toFixed(1)}</td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.bg} ${style.text}`}>
                          {s.risk_level.charAt(0).toUpperCase() + s.risk_level.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-500 max-w-[200px] truncate">
                        {Object.keys(s.factors || {}).join(', ') || '-'}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-500">{formatDate(s.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {expandedId && (() => {
            const s = filtered.find((f) => f.id === expandedId);
            if (!s) return null;
            const style = RISK_STYLES[s.risk_level] || RISK_STYLES.low;
            return (
              <div className="border-t border-gray-100 dark:border-[var(--color-border-light)] bg-gray-50/50 dark:bg-[var(--color-bg-primary)] px-6 py-5">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-[var(--color-text-secondary)]">{language === 'ar' ? 'عوامل الخطورة' : 'Risk Factors'}</h3>
                    <div className="space-y-2">
                      {Object.entries(s.factors || {}).map(([factor, value]) => (
                        <div key={factor} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-[var(--color-text-secondary)] capitalize">{factor.replace(/_/g, ' ')}</span>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                              <div className={`h-full rounded-full ${style.bg}`} style={{ width: `${Math.min(Number(value) * 100, 100)}%` }} />
                            </div>
                            <span className="text-xs font-medium text-gray-500">{(Number(value) * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-[var(--color-text-secondary)]">{language === 'ar' ? 'التوصيات' : 'Recommendations'}</h3>
                    {s.recommendations && s.recommendations.length > 0 ? (
                      <ul className="space-y-2">
                        {s.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <svg className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-400 dark:text-[var(--color-text-muted)]">{language === 'ar' ? 'لا توجد توصيات' : 'No recommendations'}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
