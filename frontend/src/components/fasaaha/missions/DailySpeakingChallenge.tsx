import { CalendarCheck, Flame, Mic } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useDailyGoal } from '../../../hooks/useFasaaha';

interface DailySpeakingChallengeProps {
  onStart: () => void;
  disabled?: boolean;
}

export default function DailySpeakingChallenge({ onStart, disabled }: DailySpeakingChallengeProps) {
  const { t } = useLanguage();
  const { data: goal, isLoading, isError } = useDailyGoal();

  if (isError) return null;

  const achieved = !!goal?.is_achieved;
  const pct = goal?.progress_pct ?? 0;
  const current = goal?.missions_completed ?? 0;
  const target = goal?.missions_target ?? 0;

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 p-6 text-white shadow-lg shadow-emerald-900/20 sm:p-8">
      <div aria-hidden className="absolute -top-14 -right-14 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
      <div aria-hidden className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-amber-400/20 blur-2xl" />

      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-lg">
          <p className="inline-flex items-center gap-2 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-bold text-amber-200">
            <Flame className="h-4 w-4" aria-hidden />
            {t('fasaaha.dailyChallenge')}
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight">{t('fasaaha.dailyChallenge')}</h2>
          <p className="mt-1 text-sm text-white/75">{t('fasaaha.dailyChallengeDesc')}</p>
        </div>

        <div className="flex w-full items-center gap-4 md:w-auto">
          <div className="min-w-40">
            <div className="flex items-center justify-between text-[11px] font-semibold text-white/80">
              <span className="inline-flex items-center gap-1">
                <CalendarCheck className="h-3.5 w-3.5" aria-hidden />
                {t('fasaaha.dailyGoalProgress')}
              </span>
              <span>
                {current}/{target}
              </span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white/20" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-200 transition-all duration-700" style={{ width: `${Math.min(100, pct)}%` }} />
            </div>
          </div>

          <button
            onClick={onStart}
            disabled={disabled || achieved}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-emerald-800 shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Mic className="h-4 w-4" aria-hidden />
            {achieved ? t('fasaaha.missionComplete') : t('fasaaha.acceptChallenge')}
          </button>
        </div>
      </div>
      {isLoading && (
        <div className="mt-4 h-1 w-32 animate-pulse rounded-full bg-white/20" aria-hidden />
      )}
    </section>
  );
}
