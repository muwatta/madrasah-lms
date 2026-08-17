import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const routeLabels: Record<string, string> = {
  dashboard: 'nav.dashboard',
  results: 'nav.myResults',
  exams: 'nav.exams',
  progress: 'nav.progress',
  attendance: 'nav.attendance',
  homework: 'nav.homework',
  portfolio: 'nav.portfolio',
  certificates: 'nav.certificates',
  announcements: 'nav.announcements',
  messages: 'nav.messages',
  career: 'nav.career',
  tutor: 'nav.aiTutor',
  path: 'nav.learningPath',
  flashcards: 'nav.flashcards',
  character: 'nav.character',
  fasaaha: 'nav.fasaaha',
  users: 'nav.users',
  subjects: 'nav.subjects',
  'class-subjects': 'nav.classSubjects',
  enrollments: 'nav.enrollments',
  finance: 'nav.finance',
  reports: 'nav.reports',
  engagement: 'nav.engagement',
  admissions: 'nav.admissions',
  'at-risk': 'nav.atRisk',
  'teacher-workload': 'nav.teacherWorkload',
  whatsapp: 'nav.whatsapp',
  'parent-students': 'nav.parentLinks',
  audit: 'nav.audit',
  'publish-results': 'nav.publishResults',
  fees: 'nav.feeStatus',
  'child-results': 'nav.childResults',
  students: 'nav.students',
  quizzes: 'nav.myQuizzes',
  questions: 'nav.questionBank',
  'question-banks': 'nav.termQuestionBanks',
  'lesson-planner': 'nav.lessonPlanner',
  timetable: 'nav.timetable',
  quran: 'nav.quran',
  profile: 'common.profile',
  'change-password': 'common.changePassword',
  calendar: 'nav.calendar',
  login: 'auth.login',
  register: 'auth.register',
};

export default function Breadcrumbs() {
  const { t, language } = useLanguage();
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  if (segments.length <= 1) return null;

  const Chevron = language === 'ar' ? ChevronLeft : ChevronRight;

  const crumbs = segments.map((seg, i) => {
    const path = '/' + segments.slice(0, i + 1).join('/');
    const labelKey = routeLabels[seg];
    const isLast = i === segments.length - 1;

    return (
      <li key={path} className="flex items-center gap-1.5">
        {i > 0 && <Chevron className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--color-text-muted)' }} />}
        {isLast ? (
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {labelKey ? t(labelKey) : decodeURIComponent(seg).replace(/-/g, ' ')}
          </span>
        ) : (
          <Link
            to={path}
            className="text-sm transition-colors hover:underline"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {labelKey ? t(labelKey) : decodeURIComponent(seg).replace(/-/g, ' ')}
          </Link>
        )}
      </li>
    );
  });

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className={`flex flex-wrap items-center gap-0.5 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
        <li className="flex items-center gap-1.5">
          {segments.length > 1 && (
            <>
              <Chevron className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--color-text-muted)' }} />
              <Link
                to={`/${segments[0]}`}
                className="text-sm transition-colors hover:underline"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {routeLabels[segments[0]] ? t(routeLabels[segments[0]]) : segments[0]}
              </Link>
            </>
          )}
        </li>
        {crumbs.slice(segments.length > 1 ? 1 : 0)}
      </ol>
    </nav>
  );
}
