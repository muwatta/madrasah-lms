import { motion, useReducedMotion } from 'framer-motion';
import { BarChart3, LineChart as LineChartIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { useFasaahaScoreTrends } from '../../../hooks/useFasaaha';
import type { StudentLevelProgress } from '../../../types';
import {
  CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

interface ProgressInsightsProps {
  progress: StudentLevelProgress[];
}

export default function ProgressInsights({ progress }: ProgressInsightsProps) {
  const { t, language } = useLanguage();
  const reducedMotion = useReducedMotion();
  const { data: trends = [], isLoading: loadingTrends } = useFasaahaScoreTrends(undefined, 30);

  const chartData = trends.map((d) => ({
    date: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    overall: Math.round(d.avg_score),
    pronunciation: Math.round(d.avg_pronunciation),
    fluency: Math.round(d.avg_fluency),
  }));

  const isEmpty = !loadingTrends && chartData.length === 0 && progress.length === 0;

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {t('fasaaha.insightsTitle')}
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {t('fasaaha.insightsDesc')}
        </p>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed p-8 text-center" style={{ borderColor: 'var(--color-border)' }}>
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
            <BarChart3 className="h-7 w-7" aria-hidden />
          </span>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {t('fasaaha.insightsNoDataTitle')}
          </p>
          <p className="max-w-sm text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {t('fasaaha.insightsNoDataDesc')}
          </p>
          <Link
            to="/student/fasaaha/speak/0"
            className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-700"
          >
            {t('fasaaha.heroStartSpeaking')}
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}>
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                <LineChartIcon className="h-4 w-4 text-primary-500" aria-hidden />
                {t('fasaaha.scoreTrends')}
              </h3>
              <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>30 {t('fasaaha.days')}</span>
            </div>

            {chartData.length === 0 ? (
              <div className="flex h-56 flex-col items-center justify-center gap-2 text-center">
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('fasaaha.insightsNoDataTitle')}
                </p>
                <p className="max-w-xs text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {t('fasaaha.insightsNoDataDesc')}
                </p>
              </div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-bg-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line type="monotone" dataKey="overall" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name={t('fasaaha.overall')} />
                    <Line type="monotone" dataKey="pronunciation" stroke="#22c55e" strokeWidth={1.5} dot={{ r: 2 }} name={t('fasaaha.pronunciation')} />
                    <Line type="monotone" dataKey="fluency" stroke="#f59e0b" strokeWidth={1.5} dot={{ r: 2 }} name={t('fasaaha.fluency')} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}>
            <h3 className="mb-4 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {t('fasaaha.levelMastery')}
            </h3>
            {progress.length === 0 ? (
              <p className="py-8 text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {t('fasaaha.noMissions')}
              </p>
            ) : (
              <div className="space-y-3.5">
                {progress.map((p) => {
                  const pct = p.missions_attempted > 0 ? Math.round((p.missions_completed / p.missions_attempted) * 100) : 0;
                  const completed = p.status === 'completed';
                  return (
                    <div key={p.id}>
                      <div className="mb-1 flex items-center gap-3">
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${completed ? 'bg-green-500 text-white' : 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'}`}
                        >
                          {p.level_number}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                          {language === 'ar' ? p.level_name_ar : p.level_name}
                        </span>
                        <span className="shrink-0 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                          {p.missions_completed}/{p.missions_attempted}
                        </span>
                      </div>
                      <div className="ml-10 h-2 overflow-hidden rounded-full" style={{ background: 'var(--color-bg-muted)' }}>
                        <motion.div
                          className={`h-full rounded-full ${completed ? 'bg-green-500' : 'bg-primary-500'}`}
                          initial={reducedMotion ? { width: `${pct}%` } : { width: 0 }}
                          whileInView={{ width: `${pct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
