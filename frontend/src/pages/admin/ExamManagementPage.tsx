import { useEffect, useState, useRef } from 'react';
import { examAPI, subjectAPI } from '../../api';
import type { Exam, ExamResult, Subject } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { SkeletonTable } from '../../components/Skeleton';

export default function ExamManagementPage() {
  const { t } = useLanguage();
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', subject: '', exam_date: '', total_marks: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [selectedExam, setSelectedExam] = useState<number | null>(null);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState<string | null>(null);

  const [showRecordResult, setShowRecordResult] = useState(false);
  const [resultForm, setResultForm] = useState({ student: '', score: '', grade: 'C', remarks: '' });
  const [resultSaving, setResultSaving] = useState(false);
  const [resultError, setResultError] = useState<string | null>(null);

  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadExams = () => {
    setLoading(true);
    Promise.all([
      examAPI.list().then((r) => setExams(r.data.results ?? r.data)),
      subjectAPI.list().then((r) => setSubjects(r.data.results ?? r.data)),
    ])
      .catch((err) => setError(err.response?.data?.detail || t('examManagement.loadFailed')))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadExams(); }, []);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      await examAPI.create({
        ...form,
        subject: Number(form.subject),
        total_marks: Number(form.total_marks),
      });
      setShowForm(false);
      loadExams();
    } catch (err: any) {
      const msg = err.response?.data;
      setFormError(typeof msg === 'string' ? msg : Object.values(msg || {}).flat().join(', ') || t('examManagement.createFailed'));
    } finally {
      setSaving(false);
    }
  };

  const loadResults = async (examId: number) => {
    setSelectedExam(examId);
    setResultsLoading(true);
    setResultsError(null);
    try {
      const res = await examAPI.getResults(examId);
      setResults(res.data.results ?? res.data);
    } catch {
      setResultsError(t('examManagement.resultsLoadFailed'));
    } finally {
      setResultsLoading(false);
    }
  };

  const handleRecordResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExam) return;
    setResultSaving(true);
    setResultError(null);
    try {
      await examAPI.recordResult(selectedExam, {
        student: Number(resultForm.student),
        score: Number(resultForm.score),
        grade: resultForm.grade,
        remarks: resultForm.remarks,
      });
      setShowRecordResult(false);
      loadResults(selectedExam);
    } catch (err: any) {
      setResultError(Object.values(err.response?.data || {}).flat().join(', ') || t('examManagement.recordFailed'));
    } finally {
      setResultSaving(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!selectedExam || !bulkText.trim()) return;
    setBulkSaving(true);
    setBulkError(null);
    try {
      const lines = bulkText.trim().split('\n').filter(Boolean);
      const parsed = lines.map((line) => {
        const [studentId, score, grade, remarks] = line.split(',').map((s) => s.trim());
        return { student: Number(studentId), score: Number(score), grade: grade || 'C', remarks: remarks || '' };
      });
      await examAPI.bulkUpload(selectedExam, parsed);
      setShowBulkUpload(false);
      setBulkText('');
      loadResults(selectedExam);
    } catch (err: any) {
      setBulkError(Object.values(err.response?.data || {}).flat().join(', ') || t('examManagement.bulkFailed'));
    } finally {
      setBulkSaving(false);
    }
  };

  const gradeBadge = (grade: string) => {
    const colors: Record<string, string> = {
      A: 'bg-green-100 text-green-700',
      B: 'bg-blue-100 text-blue-700',
      C: 'bg-yellow-100 text-yellow-700',
      D: 'bg-orange-100 text-orange-700',
      F: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`inline-block rounded px-2 py-0.5 text-xs font-bold ${colors[grade] || 'bg-gray-100 text-gray-700'}`}>
        {grade}
      </span>
    );
  };

  const activeExam = exams.find((e) => e.id === selectedExam);
  const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-1">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-[var(--color-text-primary)]">{t('examManagement.title')}</h1>
        <button
          onClick={() => { setForm({ title: '', subject: '', exam_date: '', total_marks: '', description: '' }); setFormError(null); setShowForm(true); }}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          {t('examManagement.createExam')}
        </button>
      </div>
      <p className="text-sm text-gray-500 dark:text-[var(--color-text-muted)] mb-6">{t('guides.examManagement')}</p>

      {showForm && (
        <div className="rounded-lg border border-gray-200 dark:border-[var(--color-border)] bg-white dark:bg-[var(--color-bg-secondary)] p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-[var(--color-text-primary)]">{t('examManagement.newExam')}</h2>
          {formError && <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">{formError}</div>}
          <form onSubmit={handleCreateExam} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-[var(--color-text-secondary)]">{t('fields.title')}</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-[var(--color-text-secondary)]">{t('fields.subject')}</label>
              <select required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={inputClass}>
                <option value="">{t('filters.chooseSubject')}</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name_ar}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-[var(--color-text-secondary)]">{t('fields.examDate')}</label>
              <input required type="date" value={form.exam_date} onChange={(e) => setForm({ ...form, exam_date: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-[var(--color-text-secondary)]">{t('fields.totalMarks')}</label>
              <input required type="number" min="1" value={form.total_marks} onChange={(e) => setForm({ ...form, total_marks: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-[var(--color-text-secondary)]">{t('fields.description')}</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={saving} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
                {saving ? t('common.creating') : t('examManagement.createExam')}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 dark:border-[var(--color-border)] px-4 py-2 text-sm font-medium text-gray-700 dark:text-[var(--color-text-secondary)] hover:bg-gray-50 dark:hover:bg-gray-700/30">
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {showRecordResult && selectedExam && (
        <div className="rounded-lg border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 p-6">
          <h3 className="mb-3 font-semibold text-gray-900 dark:text-[var(--color-text-primary)]">{t('examManagement.recordResultFor')} {activeExam?.title}</h3>
          {resultError && (
            <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">
              {resultError}
              <button onClick={() => setResultError(null)} className="me-2 underline">{t('common.dismiss')}</button>
            </div>
          )}
          <form onSubmit={handleRecordResult} className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-[var(--color-text-secondary)]">{t('fields.student')}</label>
              <input required type="number" value={resultForm.student} onChange={(e) => setResultForm({ ...resultForm, student: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-[var(--color-text-secondary)]">{t('fields.score')}</label>
              <input required type="number" min="0" value={resultForm.score} onChange={(e) => setResultForm({ ...resultForm, score: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-[var(--color-text-secondary)]">{t('fields.grade')}</label>
              <select value={resultForm.grade} onChange={(e) => setResultForm({ ...resultForm, grade: e.target.value })} className={inputClass}>
                {['A', 'B', 'C', 'D', 'F'].map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-[var(--color-text-secondary)]">{t('fields.remarks')}</label>
              <input value={resultForm.remarks} onChange={(e) => setResultForm({ ...resultForm, remarks: e.target.value })} className={inputClass} />
            </div>
            <div className="sm:col-span-4 flex gap-3">
              <button type="submit" disabled={resultSaving} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
                {resultSaving ? t('common.saving') : t('common.save')}
              </button>
              <button type="button" onClick={() => setShowRecordResult(false)} className="rounded-lg border border-gray-300 dark:border-[var(--color-border)] px-4 py-2 text-sm font-medium text-gray-700 dark:text-[var(--color-text-secondary)] hover:bg-gray-50 dark:hover:bg-gray-700/30">
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {showBulkUpload && selectedExam && (
        <div className="rounded-lg border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 p-6">
          <h3 className="mb-3 font-semibold text-gray-900 dark:text-[var(--color-text-primary)]">{t('common.bulkUpload')} - {activeExam?.title}</h3>
          <p className="mb-2 text-sm text-gray-600 dark:text-[var(--color-text-secondary)]">
            {t('examManagement.csvFormat')} <code className="rounded bg-gray-100 px-1">student_id, score, grade, remarks</code> ({t('examManagement.onePerLine')})
          </p>
          {bulkError && (
            <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">
              {bulkError}
              <button onClick={() => setBulkError(null)} className="me-2 underline">{t('common.dismiss')}</button>
            </div>
          )}
          <textarea
            rows={6}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={'1, 85, A, Excellent\n2, 72, B, Good'}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <div className="mt-3 flex gap-3">
            <button onClick={handleBulkUpload} disabled={bulkSaving || !bulkText.trim()} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
              {bulkSaving ? t('common.uploading') : t('common.upload')}
            </button>
            <button onClick={() => { setShowBulkUpload(false); setBulkText(''); }} className="rounded-lg border border-gray-300 dark:border-[var(--color-border)] px-4 py-2 text-sm font-medium text-gray-700 dark:text-[var(--color-text-secondary)] hover:bg-gray-50 dark:hover:bg-gray-700/30">
              {t('common.cancel')}
            </button>
            <label className="me-auto cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              {t('common.importCsv')}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => setBulkText(ev.target?.result as string);
                  reader.readAsText(file);
                }}
              />
            </label>
          </div>
        </div>
      )}

      {loading ? (
        <SkeletonTable rows={5} />
      ) : error ? (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-red-700 dark:text-red-400">{error}</div>
      ) : (
        <div className="rounded-lg border border-gray-200 dark:border-[var(--color-border)] bg-white dark:bg-[var(--color-bg-secondary)] shadow-sm overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[var(--color-border)] bg-gray-50 dark:bg-[var(--color-bg-primary)] text-end text-xs font-medium uppercase text-gray-500 dark:text-[var(--color-text-muted)]">
                <th className="px-4 py-3">{t('fields.title')}</th>
                <th className="px-4 py-3">{t('fields.subject')}</th>
                <th className="px-4 py-3">{t('fields.date')}</th>
                <th className="px-4 py-3">{t('fields.marks')}</th>
                <th className="px-4 py-3">{t('fields.results')}</th>
                <th className="px-4 py-3">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => (
                <tr key={exam.id} className={`border-b border-gray-50 hover:bg-gray-50 ${selectedExam === exam.id ? 'bg-primary-50' : ''}`}>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900 dark:text-[var(--color-text-primary)]">{exam.title}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-[var(--color-text-secondary)]">{exam.subject_name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-[var(--color-text-secondary)]">{new Date(exam.exam_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-[var(--color-text-secondary)]">{exam.total_marks}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-[var(--color-text-secondary)]">{exam.result_count}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => loadResults(exam.id)} className="text-sm font-medium text-primary-600 hover:underline">
                        {t('examManagement.viewResults')}
                      </button>
                      <button onClick={() => { setResultForm({ student: '', score: '', grade: 'C', remarks: '' }); setSelectedExam(exam.id); setShowRecordResult(true); }} className="text-sm font-medium text-blue-600 hover:underline">
                        {t('examManagement.recordResult')}
                      </button>
                      <button onClick={() => { setSelectedExam(exam.id); setShowBulkUpload(true); }} className="text-sm font-medium text-purple-600 hover:underline">
                        {t('common.bulkUpload')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!exams.length && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-[var(--color-text-muted)]">{t('examManagement.noExams')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedExam && !showRecordResult && !showBulkUpload && (
        <div className="rounded-lg border border-gray-200 dark:border-[var(--color-border)] bg-white dark:bg-[var(--color-bg-secondary)] p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{t('examManagement.resultsFor')} {activeExam?.title}</h2>
            <div className="flex gap-2">
              <button onClick={() => { setResultForm({ student: '', score: '', grade: 'C', remarks: '' }); setShowRecordResult(true); }} className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700">
                {t('examManagement.recordResult')}
              </button>
              <button onClick={() => setShowBulkUpload(true)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                {t('common.bulkUpload')}
              </button>
            </div>
          </div>
          {resultsError && (
            <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">{resultsError}</div>
          )}
          {resultsLoading ? (
            <SkeletonTable rows={3} />
          ) : results.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-[var(--color-border)] text-end text-xs font-medium uppercase text-gray-500 dark:text-[var(--color-text-muted)]">
                    <th className="pb-2 pe-4">{t('fields.student')}</th>
                    <th className="pb-2 pe-4">{t('fields.score')}</th>
                    <th className="pb-2 pe-4">{t('fields.grade')}</th>
                    <th className="pb-2">{t('fields.remarks')}</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.id} className="border-b border-gray-50 dark:border-[var(--color-border-light)]">
                      <td className="py-2 pe-4 font-medium text-gray-900 dark:text-[var(--color-text-primary)]">{r.student_name}</td>
                      <td className="py-2 pe-4 text-gray-600 dark:text-[var(--color-text-secondary)]">{r.score} / {activeExam?.total_marks}</td>
                      <td className="py-2 pe-4">{gradeBadge(r.grade)}</td>
                      <td className="py-2 text-gray-500 dark:text-[var(--color-text-muted)]">{r.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-gray-500 dark:text-[var(--color-text-muted)]">{t('examManagement.noResults')}</p>
          )}
        </div>
      )}
    </div>
  );
}
