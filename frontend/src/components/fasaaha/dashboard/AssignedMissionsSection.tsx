import { Link } from 'react-router-dom';
import { BookOpen, CalendarDays } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useFasaahaAssignments, useFasaahaMissions } from '../../../hooks/useFasaaha';
import { missionRoute } from '../missions/missionStatus';

export default function AssignedMissionsSection() {
  const { t } = useLanguage();
  const { data: assignments = [], isLoading: loadingAssignments } = useFasaahaAssignments();
  const { data: missions = [] } = useFasaahaMissions();

  if (loadingAssignments) {
    return (
      <div className="space-y-3 rounded-2xl border p-5" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}>
        {[0, 1].map((i) => (
          <div key={i} className="h-8 animate-pulse rounded-lg" style={{ background: 'var(--color-bg-muted)' }} />
        ))}
      </div>
    );
  }

  if (assignments.length === 0) return null;

  const missionById = new Map(missions.map((m) => [m.id, m]));

  return (
    <div className="flex h-full flex-col rounded-2xl border p-5 card-hover" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {t('fasaaha.assignments')}
        </h3>
        <BookOpen className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} aria-hidden />
      </div>

      <div className="space-y-3">
        {assignments.map((a) => {
          const mission = missionById.get(a.mission);
          return (
            <div key={a.id} className="rounded-xl border p-3.5" style={{ borderColor: 'var(--color-border-light)', background: 'var(--color-bg-primary)' }}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--color-text-primary)' }}>
                  {a.mission_title_ar || a.mission_title}
                </p>
                {a.is_required && (
                  <span className="shrink-0 rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                    {t('fasaaha.required')}
                  </span>
                )}
              </div>
              {a.due_date && (
                <p className="mt-1.5 flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  <CalendarDays className="h-3 w-3" aria-hidden />
                  {new Date(a.due_date).toLocaleDateString()}
                </p>
              )}
              {a.notes && (
                <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{a.notes}</p>
              )}
              {mission && (
                <Link
                  to={missionRoute(mission)}
                  className="mt-2.5 inline-block rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-700"
                >
                  {t('fasaaha.startMission')}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
