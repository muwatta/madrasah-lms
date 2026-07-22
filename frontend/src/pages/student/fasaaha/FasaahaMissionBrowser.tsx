import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { fasaahaAPI } from '../../../api';
import type { Mission, SpeakingLevel, MissionCategory } from '../../../types';
import MissionCard from '../../../components/fasaaha/MissionCard';
import { unwrapPaginated } from '../../../api/client';
import { SkeletonCard } from '../../../components/Skeleton';

export default function FasaahaMissionBrowser() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [levels, setLevels] = useState<SpeakingLevel[]>([]);
  const [categories, setCategories] = useState<MissionCategory[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fasaahaAPI.levels.list(),
      fasaahaAPI.categories.list(),
      fasaahaAPI.missions.list(),
    ]).then(([l, c, m]) => {
      setLevels(unwrapPaginated(l.data));
      setCategories(unwrapPaginated(c.data));
      setMissions(unwrapPaginated(m.data));
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: any = {};
    if (selectedLevel) params.level = selectedLevel;
    if (selectedCategory) params.category = selectedCategory;
    fasaahaAPI.missions.list(params).then(res => {
      setMissions(unwrapPaginated(res.data));
    }).finally(() => setLoading(false));
  }, [selectedLevel, selectedCategory]);

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
            {language === 'ar' ? l.name : l.name_en || l.name}
          </button>
        ))}

        <select value={selectedCategory ?? ''} onChange={e => setSelectedCategory(e.target.value ? Number(e.target.value) : null)} className="rounded-lg border px-3 py-1.5 text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', backgroundColor: '#ffffff' }}>
          <option value="">{t('fasaaha.allCategories')}</option>
          {categories.map(c => <option key={c.id} value={c.id}>{language === 'ar' ? c.name : c.name_en || c.name}</option>)}
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
