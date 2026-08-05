import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '../../../context/LanguageContext';
import { fetchAllPages } from '../../../api/client';
import { academicAPI, subjectAPI, schoolClassAPI } from '../../../api';
import {
  useQuestionBanks,
  useUploadQuestionBank,
  useDeleteQuestionBank,
  useConvertQuestionBank,
} from '../../../hooks/useQuestionBanks';
import type { QuestionBank } from '../../../types';
import ConfirmModal from '../../../components/ConfirmModal';
import { SkeletonTable } from '../../../components/Skeleton';

interface SessionRow {
  id: number;
  name: string;
  is_current: boolean;
  start_date: string | null;
}

interface TermRow {
  id: number;
  session: number;
  name: string;
  term_number: number;
}

const inputCls =
  'mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';

export default function QuestionBanksPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const { data: banks, isLoading } = useQuestionBanks();
  const upload = useUploadQuestionBank();
  const remove = useDeleteQuestionBank();
  const convert = useConvertQuestionBank();

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      return fetchAllPages<SessionRow>((p) => academicAPI.sessions.list(p));
    },
  });
  const { data: terms = [] } = useQuery({
    queryKey: ['terms'],
    queryFn: async () => {
      return fetchAllPages<TermRow>((p) => academicAPI.terms.list(p));
    },
  });
  const { data: subjects = [] } = useQuery({
    queryKey: ['curriculum'],
    queryFn: async () => {
      return fetchAllPages<{ id: number; name_ar: string; name_en: string }>((p) => subjectAPI.list(p));
    },
  });
  const { data: classes = [] } = useQuery({
    queryKey: ['school-classes'],
    queryFn: async () => {
      return fetchAllPages<{ id: number; name_ar: string; name_en: string }>((p) => schoolClassAPI.list(p));
    },
  });

  const [showForm, setShowForm] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [subject, setSubject] = useState('');
  const [schoolClass, setSchoolClass] = useState('');
  const [session, setSession] = useState('');
  const [term, setTerm] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<QuestionBank | null>(null);

  const sessionTerms = useMemo(
    () => terms.filter((tm) => tm.session === Number(session)).sort((a, b) => a.term_number - b.term_number),
    [terms, session],
  );

  const byYear = useMemo(() => {
    const map = new Map<string, QuestionBank[]>();
    for (const b of banks ?? []) {
      const key = b.session_name || `${b.session}`;
      const arr = map.get(key) ?? [];
      arr.push(b);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [banks]);

  const handleUpload = async () => {
    setError(null);
    if (!file) { setError(t('questionBanks.selectFile')); return; }
    if (!subject || !schoolClass || !session || !term) {
      setError(t('questionBanks.uploadError'));
      return;
    }
    const fd = new FormData();
    fd.append('file', file);
    fd.append('subject', subject);
    fd.append('school_class', schoolClass);
    fd.append('session', session);
    fd.append('term', term);
    if (title) fd.append('title', title);
    try {
      await upload.mutateAsync(fd);
      setShowForm(false);
      setFile(null);
      setTitle('');
      setSuccess(t('questionBanks.uploaded'));
    } catch (e: any) {
      setError(e?.response?.data?.error ?? t('questionBanks.uploadError'));
    }
  };

  const handleConvert = async (bank: QuestionBank) => {
    setError(null);
    try {
      await convert.mutateAsync(bank.id);
      setSuccess(t('questionBanks.converted'));
    } catch (e: any) {
      setError(e?.response?.data?.error ?? t('questionBanks.convertError'));
    }
  };

  const statusBadge = (bank: QuestionBank) => {
    if (bank.status === 'processing') return <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">{t('questionBanks.status_processing')}</span>;
    if (bank.status === 'failed') return <span className="rounded-full bg-red-100 dark:bg-red-900/30 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:text-red-400">{t('questionBanks.status_failed')}</span>;
    return <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">{t('questionBanks.status_ready')}</span>;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('questionBanks.title')}</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          {showForm ? t('common.cancel') : t('questionBanks.uploadNew')}
        </button>
      </div>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">{t('questionBanks.subtitle')}</p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">
          {error}
          <button onClick={() => setError(null)} className="ms-2 underline">{t('common.dismiss')}</button>
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-3 text-sm text-emerald-700 dark:text-emerald-400">
          {success}
          <button onClick={() => setSuccess(null)} className="ms-2 underline">{t('common.dismiss')}</button>
        </div>
      )}

      {showForm && (
        <div className="mb-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">{t('questionBanks.uploadNew')}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('questionBanks.subject')}</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls}>
                <option value="">{t('filters.chooseSubject')}</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name_ar} / {s.name_en}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('questionBanks.class')}</label>
              <select value={schoolClass} onChange={(e) => setSchoolClass(e.target.value)} className={inputCls}>
                <option value="">{t('filters.chooseClass')}</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name_ar} / {c.name_en}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('questionBanks.year')}</label>
              <select
                value={session}
                onChange={(e) => { setSession(e.target.value); setTerm(''); }}
                className={inputCls}
              >
                <option value="">{t('questionBanks.year')}</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}{s.is_current ? ` · ${t('filters.currentYear')}` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('questionBanks.term')}</label>
              <select value={term} onChange={(e) => setTerm(e.target.value)} className={inputCls}>
                <option value="">{t('questionBanks.term')}</option>
                {sessionTerms.map((tm) => (
                  <option key={tm.id} value={tm.id}>{tm.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('questionBanks.titleField')}</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('questionBanks.file')}</label>
              <input
                type="file"
                accept=".docx,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="mt-1 block w-full text-sm text-gray-700 dark:text-gray-300 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-700 dark:file:bg-primary-900/30 dark:file:text-primary-400"
              />
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{t('questionBanks.onlyOnePerTerm')}</p>
          <button
            onClick={handleUpload}
            disabled={upload.isPending}
            className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {upload.isPending ? t('questionBanks.uploading') : t('questionBanks.upload')}
          </button>
        </div>
      )}

      {isLoading ? (
        <SkeletonTable rows={6} />
      ) : byYear.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-12 text-center text-gray-500 dark:text-gray-400">
          {t('questionBanks.noBanks')}
        </div>
      ) : (
        byYear.map(([year, yearBanks]) => (
          <div key={year} className="mb-8">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
              <span className="inline-block h-5 w-1 rounded-full bg-primary-500" />
              {t('questionBanks.yearGroup')}: {year}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {yearBanks.map((bank) => (
                <div key={bank.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-gray-900 dark:text-gray-100">
                        {bank.subject_name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {bank.school_class_name} · {bank.term_name} ({bank.term_number})
                      </p>
                    </div>
                    {statusBadge(bank)}
                  </div>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    {bank.title || t('questionBanks.titleField')}
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>{bank.question_count} {t('questionBanks.questions')}</span>
                    {bank.size_saved > 0 && <span>-{Math.round(bank.size_saved / 1024)} KB</span>}
                  </div>
                  {bank.status === 'failed' && bank.error_message && (
                    <p className="mt-2 text-xs text-red-600 dark:text-red-400">{bank.error_message}</p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => navigate(`/teacher/question-banks/${bank.id}`)}
                      disabled={bank.status !== 'ready'}
                      className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                    >
                      {t('questionBanks.viewEdit')}
                    </button>
                    {bank.converted_quiz ? (
                      <button
                        onClick={() => navigate(`/teacher/quizzes/${bank.converted_quiz}/analytics`)}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                      >
                        {t('questionBanks.converted')}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConvert(bank)}
                        disabled={bank.status !== 'ready' || convert.isPending}
                        className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                      >
                        {t('questionBanks.convert')}
                      </button>
                    )}
                    <button
                      onClick={() => setConfirmDelete(bank)}
                      className="rounded-lg border border-red-200 dark:border-red-800 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      {t('questionBanks.delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {confirmDelete && (
        <ConfirmModal
          variant="danger"
          title={t('questionBanks.delete')}
          message={t('questionBanks.deleteConfirm')}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            remove.mutate(confirmDelete.id);
            setConfirmDelete(null);
          }}
        />
      )}
    </div>
  );
}
