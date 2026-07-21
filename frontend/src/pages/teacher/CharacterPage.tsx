import { useState, useEffect } from 'react';
import { characterAPI, enrollmentAPI } from '../../api';
import { Skeleton, SkeletonCard } from '../../components/Skeleton';
import { useLanguage } from '../../context/LanguageContext';

interface Trait { id: number; name: string; name_ar: string; category: string; is_active: boolean; }
interface Student { id: number; full_name: string; }

const TAB_KEYS = ['evaluate', 'traits', 'summary'] as const;
const CATEGORIES = ['moral', 'social', 'spiritual', 'academic', 'personal'];

export default function CharacterPage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<'evaluate'|'traits'|'summary'>('evaluate');
  const [traits, setTraits] = useState<Trait[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<number | ''>('');
  const [evalDate, setEvalDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [scores, setScores] = useState<Record<number, number>>({});
  const [showTraitForm, setShowTraitForm] = useState(false);
  const [traitForm, setTraitForm] = useState({ name: '', name_ar: '', category: 'moral' });
  const [selectedStudent, setSelectedStudent] = useState<number | ''>('');
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      characterAPI.traits.list().then(r => setTraits(r.data.results ?? r.data)),
      enrollmentAPI.teacherStudents().then(r => setStudents(r.data.results ?? r.data)),
      loadEvaluations(),
    ]).finally(() => setLoading(false));
  }, []);

  const loadEvaluations = async () => {
    try {
      const r = await characterAPI.evaluations.list();
      setEvaluations(r.data.results ?? r.data);
    } catch {}
  };

  const handleCreateEvaluation = async () => {
    if (!studentId || Object.keys(scores).length === 0) return;
    try {
      const scoresData = Object.entries(scores).map(([traitId, score]) => ({
        trait: Number(traitId), score, notes: '',
      }));
      await characterAPI.evaluations.create({
        student: Number(studentId), evaluation_date: evalDate, overall_notes: notes, scores: scoresData,
      });
      setStudentId(''); setNotes(''); setScores({});
      loadEvaluations();
    } catch {}
  };

  const handleCreateTrait = async () => {
    try {
      await characterAPI.traits.create(traitForm);
      setShowTraitForm(false);
      setTraitForm({ name: '', name_ar: '', category: 'moral' });
      const r = await characterAPI.traits.list();
      setTraits(r.data.results ?? r.data);
    } catch {}
  };

  const handleLoadSummary = async () => {
    if (!selectedStudent) return;
    try {
      const r = await characterAPI.evaluations.summary({ student: selectedStudent });
      setSummary(r.data);
    } catch {}
  };

  const getScoreLabel = (score: number) => {
    const labels = ['', t('character.scoreLabels.poor'), t('character.scoreLabels.needsImprovement'), t('character.scoreLabels.satisfactory'), t('character.scoreLabels.good'), t('character.scoreLabels.excellent')];
    return labels[score] || '';
  };

  const getCategoryLabel = (category: string) => {
    const key = `character.categories.${category}` as any;
    const label = t(key);
    return label === key ? category : label;
  };

  const tabLabels: Record<string, string> = {
    evaluate: t('character.evaluateTab'),
    traits: t('character.traitsTab'),
    summary: t('character.summaryTab'),
  };

  const inputCls = 'w-full rounded-lg border border-[var(--color-border)] dark:border-gray-600 bg-[var(--color-bg-secondary)] dark:bg-gray-700 px-3 py-2.5 text-sm text-[var(--color-text-secondary)] dark:text-gray-300 transition-colors focus:border-primary-400 focus:bg-[var(--color-bg-primary)] dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-100';

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-80 mb-6" />
        <Skeleton className="h-10 w-80 mb-6" />
        <div className="grid gap-6 lg:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-1 text-2xl font-bold text-[var(--color-text-primary)] dark:text-gray-100">{t('character.title')}</h1>
      <p className="text-sm text-[var(--color-text-muted)] dark:text-gray-400 mb-4">{t('guides.character')}</p>
      <div className="mb-4 flex gap-2 border-b border-[var(--color-border)] dark:border-gray-700">
        {TAB_KEYS.map(tabKey => (
          <button key={tabKey} onClick={() => setTab(tabKey)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === tabKey ? 'border-primary-600 text-primary-600 dark:text-primary-400' : 'border-transparent text-[var(--color-text-muted)] dark:text-gray-400 hover:text-[var(--color-text-secondary)] dark:hover:text-gray-300'
            }`}>{tabLabels[tabKey]}</button>
        ))}
      </div>

      {tab === 'evaluate' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-[var(--color-border)] dark:border-gray-700 bg-[var(--color-bg-primary)] dark:bg-gray-800 p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)] dark:text-gray-100">{t('character.newEvaluation')}</h2>
            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)] dark:text-gray-300">{t('fields.student')}</label>
              <select value={studentId} onChange={e => setStudentId(Number(e.target.value) || '')} className={inputCls}>
                <option value="">{t('filters.chooseStudent')}</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)] dark:text-gray-300">{t('fields.date')}</label>
              <input type="date" value={evalDate} onChange={e => setEvalDate(e.target.value)} className={inputCls} />
            </div>
            <div className="mb-4 space-y-3">
              <h3 className="text-sm font-medium text-[var(--color-text-secondary)] dark:text-gray-300">{t('character.scores')}</h3>
              {traits.map(trait => (
                <div key={trait.id} className="flex items-center gap-3">
                  <span className="w-32 text-sm text-[var(--color-text-primary)] dark:text-gray-100">{trait.name} ({trait.name_ar})</span>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} onClick={() => setScores(p => ({...p, [trait.id]: n}))}
                        className={`h-8 w-8 rounded-full text-xs font-medium transition-colors ${
                          scores[trait.id] === n ? 'bg-primary-600 text-white' : 'bg-[var(--color-bg-secondary)] dark:bg-gray-700 text-[var(--color-text-secondary)] dark:text-gray-300 hover:bg-[var(--color-border)] dark:hover:bg-gray-600'
                        }`}>{n}</button>
                    ))}
                  </div>
                  {scores[trait.id] && (
                    <span className="text-xs text-[var(--color-text-muted)] dark:text-gray-400">{getScoreLabel(scores[trait.id])}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)] dark:text-gray-300">{t('character.overallNotes')}</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} className={inputCls} rows={3} />
            </div>
            <button onClick={handleCreateEvaluation} disabled={!studentId || Object.keys(scores).length === 0}
              className="rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
              {t('character.saveEvaluation')}
            </button>
          </div>

          <div className="rounded-lg border border-[var(--color-border)] dark:border-gray-700 bg-[var(--color-bg-primary)] dark:bg-gray-800 p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)] dark:text-gray-100">{t('character.recentEvaluations')}</h2>
            <div className="space-y-3">
              {evaluations.slice(0, 10).map((ev: any) => (
                <div key={ev.id} className="border-b border-[var(--color-border-light)] dark:border-gray-700/50 pb-2">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] dark:text-gray-100">{ev.student_name}</p>
                  <p className="text-xs text-[var(--color-text-muted)] dark:text-gray-400">{ev.evaluation_date} — {t('character.average')}: {ev.average_score ?? '-'}</p>
                </div>
              ))}
              {evaluations.length === 0 && (
                <p className="text-sm text-[var(--color-text-muted)] dark:text-gray-400">{t('character.noEvaluations')}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'traits' && (
        <div>
          <button onClick={() => setShowTraitForm(!showTraitForm)}
            className="mb-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
            {showTraitForm ? t('common.cancel') : t('character.newTrait')}
          </button>
          {showTraitForm && (
            <div className="mb-6 max-w-md rounded-lg border border-[var(--color-border)] dark:border-gray-700 bg-[var(--color-bg-primary)] dark:bg-gray-800 p-4 shadow-sm">
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)] dark:text-gray-300">{t('fields.name')}</label>
                <input value={traitForm.name} onChange={e => setTraitForm(p => ({...p, name: e.target.value}))} className={inputCls} />
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)] dark:text-gray-300">{t('fields.nameAr')}</label>
                <input value={traitForm.name_ar} onChange={e => setTraitForm(p => ({...p, name_ar: e.target.value}))} className={inputCls} />
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)] dark:text-gray-300">{t('character.category')}</label>
                <select value={traitForm.category} onChange={e => setTraitForm(p => ({...p, category: e.target.value}))} className={inputCls}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{getCategoryLabel(c)}</option>)}
                </select>
              </div>
              <button onClick={handleCreateTrait} className="rounded-lg bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700">{t('common.save')}</button>
            </div>
          )}
          <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] dark:border-gray-700">
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--color-bg-secondary)] dark:bg-gray-700/50"><tr>
                <th className="px-4 py-3 text-start font-medium text-[var(--color-text-muted)] dark:text-gray-400">{t('fields.name')}</th>
                <th className="px-4 py-3 text-start font-medium text-[var(--color-text-muted)] dark:text-gray-400">{t('fields.nameAr')}</th>
                <th className="px-4 py-3 text-start font-medium text-[var(--color-text-muted)] dark:text-gray-400">{t('character.category')}</th>
                <th className="px-4 py-3 text-start font-medium text-[var(--color-text-muted)] dark:text-gray-400">{t('fields.active')}</th>
              </tr></thead>
              <tbody className="divide-y divide-[var(--color-border-light)] dark:divide-gray-700/50">
                {traits.map(trait => (
                  <tr key={trait.id} className="hover:bg-[var(--color-bg-secondary)] dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 text-[var(--color-text-primary)] dark:text-gray-100">{trait.name}</td>
                    <td className="px-4 py-3 text-[var(--color-text-primary)] dark:text-gray-100">{trait.name_ar}</td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)] dark:text-gray-300">{getCategoryLabel(trait.category)}</td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)] dark:text-gray-300">{trait.is_active ? t('common.yes') : t('common.no')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'summary' && (
        <div className="max-w-lg">
          <div className="mb-4 flex gap-3">
            <select value={selectedStudent} onChange={e => setSelectedStudent(Number(e.target.value) || '')} className={`${inputCls} flex-1`}>
              <option value="">{t('filters.chooseStudent')}</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
            <button onClick={handleLoadSummary} disabled={!selectedStudent}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm text-white disabled:opacity-50 hover:bg-primary-700">{t('common.loadStudent')}</button>
          </div>
          {summary && (
            <div className="rounded-lg border border-[var(--color-border)] dark:border-gray-700 bg-[var(--color-bg-primary)] dark:bg-gray-800 p-4 shadow-sm">
              <h2 className="mb-2 text-lg font-semibold text-[var(--color-text-primary)] dark:text-gray-100">{summary.student_name}</h2>
              <p className="mb-3 text-sm text-[var(--color-text-muted)] dark:text-gray-400">{t('character.overallAverage')}: <strong className="text-[var(--color-text-primary)] dark:text-gray-100">{summary.overall_average ?? 'N/A'}</strong> | {t('character.evaluations')}: {summary.total_evaluations}</p>
              <div className="space-y-2">
                {summary.traits?.map((tr: any) => (
                  <div key={tr.trait_id} className="flex items-center gap-3 border-b border-[var(--color-border-light)] dark:border-gray-700/50 pb-2">
                    <span className="w-32 text-sm font-medium text-[var(--color-text-primary)] dark:text-gray-100">{tr.trait_name}</span>
                    <span className="text-xs text-[var(--color-text-muted)] dark:text-gray-400">({getCategoryLabel(tr.category)})</span>
                    <div className="flex-1 bg-[var(--color-bg-secondary)] dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${(tr.average_score / 5) * 100}%` }} />
                    </div>
                    <span className="text-sm font-medium text-[var(--color-text-primary)] dark:text-gray-100">{tr.average_score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
