import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { useFasaahaMissions, useFasaahaLevels, useFasaahaCategories } from '../../../hooks/useFasaaha';
import type { MissionType } from '../../../types';
import { MISSION_TYPE_LABELS, MISSION_TYPE_ICONS } from '../../../types';
import MissionCard from '../../../components/fasaaha/MissionCard';
import { SkeletonCard } from '../../../components/Skeleton';

const missionTypes: MissionType[] = ['pronunciation', 'recitation', 'conversation', 'translation', 'vocabulary', 'grammar', 'listening'];

export default function FasaahaMissionBrowser() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<MissionType | null>(null);

  const { data: levels = [] } = useFasaahaLevels();
  const { data: categories = [] } = useFasaahaCategories();
  const { data: missions = [], isLoading: loading } = useFasaahaMissions({
    level: selectedLevel ?? undefined,
    category: selectedCategory ?? undefined,
    mission_type: selectedType ?? undefined,
  });

  if (loading && missions.length === 0) return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{t('fasaaha.missionsTitle')}</h1>

      <div className="flex flex-wrap gap-3">
        <button onClick={() => setSelectedLevel(null)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!selectedLevel ? 'bg-primary-600 text-white' : 'border'}`} style={!selectedLevel ? undefined : { borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
          {t('fasaaha.allLevels')}
        </button>
        {levels.map(l => (
          <button key={l.id} onClick={() => setSelectedLevel(l.id)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedLevel === l.id ? 'bg-primary-600 text-white' : 'border'}`} style={selectedLevel === l.id ? undefined : { borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
            {language === 'ar' ? l.name_ar : l.name}
          </button>
        ))}

        <select value={selectedCategory ?? ''} onChange={e => setSelectedCategory(e.target.value ? Number(e.target.value) : null)} className="rounded-lg border px-3 py-1.5 text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', backgroundColor: '#ffffff' }}>
          <option value="">{t('fasaaha.allCategories')}</option>
          {categories.map(c => <option key={c.id} value={c.id}>{language === 'ar' ? c.name_ar : c.name}</option>)}
        </select>

        <select value={selectedType ?? ''} onChange={e => setSelectedType(e.target.value as MissionType || null)} className="rounded-lg border px-3 py-1.5 text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', backgroundColor: '#ffffff' }}>
          <option value="">{t('fasaaha.typeAllTypes')}</option>
          {missionTypes.map(mt => (
            <option key={mt} value={mt}>{MISSION_TYPE_ICONS[mt]} {MISSION_TYPE_LABELS[mt]}</option>
          ))}
        </select>
      </div>

      {missions.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-muted)' }}>{t('fasaaha.noMissions')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {missions.map(m => <MissionCard key={m.id} mission={m} onStart={(id) => navigate(`/student/fasaaha/speak/${id}`)} />)}
        </div>
      )}
    </div>
  );
}