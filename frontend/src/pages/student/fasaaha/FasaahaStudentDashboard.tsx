import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useFasaahaDashboard, useFasaahaProgress } from '../../../hooks/useFasaaha';
import Reveal from '../../../components/fasaaha/dashboard/Reveal';
import FasaahaHero from '../../../components/fasaaha/dashboard/FasaahaHero';
import SpeakingOverview from '../../../components/fasaaha/dashboard/SpeakingOverview';
import PrimaryLearningActions from '../../../components/fasaaha/dashboard/PrimaryLearningActions';
import RecommendedActivity from '../../../components/fasaaha/dashboard/RecommendedActivity';
import DailyGoalsSection from '../../../components/fasaaha/dashboard/DailyGoalsSection';
import AssignedMissionsSection from '../../../components/fasaaha/dashboard/AssignedMissionsSection';
import ProgressInsights from '../../../components/fasaaha/dashboard/ProgressInsights';
import BadgesSection from '../../../components/fasaaha/dashboard/BadgesSection';
import LeaderboardSection from '../../../components/fasaaha/dashboard/LeaderboardSection';
import QuickTip from '../../../components/fasaaha/dashboard/QuickTip';

function DashboardSkeleton() {
  return (
    <div className="space-y-10">
      <div className="h-72 animate-pulse rounded-3xl" style={{ background: 'var(--color-bg-muted)' }} />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl" style={{ background: 'var(--color-bg-muted)' }} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-80 animate-pulse rounded-3xl" style={{ background: 'var(--color-bg-muted)' }} />
        ))}
      </div>
    </div>
  );
}

export default function FasaahaStudentDashboard() {
  const { t } = useLanguage();
  const { data, isLoading: loading, error, refetch } = useFasaahaDashboard();
  const { data: progress = [] } = useFasaahaProgress();

  if (loading) return <DashboardSkeleton />;

  if (error || !data) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed p-10 text-center" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('common.loadError')}</p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-700"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <Reveal>
        <FasaahaHero dashboard={data} />
      </Reveal>

      <Reveal delay={0.05}>
        <SpeakingOverview dashboard={data} progress={progress} />
      </Reveal>

      <PrimaryLearningActions dashboard={data} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Reveal className="lg:col-span-2">
          <RecommendedActivity dashboard={data} progress={progress} />
        </Reveal>
        <Reveal delay={0.08}>
          <DailyGoalsSection />
        </Reveal>
      </div>

      <Reveal>
        <AssignedMissionsSection />
      </Reveal>

      <Reveal>
        <ProgressInsights progress={progress} />
      </Reveal>

      <Reveal>
        <BadgesSection />
      </Reveal>

      <div className="grid gap-4 lg:grid-cols-3">
        <Reveal className="lg:col-span-2">
          <LeaderboardSection />
        </Reveal>
        <Reveal delay={0.08}>
          <QuickTip />
        </Reveal>
      </div>

      <Reveal>
        <nav aria-label={t('fasaaha.quickActions')} className="flex flex-wrap gap-2">
          {[
            { to: '/student/fasaaha/progress', label: t('fasaaha.myProgress') },
            { to: '/student/fasaaha/trends', label: t('fasaaha.scoreTrends') },
            { to: '/student/fasaaha/goals', label: t('fasaaha.dailyGoals') },
            { to: '/student/fasaaha/badges', label: t('fasaaha.myBadgesLink') },
            { to: '/student/fasaaha/leaderboard', label: t('fasaaha.leaderboard') },
          ].map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors hover:bg-primary-50 dark:hover:bg-primary-900/20"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              {a.label}
            </Link>
          ))}
        </nav>
      </Reveal>
    </div>
  );
}
