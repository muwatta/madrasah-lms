import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../api';
import type { AdminDashboard as AdminDashboardType } from '../../types';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [data, setData] = useState<AdminDashboardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboardAPI.admin()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.detail || t('adminDashboard.loadFailed')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (error) return <div className="max-w-5xl mx-auto px-4 py-8"><div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700 flex items-center gap-3"><svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>{error}</div></div>;
  if (!data) return null;

  const perfColor = data.average_performance >= 70 ? 'text-green-600' : data.average_performance >= 50 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
        <h1 className="text-2xl font-bold text-gray-900">{t('adminDashboard.title')}</h1>
        <a
          href={`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/export/students/?format=csv`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-press rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
        >
          {t('common.exportCsv')}
        </a>
      </div>
      <p className="text-sm text-gray-500 mb-6">{t('guides.adminDashboard')}</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title={t('adminDashboard.totalUsers')} value={data.total_users} delay={0} icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>} />
        <StatCard title={t('adminDashboard.totalStudents')} value={data.total_students} color="bg-blue-600" delay={50} icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342" /></svg>} />
        <StatCard title={t('adminDashboard.totalTeachers')} value={data.total_teachers} color="bg-purple-600" delay={100} icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>} />
        <StatCard title={t('adminDashboard.totalParents')} value={data.total_parents} color="bg-amber-600" delay={150} icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>} />
        <StatCard title={t('adminDashboard.totalSubjects')} value={data.total_subjects} color="bg-teal-600" delay={200} icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>} />
        <StatCard title={t('adminDashboard.totalQuizzes')} value={data.total_quizzes} color="bg-indigo-600" delay={250} icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>} />
        <StatCard title={t('adminDashboard.totalExams')} value={data.total_exams} color="bg-rose-600" delay={300} icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>} />
        <div className="card-hover rounded-xl border border-gray-200 bg-white p-6 shadow-sm opacity-0 animate-slide-up" style={{ animationDelay: '350ms' }}>
          <p className="text-sm font-medium text-gray-500">{t('adminDashboard.avgPerformance')}</p>
          <p className={`mt-1 text-2xl font-bold ${perfColor}`}>{data.average_performance.toFixed(1)}%</p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-primary-600 transition-all" style={{ width: `${Math.min(data.average_performance, 100)}%` }} />
          </div>
        </div>
      </div>

      {data.subject_stats.length > 0 && (
        <div className="card-hover rounded-xl border border-gray-200 bg-white p-6 shadow-sm opacity-0 animate-slide-up" style={{ animationDelay: '400ms' }}>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('adminDashboard.subjectStats')}</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-end text-xs font-medium uppercase text-gray-500">
                  <th className="pb-3 pe-4">{t('fields.subject')}</th>
                  <th className="pb-3 pe-4">{t('adminDashboard.totalStudents')}</th>
                  <th className="pb-3">{t('adminDashboard.totalQuizzes')}</th>
                </tr>
              </thead>
              <tbody>
                {data.subject_stats.map((subject) => (
                  <tr key={subject.id} className="border-b border-gray-50">
                    <td className="py-3 pe-4 font-medium text-gray-900">{subject.name_ar}</td>
                    <td className="py-3 pe-4 text-gray-600">{subject.student_count}</td>
                    <td className="py-3 text-gray-600">{subject.quiz_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card-hover rounded-xl border border-gray-200 bg-white p-6 shadow-sm opacity-0 animate-slide-up" style={{ animationDelay: '450ms' }}>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('adminDashboard.quickLinks')}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { to: '/admin/users', label: t('adminDashboard.manageUsers') },
            { to: '/admin/subjects', label: t('adminDashboard.manageSubjects') },
            { to: '/admin/enrollments', label: t('adminDashboard.manageEnrollments') },
            { to: '/admin/exams', label: t('adminDashboard.manageExams') },
          ].map((link) => (
            <Link key={link.to} to={link.to} className="btn-press block rounded-xl border border-primary-200 bg-primary-50 p-4 text-center font-medium text-primary-700 transition-all hover:bg-primary-100 hover:shadow-sm">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
