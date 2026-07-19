import { useEffect, useState, useRef } from 'react';
import { examAPI, subjectAPI } from '../../api';
import type { Exam, ExamResult, Subject } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ExamManagementPage() {
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

  const [showRecordResult, setShowRecordResult] = useState(false);
  const [resultForm, setResultForm] = useState({ student: '', score: '', grade: 'C', remarks: '' });
  const [resultSaving, setResultSaving] = useState(false);

  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadExams = () => {
    setLoading(true);
    Promise.all([
      examAPI.list().then((r) => setExams(r.data.results ?? r.data)),
      subjectAPI.list().then((r) => setSubjects(r.data.results ?? r.data)),
    ])
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load data'))
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
      setFormError(typeof msg === 'string' ? msg : Object.values(msg || {}).flat().join(', ') || 'Failed to create exam');
    } finally {
      setSaving(false);
    }
  };

  const loadResults = async (examId: number) => {
    setSelectedExam(examId);
    setResultsLoading(true);
    try {
      const res = await examAPI.getResults(examId);
      setResults(res.data.results ?? res.data);
    } catch {
      alert('Failed to load results');
    } finally {
      setResultsLoading(false);
    }
  };

  const handleRecordResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExam) return;
    setResultSaving(true);
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
      alert(Object.values(err.response?.data || {}).flat().join(', ') || 'Failed to record result');
    } finally {
      setResultSaving(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!selectedExam || !bulkText.trim()) return;
    setBulkSaving(true);
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
      alert(Object.values(err.response?.data || {}).flat().join(', ') || 'Bulk upload failed');
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Exam Management</h1>
        <button
          onClick={() => { setForm({ title: '', subject: '', exam_date: '', total_marks: '', description: '' }); setFormError(null); setShowForm(true); }}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Create Exam
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">New Exam</h2>
          {formError && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{formError}</div>}
          <form onSubmit={handleCreateExam} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Subject</label>
              <select required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={inputClass}>
                <option value="">Select subject</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Exam Date</label>
              <input required type="date" value={form.exam_date} onChange={(e) => setForm({ ...form, exam_date: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Total Marks</label>
              <input required type="number" min="1" value={form.total_marks} onChange={(e) => setForm({ ...form, total_marks: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={saving} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
                {saving ? 'Creating...' : 'Create Exam'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {showRecordResult && selectedExam && (
        <div className="rounded-lg border border-primary-200 bg-primary-50 p-6">
          <h3 className="mb-3 font-semibold text-gray-900">Record Result for {activeExam?.title}</h3>
          <form onSubmit={handleRecordResult} className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Student ID</label>
              <input required type="number" value={resultForm.student} onChange={(e) => setResultForm({ ...resultForm, student: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Score</label>
              <input required type="number" min="0" value={resultForm.score} onChange={(e) => setResultForm({ ...resultForm, score: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Grade</label>
              <select value={resultForm.grade} onChange={(e) => setResultForm({ ...resultForm, grade: e.target.value })} className={inputClass}>
                {['A', 'B', 'C', 'D', 'F'].map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Remarks</label>
              <input value={resultForm.remarks} onChange={(e) => setResultForm({ ...resultForm, remarks: e.target.value })} className={inputClass} />
            </div>
            <div className="sm:col-span-4 flex gap-3">
              <button type="submit" disabled={resultSaving} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
                {resultSaving ? 'Saving...' : 'Record'}
              </button>
              <button type="button" onClick={() => setShowRecordResult(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {showBulkUpload && selectedExam && (
        <div className="rounded-lg border border-primary-200 bg-primary-50 p-6">
          <h3 className="mb-3 font-semibold text-gray-900">Bulk Upload Results for {activeExam?.title}</h3>
          <p className="mb-2 text-sm text-gray-600">
            CSV format: <code className="rounded bg-gray-100 px-1">student_id, score, grade, remarks</code> (one per line)
          </p>
          <textarea
            rows={6}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={'1, 85, A, Excellent\n2, 72, B, Good'}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <div className="mt-3 flex gap-3">
            <button onClick={handleBulkUpload} disabled={bulkSaving || !bulkText.trim()} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
              {bulkSaving ? 'Uploading...' : 'Upload'}
            </button>
            <button onClick={() => { setShowBulkUpload(false); setBulkText(''); }} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <label className="ml-auto cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Import CSV
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
        <div className="flex h-40 items-center justify-center"><LoadingSpinner /></div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Marks</th>
                <th className="px-4 py-3">Results</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => (
                <tr key={exam.id} className={`border-b border-gray-50 hover:bg-gray-50 ${selectedExam === exam.id ? 'bg-primary-50' : ''}`}>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">{exam.title}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">{exam.subject_name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">{new Date(exam.exam_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-gray-600">{exam.total_marks}</td>
                  <td className="px-4 py-3 text-gray-600">{exam.result_count}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => loadResults(exam.id)} className="text-sm font-medium text-primary-600 hover:underline">
                        View Results
                      </button>
                      <button onClick={() => { setResultForm({ student: '', score: '', grade: 'C', remarks: '' }); setSelectedExam(exam.id); setShowRecordResult(true); }} className="text-sm font-medium text-blue-600 hover:underline">
                        + Result
                      </button>
                      <button onClick={() => { setSelectedExam(exam.id); setShowBulkUpload(true); }} className="text-sm font-medium text-purple-600 hover:underline">
                        Bulk Upload
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!exams.length && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No exams found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedExam && !showRecordResult && !showBulkUpload && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Results: {activeExam?.title}</h2>
            <div className="flex gap-2">
              <button onClick={() => { setResultForm({ student: '', score: '', grade: 'C', remarks: '' }); setShowRecordResult(true); }} className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700">
                + Record Result
              </button>
              <button onClick={() => setShowBulkUpload(true)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Bulk Upload
              </button>
            </div>
          </div>
          {resultsLoading ? (
            <div className="flex h-24 items-center justify-center"><LoadingSpinner size="sm" /></div>
          ) : results.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                    <th className="pb-2 pr-4">Student</th>
                    <th className="pb-2 pr-4">Score</th>
                    <th className="pb-2 pr-4">Grade</th>
                    <th className="pb-2">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.id} className="border-b border-gray-50">
                      <td className="py-2 pr-4 font-medium text-gray-900">{r.student_name}</td>
                      <td className="py-2 pr-4 text-gray-600">{r.score} / {activeExam?.total_marks}</td>
                      <td className="py-2 pr-4">{gradeBadge(r.grade)}</td>
                      <td className="py-2 text-gray-500">{r.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-gray-500">No results recorded yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
