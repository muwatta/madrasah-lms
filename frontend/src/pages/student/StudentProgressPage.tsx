import { useState, useEffect } from 'react';
import { dashboardAPI } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import LoadingSpinner from '../../components/LoadingSpinner';

interface Badge {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  icon: string;
  earned: boolean;
}

interface SubjectMastery {
  subject_id: number;
  subject_name_ar: string;
  subject_name_en: string;
  average_score: number;
  total_attempts: number;
}

interface ProgressData {
  streak: number;
  subject_mastery: SubjectMastery[];
  badges: Badge[];
  stats: {
    total_attempts: number;
    overall_average: number;
    total_enrolled_subjects: number;
    total_badges_earned: number;
    total_badges: number;
  };
}

function getMasteryColor(score: number) {
  if (score >= 80) return { stroke: '#22c55e', text: 'text-emerald-600', bg: 'bg-emerald-50' };
  if (score >= 60) return { stroke: '#f59e0b', text: 'text-amber-600', bg: 'bg-amber-50' };
  return { stroke: '#ef4444', text: 'text-red-500', bg: 'bg-red-50' };
}

function MasteryWheel({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const colors = getMasteryColor(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f3f4f6" strokeWidth="6" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={colors.stroke} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-sm font-bold ${colors.text}`}>{score}%</span>
      </div>
    </div>
  );
}

export default function StudentProgressPage() {
  const { t, language } = useLanguage();
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardAPI.studentProgress()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load progress'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (error) return <div className="max-w-5xl mx-auto px-4 py-8"><div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">{error}</div></div>;
  if (!data) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('studentProgress.learningJourney')}</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🔥</span>
            <p className="text-xs font-medium text-gray-400">{t('studentProgress.streak')}</p>
          </div>
          <p className="text-2xl font-bold text-orange-500">{data.streak}</p>
          <p className="text-xs text-gray-400">{t('studentProgress.streakDays')}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-400">{t('studentProgress.overallAverage')}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{data.stats.overall_average}%</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-400">{t('studentProgress.totalAttempts')}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{data.stats.total_attempts}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-400">{t('studentProgress.badges')}</p>
          <p className="mt-1 text-2xl font-bold text-primary-600">{data.stats.total_badges_earned}/{data.stats.total_badges}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">{t('studentProgress.subjectMastery')}</h2>
        {data.subject_mastery.length === 0 ? (
          <p className="text-sm text-gray-400">{language === 'ar' ? 'لم تُسجل في أي مادة بعد' : 'No subjects enrolled yet'}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.subject_mastery.map((s) => (
              <div key={s.subject_id} className="flex items-center gap-4 rounded-lg border border-gray-50 bg-gray-50/50 p-4">
                <MasteryWheel score={s.average_score} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{language === 'ar' ? s.subject_name_ar : s.subject_name_en}</p>
                  <p className="text-xs text-gray-400">{s.total_attempts} {language === 'ar' ? 'محاولة' : 'attempts'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">{t('studentProgress.badges')} ({data.stats.total_badges_earned} {t('studentProgress.badgesEarned')})</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {data.badges.map((badge) => (
            <div
              key={badge.id}
              className={`flex flex-col items-center rounded-xl border p-4 text-center transition-all ${
                badge.earned
                  ? 'border-primary-200 bg-primary-50/50 shadow-sm'
                  : 'border-gray-100 bg-gray-50/50 opacity-50 grayscale'
              }`}
            >
              <span className="text-3xl mb-2">{badge.icon}</span>
              <p className="text-xs font-semibold text-gray-800">{language === 'ar' ? badge.name_ar : badge.name_en}</p>
              <p className="mt-1 text-[10px] text-gray-400">{language === 'ar' ? badge.description_ar : badge.description_en}</p>
              {badge.earned && (
                <span className="mt-2 rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-semibold text-primary-700">
                  {language === 'ar' ? 'تم الحصول عليها' : 'Earned'}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
