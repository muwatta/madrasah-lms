import { useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { useFasaahaScoreTrends } from '../../../hooks/useFasaaha';
import { SkeletonCard } from '../../../components/Skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function FasaahaScoreTrends() {
  const { t } = useLanguage();
  const [days, setDays] = useState(30);
  const { data: trends = [], isLoading } = useFasaahaScoreTrends(undefined, days);

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto py-6">
        <SkeletonCard />
        <div className="h-80 rounded-xl border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }} />
      </div>
    );
  }

  const chartData = trends.map((d) => ({
    date: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    overall: Math.round(d.avg_score),
    pronunciation: Math.round(d.avg_pronunciation),
    grammar: Math.round(d.avg_grammar),
    fluency: Math.round(d.avg_fluency),
  }));

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {t('fasaaha.scoreTrends')}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {t('fasaaha.scoreTrendsDesc')}
        </p>
      </div>

      <div className="flex gap-2">
        {[7, 14, 30, 60].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              days === d
                ? 'bg-primary-600 text-white'
                : 'border hover:bg-gray-50'
            }`}
            style={
              days !== d
                ? { borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }
                : undefined
            }
          >
            {d} {t('fasaaha.days')}
          </button>
        ))}
      </div>

      {chartData.length === 0 ? (
        <div className="text-center py-16 rounded-xl border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('fasaaha.noTrendsData')}</p>
        </div>
      ) : (
        <div className="rounded-xl border p-6" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="overall" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name={t('fasaaha.overall')} />
              <Line type="monotone" dataKey="pronunciation" stroke="#22c55e" strokeWidth={1.5} dot={{ r: 2 }} name={t('fasaaha.pronunciation')} />
              <Line type="monotone" dataKey="grammar" stroke="#f59e0b" strokeWidth={1.5} dot={{ r: 2 }} name={t('fasaaha.grammar')} />
              <Line type="monotone" dataKey="fluency" stroke="#ef4444" strokeWidth={1.5} dot={{ r: 2 }} name={t('fasaaha.fluency')} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { key: 'overall', color: '#6366f1', label: t('fasaaha.overall') },
            { key: 'pronunciation', color: '#22c55e', label: t('fasaaha.pronunciation') },
            { key: 'grammar', color: '#f59e0b', label: t('fasaaha.grammar') },
            { key: 'fluency', color: '#ef4444', label: t('fasaaha.fluency') },
          ].map((m) => {
            const vals = chartData.map((d) => d[m.key as keyof typeof d] as number).filter(Boolean);
            const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
            return (
              <div key={m.key} className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full" style={{ background: m.color }} />
                  <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{m.label}</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{avg}%</p>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>avg {days}d</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
