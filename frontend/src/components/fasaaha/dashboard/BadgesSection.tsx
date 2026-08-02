import { Award, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { useFasaahaAllBadges, useFasaahaMyBadges } from '../../../hooks/useFasaaha';

export default function BadgesSection() {
  const { t, language } = useLanguage();
  const { data: earned = [], isLoading: loadingEarned } = useFasaahaMyBadges();
  const { data: allBadges = [], isLoading: loadingAll } = useFasaahaAllBadges();

  if (loadingEarned || loadingAll) {
    return (
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-muted)' }} />
        ))}
      </div>
    );
  }

  const earnedIds = new Set(earned.map((e) => e.badge));
  const earnedRecords = new Map(earned.map((e) => [e.badge, e]));

  const sorted = [...allBadges].sort((a, b) => {
    const aEarned = earnedIds.has(a.id) ? 0 : 1;
    const bEarned = earnedIds.has(b.id) ? 0 : 1;
    return aEarned - bEarned || a.id - b.id;
  });

  const visible = sorted.slice(0, 8);

  return (
    <div>
      <div className="mb-4 flex items-end justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
            <Award className="h-5 w-5 text-amber-500" aria-hidden />
            {t('fasaaha.badges')}
            <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
              {earned.length}
            </span>
          </h2>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {t('fasaaha.badgesDesc')}
          </p>
        </div>
        {allBadges.length > 8 && (
          <Link to="/student/fasaaha/badges" className="shrink-0 text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400">
            {t('fasaaha.viewAllBadges')}
          </Link>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-8 text-center text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
          {t('fasaaha.badgeEmpty')}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-8">
          {visible.map((badge) => {
            const isEarned = earnedIds.has(badge.id);
            const record = earnedRecords.get(badge.id);
            const name = language === 'ar' ? badge.name_ar : badge.name;
            return (
              <div
                key={badge.id}
                className={`relative flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition-transform hover:-translate-y-0.5 ${isEarned ? 'card-hover' : 'opacity-70'}`}
                style={{
                  borderColor: isEarned ? 'var(--color-border)' : 'var(--color-border-light)',
                  background: isEarned ? 'var(--color-bg-card)' : 'var(--color-bg-primary)',
                }}
                title={isEarned ? t('fasaaha.earned') : `${t('fasaaha.earnBy')}: ${badge.description}`}
              >
                <span className={`text-2xl ${isEarned ? '' : 'grayscale'}`} aria-hidden>
                  {badge.icon || '🏅'}
                </span>
                <p className="line-clamp-1 w-full text-[11px] font-semibold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
                  {name}
                </p>
                {!isEarned && (
                  <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    <Lock className="h-3 w-3" aria-hidden />
                    {t('fasaaha.locked')}
                  </span>
                )}
                {isEarned && record && (
                  <p className="w-full truncate text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                    {new Date(record.awarded_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
