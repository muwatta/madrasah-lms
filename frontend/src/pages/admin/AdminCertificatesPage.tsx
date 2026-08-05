import { useEffect, useState } from 'react';
import { certificateAPI, userAPI } from '../../api';
import { fetchAllPages } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { SkeletonCard } from '../../components/Skeleton';

interface Certificate {
  id: string;
  student_name: string;
  certificate_type: string;
  title: string;
  description: string;
  file: string | null;
  certificate_number: string;
  issued_at: string;
}

const typeLabels: Record<string, { en: string; ar: string }> = {
  subject_completion: { en: 'Subject Completion', ar: 'إكمال مادة' },
  academic_excellence: { en: 'Academic Excellence', ar: 'تميز أكاديمي' },
  quran_memorization: { en: 'Quran Memorization', ar: 'تحفيظ القرآن' },
  learning_path: { en: 'Learning Path', ar: 'مسار تعلم' },
  achievement: { en: 'Achievement', ar: 'إنجاز' },
};

export default function AdminCertificatesPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    student: '',
    certificate_type: 'achievement',
    title: '',
    description: '',
  });

  const isAdmin = user?.role === 'mudeer';

  useEffect(() => {
    Promise.all([
      fetchAllPages((p) => certificateAPI.list(p)),
      isAdmin ? fetchAllPages((p) => userAPI.list({ role: 'student', ...p })) : Promise.resolve([]),
    ]).then(([certs, studs]) => {
      setCertificates(certs);
      setStudents(studs);
    }).catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setError('');
    try {
      const res = await certificateAPI.generate(form);
      setCertificates((prev) => [res.data, ...prev]);
      setShowForm(false);
      setForm({ student: '', certificate_type: 'achievement', title: '', description: '' });
    } catch {
      setError(language === 'ar' ? 'فشل إنشاء الشهادة' : 'Failed to generate certificate');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (cert: Certificate) => {
    const res = await certificateAPI.download(cert.id);
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cert.certificate_number}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string) => {
    if (!(language === 'ar' ? confirm('هل أنت متأكد من حذف هذه الشهادة؟') : confirm('Delete this certificate?'))) return;
    try {
      await certificateAPI.get(id);
      await fetch(`/api/v1/certificates/${id}/`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` } });
      setCertificates((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setError(language === 'ar' ? 'فشل الحذف' : 'Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {language === 'ar' ? 'الشهادات' : 'Certificates'}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {language === 'ar' ? 'إنشاء وإدارة شهادات الطلاب' : 'Issue and manage student certificates'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-press inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {language === 'ar' ? 'إنشاء شهادة' : 'Generate Certificate'}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">{error}</div>
      )}

      {showForm && (
        <form onSubmit={handleGenerate} className="mb-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {language === 'ar' ? 'إنشاء شهادة جديدة' : 'New Certificate'}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {language === 'ar' ? 'الطالب' : 'Student'}
              </label>
              <select
                value={form.student}
                onChange={(e) => setForm({ ...form, student: e.target.value })}
                required
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              >
                <option value="">{language === 'ar' ? 'اختر طالباً' : 'Select student'}</option>
                {students.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {language === 'ar' ? 'النوع' : 'Type'}
              </label>
              <select
                value={form.certificate_type}
                onChange={(e) => setForm({ ...form, certificate_type: e.target.value })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              >
                {Object.entries(typeLabels).map(([key, val]) => (
                  <option key={key} value={key}>{language === 'ar' ? val.ar : val.en}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {language === 'ar' ? 'العنوان' : 'Title'}
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              placeholder={language === 'ar' ? 'شهادة إتمام...' : 'Certificate of Completion...'}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {language === 'ar' ? 'الوصف' : 'Description'}
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button type="submit" disabled={generating} className="btn-press inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50">
              {generating
                ? (language === 'ar' ? 'جارٍ الإنشاء...' : 'Generating...')
                : (language === 'ar' ? 'إنشاء وتحميل PDF' : 'Generate & Download PDF')}
            </button>
          </div>
        </form>
      )}

      {certificates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-16 text-center">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {language === 'ar' ? 'لا توجد شهادات' : 'No certificates yet'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-750">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {language === 'ar' ? 'الطالب' : 'Student'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {language === 'ar' ? 'الشهادة' : 'Certificate'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {language === 'ar' ? 'الرقم' : 'Number'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {language === 'ar' ? 'التاريخ' : 'Date'}
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {language === 'ar' ? 'إجراءات' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {certificates.map((cert) => {
                const t = typeLabels[cert.certificate_type] || { en: cert.certificate_type, ar: cert.certificate_type };
                return (
                  <tr key={cert.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {cert.student_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      <span className="inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-900/20 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                        {language === 'ar' ? t.ar : t.en}
                      </span>
                      <span className="ml-2 text-gray-500 dark:text-gray-400">{cert.title}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs font-mono text-gray-500 dark:text-gray-400">
                      {cert.certificate_number}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(cert.issued_at).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        {cert.file && (
                          <button onClick={() => handleDownload(cert)} className="inline-flex items-center gap-1 rounded-md bg-primary-50 dark:bg-primary-900/20 px-2.5 py-1.5 text-xs font-medium text-primary-700 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/30">
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            PDF
                          </button>
                        )}
                        {isAdmin && (
                          <button onClick={() => handleDelete(cert.id)} className="inline-flex items-center gap-1 rounded-md bg-red-50 dark:bg-red-900/20 px-2.5 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30">
                            {language === 'ar' ? 'حذف' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
