import { useEffect, useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { fasaahaAPI } from '../../../api';
import type { Mission, SpeakingLevel, MissionCategory } from '../../../types';
import { unwrapPaginated } from '../../../api/client';
import { SkeletonTable } from '../../../components/Skeleton';
import ConfirmModal from '../../../components/ConfirmModal';

const empty = { title: '', title_ar: '', prompt_ar: '', prompt_translation: '', prompt_transliteration: '', difficulty: 2, max_time_seconds: 60, level: 0, category: null as number | null };

export default function FasaahaMissionManager() {
  const { t } = useLanguage();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [levels, setLevels] = useState<SpeakingLevel[]>([]);
  const [categories, setCategories] = useState<MissionCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([fasaahaAPI.missions.list(), fasaahaAPI.levels.list(), fasaahaAPI.categories.list()])
      .then(([m, l, c]) => {
        setMissions(unwrapPaginated(m.data));
        setLevels(unwrapPaginated(l.data));
        setCategories(unwrapPaginated(c.data));
      }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm({ ...empty, level: levels[0]?.id ?? 0 }); setEditingId(null); setShowForm(true); };
  const openEdit = (m: Mission) => { setForm({ title: m.title, title_ar: m.title_ar, prompt_ar: m.prompt_ar, prompt_translation: m.prompt_translation, prompt_transliteration: m.prompt_transliteration, difficulty: m.difficulty, max_time_seconds: m.max_time_seconds, level: m.level, category: m.category }); setEditingId(m.id); setShowForm(true); };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (editingId) { await fasaahaAPI.missions.update(editingId, form); }
      else { await fasaahaAPI.missions.create(form); }
      setShowForm(false); load();
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fasaahaAPI.missions.delete(deleteId);
    setDeleteId(null); load();
  };

  if (loading) return <SkeletonTable />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{t('fasaaha.manageMissions')}</h1>
        <button onClick={openCreate} className="btn-press px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium">{t('fasaaha.createNew')}</button>
      </div>

      {showForm && (
        <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
          <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{editingId ? t('fasaaha.editMission') : t('fasaaha.createMission')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input placeholder={t('fasaaha.title')} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', backgroundColor: '#ffffff' }} />
            <input placeholder={t('fasaaha.titleEn')} value={form.title_ar} onChange={e => setForm({ ...form, title_ar: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', backgroundColor: '#ffffff' }} />
            <textarea placeholder={t('fasaaha.arabicTextShort')} value={form.prompt_ar} onChange={e => setForm({ ...form, prompt_ar: e.target.value })} className="rounded-lg border px-3 py-2 text-sm text-right" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', backgroundColor: '#ffffff' }} rows={2} dir="rtl" />
            <input placeholder={t('fasaaha.translationText')} value={form.prompt_translation} onChange={e => setForm({ ...form, prompt_translation: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', backgroundColor: '#ffffff' }} />
            <select value={form.level} onChange={e => setForm({ ...form, level: Number(e.target.value) })} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', backgroundColor: '#ffffff' }}>
              {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <select value={form.category ?? ''} onChange={e => setForm({ ...form, category: e.target.value ? Number(e.target.value) : null })} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', backgroundColor: '#ffffff' }}>
              <option value="">{t('fasaaha.allCategories')}</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: Number(e.target.value) })} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', backgroundColor: '#ffffff' }}>
              <option value={1}>{t('fasaaha.beginner')}</option>
              <option value={2}>{t('fasaaha.intermediate')}</option>
              <option value={3}>{t('fasaaha.advanced')}</option>
              <option value={4}>{t('fasaaha.expert')}</option>
              <option value={5}>{t('fasaaha.expert')}</option>
            </select>
            <input type="number" placeholder={t('fasaaha.timeLimit')} value={form.max_time_seconds} onChange={e => setForm({ ...form, max_time_seconds: Number(e.target.value) })} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', backgroundColor: '#ffffff' }} />
          </div>
          <div className="flex gap-3">
            <button onClick={handleSubmit} disabled={saving} className="btn-press px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium disabled:opacity-50">{saving ? '...' : t('fasaaha.save')}</button>
            <button onClick={() => setShowForm(false)} className="btn-press px-4 py-2 rounded-lg border text-sm font-medium" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>{t('fasaaha.cancel')}</button>
          </div>
        </div>
      )}

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
        <table className="w-full text-sm">
          <thead style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            <tr>
              <th className="text-start px-4 py-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>{t('fasaaha.title')}</th>
              <th className="text-start px-4 py-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>{t('fasaaha.difficulty')}</th>
              <th className="text-start px-4 py-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>{t('fasaaha.timeLimit')}</th>
              <th className="text-start px-4 py-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>{t('fasaaha.attempts')}</th>
              <th className="text-end px-4 py-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>{t('fasaaha.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {missions.map(m => (
              <tr key={m.id} className="border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text-primary)' }}>{m.title}</td>
                <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">{t(`fasaaha.${m.difficulty <= 2 ? 'beginner' : m.difficulty <= 3 ? 'intermediate' : 'advanced'}`)}</span></td>
                <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{m.max_time_seconds}s</td>
                <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{m.attempt_count}</td>
                <td className="px-4 py-3 text-end space-x-2">
                  <button onClick={() => openEdit(m)} className="text-xs text-primary-600 hover:underline">{t('fasaaha.editMission')}</button>
                  <button onClick={() => setDeleteId(m.id)} className="text-xs text-red-500 hover:underline">{t('fasaaha.deleteMission')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deleteId && <ConfirmModal title={t('fasaaha.confirmDelete')} message={t('fasaaha.confirmDelete')} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} variant="danger" />}
    </div>
  );
}
