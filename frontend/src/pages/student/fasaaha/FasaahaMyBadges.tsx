import { useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { useFasaahaMyBadges, useFasaahaAllBadges } from '../../../hooks/useFasaaha';
import { SkeletonCard } from '../../../components/Skeleton';

export default function FasaahaMyBadges() {
  const { t, language } = useLanguage();
  const { data: earned = [], isLoading: loadingEarned } = useFasaahaMyBadges();
  const { data: allBadges = [], isLoading: loadingAll } = useFasaahaAllBadges();
  const [filter, setFilter] = useState('all');

  const loading = loadingEarned || loadingAll;
  if (loading) return <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}</div>;

  const earnedIds = new Set(earned.map(e => e.badge));
  const types = ['all', 'streak', 'score', 'missions', 'level', 'special'];
  const filtered = filter === 'all' ? allBadges : allBadges.filter(b => b.category === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{t('fasaaha.myBadges')}</h1>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{earned.length} {t('fasaaha.badges')}</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {types.map(type => (
          <button key={type} onClick={() => setFilter(type)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${filter === type ? 'bg-primary-600 text-white' : 'border'}`} style={filter === type ? undefined : { borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
            {type === 'all' ? t('fasaaha.allLevels') : type}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center py-12 text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('fasaaha.noBadges')}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(badge => {
            const isEarned = earnedIds.has(badge.id);
            const earnedRecord = earned.find(e => e.badge === badge.id);
            return (
              <div key={badge.id} className={`rounded-xl border p-4 text-center card-hover ${isEarned ? '' : 'opacity-50 grayscale'}`} style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
                <span className="text-3xl block mb-2">{badge.icon || '🏅'}</span>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{language === 'ar' ? badge.name_ar : badge.name}</p>
                {isEarned && earnedRecord && (
                  <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-muted)' }}>{t('fasaaha.earnedOn')} {new Date(earnedRecord.awarded_at).toLocaleDateString()}</p>
                )}
                {!isEarned && (
                  <span className="text-[10px] mt-1 inline-block px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800" style={{ color: 'var(--color-text-muted)' }}>🔒</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}