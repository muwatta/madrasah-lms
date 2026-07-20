import { useEffect, useState } from 'react';
import { quranAPI, userAPI } from '../../api';
import { unwrapPaginated } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import LoadingSpinner from '../../components/LoadingSpinner';

interface Student {
  id: number;
  name: string;
  email: string;
}

interface MemorizationRecord {
  id: number;
  student: number;
  student_name?: string;
  surah: number;
  ayah_start: number;
  ayah_end: number;
  date: string;
  score: number;
  notes: string;
}

interface Revision {
  id: number;
  student: number;
  student_name?: string;
  memorization: number;
  surah: number;
  ayah_start: number;
  ayah_end: number;
  scheduled_date: string;
  completed: boolean;
}

interface StudentProgress {
  total_surahs: number;
  total_ayahs: number;
  average_score: number;
}

const SURAH_NAMES = [
  'Al-Fatihah', 'Al-Baqarah', 'Aal-E-Imran', 'An-Nisa', 'Al-Ma\'idah',
  'Al-An\'am', 'Al-A\'raf', 'Al-Anfal', 'At-Tawbah', 'Yunus',
  'Hud', 'Yusuf', 'Ar-Ra\'d', 'Ibrahim', 'Al-Hijr',
  'An-Nahl', 'Al-Isra', 'Al-Kahf', 'Maryam', 'Ta-Ha',
  'Al-Anbiya', 'Al-Hajj', 'Al-Mu\'minun', 'An-Nur', 'Al-Furqan',
  'Ash-Shu\'ara', 'An-Naml', 'Al-Qasas', 'Al-Ankabut', 'Ar-Rum',
  'Luqman', 'As-Sajdah', 'Al-Ahzab', 'Saba', 'Fatir',
  'Ya-Sin', 'As-Saffat', 'Sad', 'Az-Zumar', 'Ghafir',
  'Fussilat', 'Ash-Shura', 'Az-Zukhruf', 'Ad-Dukhan', 'Al-Jathiyah',
  'Al-Ahqaf', 'Muhammad', 'Al-Fath', 'Al-Hujurat', 'Qaf',
  'Adh-Dhariyat', 'At-Tur', 'An-Najm', 'Al-Qamar', 'Ar-Rahman',
  'Al-Waqi\'ah', 'Al-Hadid', 'Al-Mujadilah', 'Al-Hashr', 'Al-Mumtahanah',
  'As-Saf', 'Al-Jumu\'ah', 'Al-Munafiqun', 'At-Taghabun', 'At-Talaq',
  'At-Tahrim', 'Al-Mulk', 'Al-Qalam', 'Al-Haqqah', 'Al-Ma\'arij',
  'Nuh', 'Al-Jinn', 'Al-Muzzammil', 'Al-Muddaththir', 'Al-Qiyamah',
  'Al-Insan', 'Al-Mursalat', 'An-Naba', 'An-Nazi\'at', 'Abasa',
  'At-Takwir', 'Al-Infitar', 'Al-Mutaffifin', 'Al-Inshiqaq', 'Al-Buruj',
  'At-Tariq', 'Al-A\'la', 'Al-Ghashiyah', 'Al-Fajr', 'Al-Balad',
  'Ash-Shams', 'Al-Layl', 'Ad-Duha', 'Ash-Sharh', 'At-Tin',
  'Al-Alaq', 'Al-Qadr', 'Al-Bayyinah', 'Az-Zalzalah', 'Al-Adiyat',
  'Al-Qari\'ah', 'At-Takathur', 'Al-Asr', 'Al-Humazah', 'Al-Fil',
  'Quraysh', 'Al-Ma\'un', 'Al-Kawthar', 'Al-Kafirun', 'An-Nasr',
  'Al-Masad', 'Al-Ikhlas', 'Al-Falaq', 'An-Nas',
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function QuranPage() {
  const { t, language } = useLanguage();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [records, setRecords] = useState<MemorizationRecord[]>([]);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'records' | 'revisions' | 'tajwid'>('records');

  const [form, setForm] = useState({ surah: 1, ayah_start: 1, ayah_end: 7, date: new Date().toISOString().split('T')[0], score: 80, notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [tajwidForm, setTajwidForm] = useState({ date: new Date().toISOString().split('T')[0], makharij_score: 70, sifaat_score: 70, ghunnah_score: 70, qalqalah_score: 70, overall_score: 70, notes: '' });
  const [tajwidSubmitting, setTajwidSubmitting] = useState(false);
  const [showTajwidForm, setShowTajwidForm] = useState(false);

  useEffect(() => {
    userAPI.list({ role: 'talib' })
      .then((res) => setStudents(unwrapPaginated(res.data)))
      .catch(() => setError(t('common.loadFailed')))
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    if (!selectedStudent) return;
    setLoading(true);
    Promise.all([
      quranAPI.memorization.list({ student: selectedStudent }),
      quranAPI.revision.list({ student: selectedStudent, completed: false }),
      quranAPI.studentProgress(selectedStudent),
    ])
      .then(([memRes, revRes, progRes]) => {
        setRecords(unwrapPaginated(memRes.data));
        setRevisions(unwrapPaginated(revRes.data));
        setProgress(progRes.data);
      })
      .catch(() => setError(t('common.loadFailed')))
      .finally(() => setLoading(false));
  }, [selectedStudent, t]);

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setSubmitting(true);
    try {
      await quranAPI.memorization.create({ ...form, student: selectedStudent });
      setShowForm(false);
      setForm({ surah: 1, ayah_start: 1, ayah_end: 7, date: new Date().toISOString().split('T')[0], score: 80, notes: '' });
      const res = await quranAPI.memorization.list({ student: selectedStudent });
      setRecords(unwrapPaginated(res.data));
    } catch {
      setError(t('common.saveFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkComplete = async (id: number) => {
    try {
      await quranAPI.revision.markComplete(id);
      setRevisions((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError(t('common.saveFailed'));
    }
  };

  const handleCreateTajwid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setTajwidSubmitting(true);
    try {
      await quranAPI.tajwid.create({ ...tajwidForm, student: selectedStudent });
      setShowTajwidForm(false);
      setTajwidForm({ date: new Date().toISOString().split('T')[0], makharij_score: 70, sifaat_score: 70, ghunnah_score: 70, qalqalah_score: 70, overall_score: 70, notes: '' });
    } catch {
      setError(t('common.saveFailed'));
    } finally {
      setTajwidSubmitting(false);
    }
  };

  if (loading && !selectedStudent) return <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900">{language === 'ar' ? 'القرآن الكريم' : 'Quran Memorization'}</h1>
      </div>
      <p className="text-sm text-gray-500 mb-6">{language === 'ar' ? 'تتبع تحفيظ الطلاب وتقييم التجويد' : 'Track student memorization and tajweed assessment'}</p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
          <button onClick={() => setError('')} className="me-2 underline">{t('common.close')}</button>
        </div>
      )}

      <div className="mb-6">
        <label className="mb-1 block text-xs font-medium text-gray-500">{language === 'ar' ? 'اختر الطالب' : 'Select Student'}</label>
        <select
          value={selectedStudent ?? ''}
          onChange={(e) => setSelectedStudent(Number(e.target.value) || null)}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:outline-none sm:max-w-xs"
        >
          <option value="">{language === 'ar' ? '-- اختر طالب --' : '-- Select a student --'}</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {selectedStudent && loading && <div className="flex h-32 items-center justify-center"><LoadingSpinner size="lg" /></div>}

      {selectedStudent && !loading && (
        <>
          {progress && (
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="text-xs font-medium text-gray-400">{language === 'ar' ? 'إجمالي السور' : 'Total Surahs'}</p>
                <p className="mt-1 text-2xl font-bold text-primary-600">{progress.total_surahs}</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="text-xs font-medium text-gray-400">{language === 'ar' ? 'إجمالي الآيات' : 'Total Ayahs'}</p>
                <p className="mt-1 text-2xl font-bold text-blue-600">{progress.total_ayahs}</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="text-xs font-medium text-gray-400">{language === 'ar' ? 'متوسط الدرجات' : 'Average Score'}</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">{progress.average_score.toFixed(1)}%</p>
              </div>
            </div>
          )}

          <div className="mb-4 flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
            {(['records', 'revisions', 'tajwid'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'records' ? (language === 'ar' ? 'التحفيظ' : 'Memorization') : tab === 'revisions' ? (language === 'ar' ? 'المراجعات' : 'Revisions') : (language === 'ar' ? 'التجويد' : 'Tajwid')}
              </button>
            ))}
          </div>

          {activeTab === 'records' && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-3">
                <h2 className="text-sm font-semibold text-gray-700">{language === 'ar' ? 'سجلات التحفيظ' : 'Memorization Records'}</h2>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="btn-press inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  {language === 'ar' ? 'إضافة سجل' : 'Add Record'}
                </button>
              </div>

              {showForm && (
                <div className="border-b border-gray-100 bg-primary-50/30 px-6 py-4">
                  <form onSubmit={handleCreateRecord} className="grid grid-cols-1 gap-3 sm:grid-cols-6">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">{language === 'ar' ? 'السورة' : 'Surah'}</label>
                      <select value={form.surah} onChange={(e) => setForm({ ...form, surah: Number(e.target.value) })}
                        className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm focus:border-primary-400 focus:outline-none">
                        {SURAH_NAMES.map((name, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1}. {name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">{language === 'ar' ? 'من آية' : 'From Ayah'}</label>
                      <input type="number" min={1} value={form.ayah_start} onChange={(e) => setForm({ ...form, ayah_start: Number(e.target.value) })}
                        className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm focus:border-primary-400 focus:outline-none" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">{language === 'ar' ? 'إلى آية' : 'To Ayah'}</label>
                      <input type="number" min={1} value={form.ayah_end} onChange={(e) => setForm({ ...form, ayah_end: Number(e.target.value) })}
                        className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm focus:border-primary-400 focus:outline-none" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">{language === 'ar' ? 'التاريخ' : 'Date'}</label>
                      <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm focus:border-primary-400 focus:outline-none" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">{language === 'ar' ? 'الدرجة' : 'Score'}</label>
                      <input type="number" min={0} max={100} value={form.score} onChange={(e) => setForm({ ...form, score: Number(e.target.value) })}
                        className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm focus:border-primary-400 focus:outline-none" />
                    </div>
                    <div className="flex items-end">
                      <button type="submit" disabled={submitting}
                        className="btn-press w-full rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
                        {submitting ? t('common.saving') : t('common.save')}
                      </button>
                    </div>
                  </form>
                  <div className="mt-2">
                    <input type="text" placeholder={language === 'ar' ? 'ملاحظات...' : 'Notes...'} value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary-400 focus:outline-none" />
                  </div>
                </div>
              )}

              {records.length === 0 ? (
                <p className="p-6 text-sm text-gray-500 text-center">{language === 'ar' ? 'لا توجد سجلات بعد' : 'No records yet'}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500">{language === 'ar' ? 'السورة' : 'Surah'}</th>
                        <th className="px-6 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500">{language === 'ar' ? 'الآيات' : 'Ayah Range'}</th>
                        <th className="px-6 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500">{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                        <th className="px-6 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500">{language === 'ar' ? 'الدرجة' : 'Score'}</th>
                        <th className="px-6 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500">{language === 'ar' ? 'ملاحظات' : 'Notes'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {records.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-3.5 text-sm font-medium text-gray-900">{SURAH_NAMES[r.surah - 1] || r.surah}</td>
                          <td className="px-6 py-3.5 text-sm text-gray-700">{r.ayah_start} - {r.ayah_end}</td>
                          <td className="px-6 py-3.5 text-sm text-gray-500">{formatDate(r.date)}</td>
                          <td className="px-6 py-3.5">
                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              r.score >= 90 ? 'bg-emerald-100 text-emerald-700' : r.score >= 70 ? 'bg-blue-100 text-blue-700' : r.score >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {r.score}%
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-sm text-gray-500 max-w-[200px] truncate">{r.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'revisions' && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
                <h2 className="text-sm font-semibold text-gray-700">{language === 'ar' ? 'المراجعات القادمة' : 'Upcoming Revisions'}</h2>
              </div>
              {revisions.length === 0 ? (
                <p className="p-6 text-sm text-gray-500 text-center">{language === 'ar' ? 'لا توجد مراجعات قادمة' : 'No upcoming revisions'}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500">{language === 'ar' ? 'السورة' : 'Surah'}</th>
                        <th className="px-6 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500">{language === 'ar' ? 'الآيات' : 'Ayah Range'}</th>
                        <th className="px-6 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500">{language === 'ar' ? 'التاريخ المجدول' : 'Scheduled Date'}</th>
                        <th className="px-6 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500">{language === 'ar' ? 'الإجراء' : 'Action'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {revisions.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-3.5 text-sm font-medium text-gray-900">{SURAH_NAMES[r.surah - 1] || r.surah}</td>
                          <td className="px-6 py-3.5 text-sm text-gray-700">{r.ayah_start} - {r.ayah_end}</td>
                          <td className="px-6 py-3.5 text-sm text-gray-500">{formatDate(r.scheduled_date)}</td>
                          <td className="px-6 py-3.5">
                            <button
                              onClick={() => handleMarkComplete(r.id)}
                              className="btn-press inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              {language === 'ar' ? 'مكتمل' : 'Complete'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tajwid' && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-3">
                <h2 className="text-sm font-semibold text-gray-700">{language === 'ar' ? 'تقييم التجويد' : 'Tajwid Assessment'}</h2>
                <button
                  onClick={() => setShowTajwidForm(!showTajwidForm)}
                  className="btn-press inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  {language === 'ar' ? 'تقييم جديد' : 'New Assessment'}
                </button>
              </div>

              {showTajwidForm && (
                <div className="border-b border-gray-100 bg-primary-50/30 px-6 py-4">
                  <form onSubmit={handleCreateTajwid} className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">{language === 'ar' ? 'التاريخ' : 'Date'}</label>
                        <input type="date" value={tajwidForm.date} onChange={(e) => setTajwidForm({ ...tajwidForm, date: e.target.value })}
                          className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm focus:border-primary-400 focus:outline-none" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">{language === 'ar' ? 'الدرجة الكلية' : 'Overall Score'}</label>
                        <input type="number" min={0} max={100} value={tajwidForm.overall_score}
                          onChange={(e) => setTajwidForm({ ...tajwidForm, overall_score: Number(e.target.value) })}
                          className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm focus:border-primary-400 focus:outline-none" />
                      </div>
                      <div className="flex items-end">
                        <button type="submit" disabled={tajwidSubmitting}
                          className="btn-press w-full rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
                          {tajwidSubmitting ? t('common.saving') : t('common.save')}
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[
                        { key: 'makharij_score', label: language === 'ar' ? 'المخارج' : 'Makharij' },
                        { key: 'sifaat_score', label: language === 'ar' ? 'الصفات' : 'Sifaat' },
                        { key: 'ghunnah_score', label: language === 'ar' ? 'الغنة' : 'Ghunnah' },
                        { key: 'qalqalah_score', label: language === 'ar' ? 'القلقلة' : 'Qalqalah' },
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <label className="mb-1 block text-xs font-medium text-gray-500">{label}</label>
                          <input type="number" min={0} max={100}
                            value={(tajwidForm as any)[key]}
                            onChange={(e) => setTajwidForm({ ...tajwidForm, [key]: Number(e.target.value) })}
                            className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm focus:border-primary-400 focus:outline-none" />
                        </div>
                      ))}
                    </div>
                    <div>
                      <input type="text" placeholder={language === 'ar' ? 'ملاحظات...' : 'Notes...'} value={tajwidForm.notes}
                        onChange={(e) => setTajwidForm({ ...tajwidForm, notes: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary-400 focus:outline-none" />
                    </div>
                  </form>
                </div>
              )}

              <div className="p-6 text-center">
                <p className="text-sm text-gray-500">{language === 'ar' ? 'بيانات التقييم ستظهر هنا بعد الإنشاء' : 'Assessment data will appear here once created'}</p>
              </div>
            </div>
          )}
        </>
      )}

      {!selectedStudent && !loading && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
            <svg className="h-8 w-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
          </div>
          <p className="text-sm font-medium text-gray-900">{language === 'ar' ? 'اختر طالبًا لعرض التفاصيل' : 'Select a student to view details'}</p>
        </div>
      )}
    </div>
  );
}
