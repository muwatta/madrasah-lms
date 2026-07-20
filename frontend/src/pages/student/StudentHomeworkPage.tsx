import { useEffect, useState } from 'react';
import { lessonAPI, subjectAPI } from '../../api';
import { unwrapPaginated } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { SkeletonCard } from '../../components/Skeleton';

interface Homework {
  id: number;
  title: string;
  subject: number;
  subject_name: string;
  description: string;
  due_date: string;
  published: boolean;
}

interface Submission {
  id: number;
  homework: number;
  homework_title?: string;
  student: number;
  answer: string;
  content: string;
  file: string | null;
  grade: number | null;
  feedback: string;
  submitted_at: string;
}

interface Subject {
  id: number;
  name: string;
}

type HomeworkStatus = 'pending' | 'submitted' | 'graded';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function isOverdue(dateStr: string) {
  return new Date(dateStr) < new Date();
}

export default function StudentHomeworkPage() {
  const { t, language } = useLanguage();
  const [homework, setHomework] = useState<Homework[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filterSubject, setFilterSubject] = useState<number | ''>('');
  const [filterStatus, setFilterStatus] = useState<HomeworkStatus | ''>('');

  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  const [submitAnswer, setSubmitAnswer] = useState('');
  const [submitFile, setSubmitFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      lessonAPI.homework.list({ published: true }),
      subjectAPI.list(),
    ])
      .then(([hwRes, subRes]) => {
        setHomework(unwrapPaginated(hwRes.data));
        setSubjects(unwrapPaginated(subRes.data));
      })
      .catch(() => setError(t('common.loadFailed')))
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    if (homework.length === 0) return;
    lessonAPI.homework.list()
      .then((res) => {
        const all = unwrapPaginated<any>(res.data);
        const mySubs: Submission[] = [];
        all.forEach((hw: any) => {
          if (hw.submissions) {
            hw.submissions.forEach((s: Submission) => {
              mySubs.push({ ...s, homework: hw.id, homework_title: hw.title });
            });
          }
        });
        setSubmissions(mySubs);
      })
      .catch(() => {});
  }, [homework]);

  const getHomeworkStatus = (hwId: number): HomeworkStatus => {
    const sub = submissions.find((s) => s.homework === hwId);
    if (!sub) return 'pending';
    if (sub.grade !== null) return 'graded';
    return 'submitted';
  };

  const getSubmission = (hwId: number) => submissions.find((s) => s.homework === hwId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHomework || !submitAnswer.trim()) return;
    setSubmitting(true);
    try {
      let payload: any = { answer: submitAnswer };
      if (submitFile) {
        const fd = new FormData();
        fd.append('content', submitAnswer);
        fd.append('file', submitFile);
        payload = fd;
      }
      await lessonAPI.homework.submit(selectedHomework.id, payload);
      const subRes = await lessonAPI.homework.submissions(selectedHomework.id);
      const subs: Submission[] = unwrapPaginated(subRes.data) as Submission[];
      if (subs.length > 0) {
        setSubmissions((prev) => [...prev.filter((s) => s.homework !== selectedHomework.id), { ...subs[0], homework: selectedHomework.id, homework_title: selectedHomework.title }]);
      }
      setSelectedHomework(null);
      setSubmitAnswer('');
      setSubmitFile(null);
    } catch {
      setError(t('common.saveFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredHomework = homework.filter((hw) => {
    if (filterSubject && hw.subject !== filterSubject) return false;
    if (filterStatus) {
      const status = getHomeworkStatus(hw.id);
      if (status !== filterStatus) return false;
    }
    return true;
  });

  const statusStyles: Record<HomeworkStatus, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: language === 'ar' ? 'لم يُقدّم' : 'Pending' },
    submitted: { bg: 'bg-blue-100', text: 'text-blue-700', label: language === 'ar' ? 'مُقدّم' : 'Submitted' },
    graded: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: language === 'ar' ? 'مُقيّم' : 'Graded' },
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-2">
          <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>
        <div className="h-4 w-64 mt-2 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
          ))}
        </div>
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{language === 'ar' ? 'الواجبات' : 'Homework'}</h1>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{language === 'ar' ? 'عرض وتقديم الواجبات' : 'View and submit homework assignments'}</p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">
          {error}
          <button onClick={() => setError('')} className="me-2 underline">{t('common.close')}</button>
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-3">
        <select value={filterSubject} onChange={(e) => setFilterSubject(Number(e.target.value) || '')}
          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none">
          <option value="">{language === 'ar' ? 'جميع المواد' : 'All Subjects'}</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as HomeworkStatus | '')}
          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none">
          <option value="">{language === 'ar' ? 'جميع الحالات' : 'All Statuses'}</option>
          <option value="pending">{language === 'ar' ? 'لم يُقدّم' : 'Pending'}</option>
          <option value="submitted">{language === 'ar' ? 'مُقدّم' : 'Submitted'}</option>
          <option value="graded">{language === 'ar' ? 'مُقيّم' : 'Graded'}</option>
        </select>
      </div>

      {filteredHomework.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
            <svg className="h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{language === 'ar' ? 'لا توجد وواجبات' : 'No homework found'}</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{language === 'ar' ? 'جرب تغيير الفلاتر' : 'Try changing the filters'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHomework.map((hw, idx) => {
            const status = getHomeworkStatus(hw.id);
            const overdue = isOverdue(hw.due_date) && status === 'pending';
            return (
              <div
                key={hw.id}
                className={`card-hover opacity-0 animate-slide-up rounded-xl border bg-white dark:bg-gray-800 p-5 shadow-sm transition-shadow hover:shadow-md ${overdue ? 'border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-900/10' : 'border-gray-100 dark:border-gray-700'}`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{hw.title}</h3>
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[status].bg} ${statusStyles[status].text}`}>
                        {statusStyles[status].label}
                      </span>
                      {overdue && (
                        <span className="inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                          {language === 'ar' ? 'متأخر' : 'Overdue'}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mb-2 text-xs text-gray-400 dark:text-gray-500">
                      <span>{hw.subject_name}</span>
                      <span>•</span>
                      <span>{language === 'ar' ? 'الاستحقاق' : 'Due'}: {formatDate(hw.due_date)}</span>
                    </div>
                    {hw.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{hw.description}</p>
                    )}

                    {status === 'graded' && (
                      <div className="mt-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-3">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{language === 'ar' ? 'الدرجة' : 'Grade'}</p>
                            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{getSubmission(hw.id)?.grade}%</p>
                          </div>
                          {getSubmission(hw.id)?.feedback && (
                            <div className="flex-1">
                              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{language === 'ar' ? 'ملاحظات المعلّم' : 'Teacher Feedback'}</p>
                              <p className="text-sm text-emerald-700 dark:text-emerald-400">{getSubmission(hw.id)?.feedback}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {status === 'submitted' && (
                      <div className="mt-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3">
                        <p className="text-xs font-medium text-blue-600 dark:text-blue-400">{language === 'ar' ? 'في انتظار التقييم' : 'Awaiting grade'}</p>
                        {getSubmission(hw.id)?.file && (
                          <a href={getSubmission(hw.id)!.file!} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline">
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            {language === 'ar' ? 'عرض الملف المرفوع' : 'View uploaded file'}
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {status === 'pending' && (
                    <button
                      onClick={() => setSelectedHomework(hw)}
                      className="btn-press shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                      {language === 'ar' ? 'تقديم' : 'Submit'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedHomework && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white dark:bg-gray-800 p-6 shadow-xl">
            <h2 className="mb-1 text-lg font-bold text-gray-900 dark:text-gray-100">{selectedHomework.title}</h2>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{selectedHomework.subject_name}</p>
            {selectedHomework.description && (
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{selectedHomework.description}</p>
            )}
              <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">{language === 'ar' ? 'إجابتك' : 'Your Answer'}</label>
                <textarea
                  rows={5}
                  value={submitAnswer}
                  onChange={(e) => setSubmitAnswer(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2.5 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:outline-none"
                  placeholder={language === 'ar' ? 'اكتب إجابتك هنا...' : 'Type your answer here...'}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">{language === 'ar' ? 'ملف مرفق (اختياري)' : 'Attachment (optional)'}</label>
                <input type="file" onChange={(e) => setSubmitFile(e.target.files?.[0] || null)} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2.5 text-sm file:me-2 file:rounded file:border-0 file:bg-primary-50 dark:file:bg-primary-900/30 file:px-3 file:py-1 file:text-xs file:font-medium file:text-primary-700 dark:file:text-primary-400 hover:file:bg-primary-100 dark:hover:file:bg-primary-900/50" />
                {submitFile && <p className="mt-1 text-xs text-gray-400">{submitFile.name}</p>}
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={submitting || !submitAnswer.trim()}
                  className="btn-press rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
                  {submitting ? t('common.saving') : (language === 'ar' ? 'تقديم' : 'Submit')}
                </button>
                <button type="button" onClick={() => { setSelectedHomework(null); setSubmitAnswer(''); setSubmitFile(null); }}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
