import { useState, useEffect } from 'react';
import { characterAPI, enrollmentAPI } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import LoadingSpinner from '../../components/LoadingSpinner';

interface Trait { id: number; name: string; name_ar: string; category: string; is_active: boolean; }
interface Student { id: number; full_name: string; }
interface Score { trait: number; score: number; notes: string; }

const SCORE_LABELS = ['', 'Poor', 'Needs Improvement', 'Satisfactory', 'Good', 'Excellent'];
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
    characterAPI.traits.list().then(r => setTraits(r.data.results ?? r.data)).catch(() => {});
    enrollmentAPI.teacherStudents().then(r => setStudents(r.data.results ?? r.data)).catch(() => {});
    loadEvaluations();
  }, []);

  const loadEvaluations = async () => {
    setLoading(true);
    try {
      const r = await characterAPI.evaluations.list();
      setEvaluations(r.data.results ?? r.data);
    } catch {}
    setLoading(false);
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

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Character Evaluation</h1>
      <div className="mb-4 flex gap-2 border-b">
        {(['evaluate', 'traits', 'summary'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {tab === 'evaluate' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border p-4">
            <h2 className="mb-4 text-lg font-semibold">New Evaluation</h2>
            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium">Student</label>
              <select value={studentId} onChange={e => setStudentId(Number(e.target.value) || '')} className="input-field">
                <option value="">Select student...</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium">Date</label>
              <input type="date" value={evalDate} onChange={e => setEvalDate(e.target.value)} className="input-field" />
            </div>
            <div className="mb-4 space-y-3">
              <h3 className="text-sm font-medium">Scores (1-5)</h3>
              {traits.map(trait => (
                <div key={trait.id} className="flex items-center gap-3">
                  <span className="w-32 text-sm">{trait.name} ({trait.name_ar})</span>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} onClick={() => setScores(p => ({...p, [trait.id]: n}))}
                        className={`h-8 w-8 rounded-full text-xs font-medium transition-colors ${
                          scores[trait.id] === n ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}>{n}</button>
                    ))}
                  </div>
                  {scores[trait.id] && (
                    <span className="text-xs text-gray-500">{SCORE_LABELS[scores[trait.id]]}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium">Overall Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input-field" rows={3} />
            </div>
            <button onClick={handleCreateEvaluation} disabled={!studentId || Object.keys(scores).length === 0}
              className="rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
              Save Evaluation
            </button>
          </div>

          <div className="rounded-lg border p-4">
            <h2 className="mb-4 text-lg font-semibold">Recent Evaluations</h2>
            {loading ? <LoadingSpinner /> : (
              <div className="space-y-3">
                {evaluations.slice(0, 10).map((ev: any) => (
                  <div key={ev.id} className="border-b pb-2">
                    <p className="text-sm font-medium">{ev.student_name}</p>
                    <p className="text-xs text-gray-500">{ev.evaluation_date} — Avg: {ev.average_score ?? '-'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'traits' && (
        <div>
          <button onClick={() => setShowTraitForm(!showTraitForm)}
            className="mb-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
            {showTraitForm ? 'Cancel' : 'New Trait'}
          </button>
          {showTraitForm && (
            <div className="mb-6 max-w-md rounded-lg border p-4">
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium">Name</label>
                <input value={traitForm.name} onChange={e => setTraitForm(p => ({...p, name: e.target.value}))} className="input-field" />
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium">Name (Arabic)</label>
                <input value={traitForm.name_ar} onChange={e => setTraitForm(p => ({...p, name_ar: e.target.value}))} className="input-field" />
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium">Category</label>
                <select value={traitForm.category} onChange={e => setTraitForm(p => ({...p, category: e.target.value}))} className="input-field">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button onClick={handleCreateTrait} className="rounded-lg bg-primary-600 px-4 py-2 text-sm text-white">Save</button>
            </div>
          )}
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr>
                <th className="px-4 py-3 text-start font-medium">Name</th>
                <th className="px-4 py-3 text-start font-medium">Arabic</th>
                <th className="px-4 py-3 text-start font-medium">Category</th>
                <th className="px-4 py-3 text-start font-medium">Active</th>
              </tr></thead>
              <tbody>
                {traits.map(trait => (
                  <tr key={trait.id} className="border-t">
                    <td className="px-4 py-3">{trait.name}</td>
                    <td className="px-4 py-3">{trait.name_ar}</td>
                    <td className="px-4 py-3">{trait.category}</td>
                    <td className="px-4 py-3">{trait.is_active ? 'Yes' : 'No'}</td>
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
            <select value={selectedStudent} onChange={e => setSelectedStudent(Number(e.target.value) || '')} className="input-field flex-1">
              <option value="">Select student...</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
            <button onClick={handleLoadSummary} disabled={!selectedStudent}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm text-white disabled:opacity-50">Load</button>
          </div>
          {summary && (
            <div className="rounded-lg border p-4">
              <h2 className="mb-2 text-lg font-semibold">{summary.student_name}</h2>
              <p className="mb-3 text-sm text-gray-500">Overall Average: <strong>{summary.overall_average ?? 'N/A'}</strong> | Evaluations: {summary.total_evaluations}</p>
              <div className="space-y-2">
                {summary.traits?.map((t: any) => (
                  <div key={t.trait_id} className="flex items-center gap-3 border-b pb-2">
                    <span className="w-32 text-sm font-medium">{t.trait_name}</span>
                    <span className="text-xs text-gray-400">({t.category})</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${(t.average_score / 5) * 100}%` }} />
                    </div>
                    <span className="text-sm font-medium">{t.average_score}</span>
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
