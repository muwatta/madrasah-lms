import { useEffect, useState } from 'react';
import { certificateAPI } from '../../api';
import { unwrapPaginated } from '../../api/client';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';

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

const typeIcons: Record<string, string> = {
  subject_completion: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  academic_excellence: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
  quran_memorization: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  learning_path: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  achievement: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
};

const typeLabels: Record<string, { en: string; ar: string }> = {
  subject_completion: { en: 'Subject Completion', ar: 'إكمال مادة' },
  academic_excellence: { en: 'Academic Excellence', ar: 'تميز أكاديمي' },
  quran_memorization: { en: 'Quran Memorization', ar: 'تحفيظ القرآن' },
  learning_path: { en: 'Learning Path', ar: 'مسار تعلم' },
  achievement: { en: 'Achievement', ar: 'إنجاز' },
};

export default function CertificatesPage() {
  const { language } = useLanguage();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    certificateAPI.list()
      .then((res) => setCertificates(unwrapPaginated(res.data)))
      .catch(() => setError('Failed to load certificates'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900">{language === 'ar' ? 'الشهادات' : 'Certificates'}</h1>
      </div>
      <p className="mb-6 text-sm text-gray-500">{language === 'ar' ? 'شهادات الإنجاز والتقدير' : 'Achievement and recognition certificates'}</p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {certificates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900">{language === 'ar' ? 'لا توجد شهادات بعد' : 'No certificates yet'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {certificates.map((cert) => {
            const t = typeLabels[cert.certificate_type] || { en: cert.certificate_type, ar: cert.certificate_type };
            return (
              <div key={cert.id} className="card-hover rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-sm">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={typeIcons[cert.certificate_type] || typeIcons.achievement} />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{cert.title}</h3>
                        <p className="text-xs text-gray-500">{language === 'ar' ? t.ar : t.en} &middot; {cert.certificate_number}</p>
                      </div>
                      {cert.file && (
                        <a
                          href={cert.file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-press inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-700"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {language === 'ar' ? 'تحميل PDF' : 'Download PDF'}
                        </a>
                      )}
                    </div>
                    {cert.description && (
                      <p className="mt-1.5 text-sm text-gray-600">{cert.description}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(cert.issued_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
