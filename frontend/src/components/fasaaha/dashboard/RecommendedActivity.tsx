import { Bot, Clock, PlayCircle, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { useFasaahaMissions } from '../../../hooks/useFasaaha';
import type { FasaahaStudentDashboard, Mission, StudentLevelProgress } from '../../../types';
import { MISSION_TYPE_ICONS, MISSION_TYPE_LABELS } from '../../../types';
import type { MissionType } from '../../../types';

interface RecommendedActivityProps {
  dashboard: FasaahaStudentDashboard;
  progress: StudentLevelProgress[];
}

export default function RecommendedActivity({ dashboard }: RecommendedActivityProps) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const levelNumber = dashboard.current_level?.number;
  const { data: missions = [] } = useFasaahaMissions({ level: levelNumber ?? undefined });

  const active = missions.filter((m) => m.is_active);
  const next: Mission | undefined = active.find((m) => m.attempt_count === 0) ?? active[0];
  const recommendConversation = !next;

  const mType = next ? ((next.mission_type || 'pronunciation') as MissionType) : null;
  const title = next ? (language === 'ar' ? next.title_ar || next.title : next.title) : null;

  const openMission = () => {
    if (!next) return;
    navigate(next.mission_type === 'reading' ? `/student/fasaaha/read/${next.id}` : `/student/fasaaha/speak/${next.id}`);
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border p-5 card-hover" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}>
      <div className="mb-1 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary-500" aria-hidden />
        <h3 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {t('fasaaha.recommendedTitle')}
        </h3>
      </div>
      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        {t('fasaaha.recommendedDesc')}
      </p>

      {recommendConversation ? (
        <div className="mt-4 flex flex-1 flex-col items-start justify-center gap-3 rounded-xl border border-dashed p-5" style={{ borderColor: 'var(--color-border)' }}>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
            <Bot className="h-6 w-6" aria-hidden />
          </span>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {t('fasaaha.readyChallenge')}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {t('fasaaha.conversationCardDesc')}
          </p>
          <Link
            to="/student/fasaaha/conversation"
            className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            <Bot className="h-3.5 w-3.5" aria-hidden />
            {t('fasaaha.tryConversation')}
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-2xl dark:bg-primary-900/30" aria-hidden>
              {mType ? (MISSION_TYPE_ICONS[mType] ?? '🗣️') : '🗣️'}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {title}
                </p>
                {next.attempt_count === 0 && dashboard.total_attempts === 0 && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    {t('fasaaha.beginnerFriendly')}
                  </span>
                )}
              </div>
              {next.prompt_ar && (
                <p dir="rtl" lang="ar" className="mt-1 truncate text-sm font-medium" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-arabic, "Cairo")' }}>
                  {next.prompt_ar}
                </p>
              )}
              <p className="mt-1 flex flex-wrap items-center gap-3 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                {mType && <span>{MISSION_TYPE_LABELS[mType]}</span>}
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" aria-hidden />
                  {next.max_time_seconds}s
                </span>
                {next.attempt_count > 0 && <span>{next.attempt_count} {t('fasaaha.totalAttempts')}</span>}
              </p>
            </div>
          </div>

          <button
            onClick={openMission}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-primary-700"
          >
            <PlayCircle className="h-4 w-4" aria-hidden />
            {next.attempt_count > 0 ? t('fasaaha.retryMission') : t('fasaaha.startRecommended')}
          </button>
        </>
      )}
    </div>
  );
}
