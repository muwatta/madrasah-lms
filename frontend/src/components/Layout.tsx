import { useState, useRef, useEffect, type JSX } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { notificationAPI } from '../api';
import PageNavigation from './PageNavigation';
import type { User } from '../types';

interface NavLink {
  labelKey: string;
  path: string;
  icon: JSX.Element;
}

function S({ d, viewBox = '0 0 24 24' }: { d: string; viewBox?: string }) {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox={viewBox}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

const navIcons: Record<string, JSX.Element> = {
  dashboard:       <S d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
  availableQuizzes:<S d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
  myResults:       <S d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
  exams:           <S d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />,
  progress:        <S d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />,
  attendance:      <S d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
  homework:        <S d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
  portfolio:       <S d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  certificates:    <S d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
  announcements:   <S d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />,
  messages:        <S d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />,
  prayerTimes:     <S d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
  career:          <S d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
  calendar:        <S d="M6 2v2m12-2v2M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2zm0 8v6a1 1 0 001 1h14a1 1 0 001-1v-6H5z" />,
  aiTutor:         <S d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />,
  learningPath:    <S d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />,
  fasaaha:         <S d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />,
  dialogue:        <S d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />,
  leaderboard:     <S d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
  dailyGoals:      <S d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
  flashcards:      <S d="M4 6h16M4 10h16M4 14h16M4 18h16" />,
  character:       <S d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
  myQuizzes:       <S d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
  questionBank:    <S d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0" />,
  students:        <S d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
  users:            <S d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a4 4 0 01-4 4m0 0a4 4 0 01-4-4m4 4v1" />,
  subjects:        <S d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
  enrollments:     <S d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />,
  finance:         <S d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  feeStatus:       <S d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />,
  reports:         <S d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  interventions:   <S d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />,
  engagement:      <S d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />,
  academic:        <S d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />,
  admissions:      <S d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />,
  atRisk:          <S d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  teacherWorkload: <S d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />,
  whatsapp:        <S d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />,
  lessonPlanner:   <S d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  quran:           <S d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />,
  parentLinks:     <S d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />,
  alerts:          <S d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />,
};

const roleNavLinks: Record<User['role'], NavLink[]> = {
  student: [
    { labelKey: 'nav.dashboard', path: '/dashboard', icon: navIcons.dashboard },
    { labelKey: 'nav.availableQuizzes', path: '/quizzes', icon: navIcons.availableQuizzes },
    { labelKey: 'nav.myResults', path: '/results', icon: navIcons.myResults },
    { labelKey: 'nav.exams', path: '/exams', icon: navIcons.exams },
    { labelKey: 'nav.progress', path: '/progress', icon: navIcons.progress },
    { labelKey: 'nav.attendance', path: '/attendance', icon: navIcons.attendance },
    { labelKey: 'nav.homework', path: '/homework', icon: navIcons.homework },
    { labelKey: 'nav.calendar', path: '/calendar', icon: navIcons.calendar },
    { labelKey: 'nav.portfolio', path: '/portfolio', icon: navIcons.portfolio },
    { labelKey: 'nav.certificates', path: '/certificates', icon: navIcons.certificates },
    { labelKey: 'nav.announcements', path: '/announcements', icon: navIcons.announcements },
    { labelKey: 'nav.messages', path: '/messages', icon: navIcons.messages },
    { labelKey: 'nav.prayerTimes', path: '/prayer-times', icon: navIcons.prayerTimes },
    { labelKey: 'nav.career', path: '/career', icon: navIcons.career },
    { labelKey: 'nav.aiTutor', path: '/tutor', icon: navIcons.aiTutor },
    { labelKey: 'nav.learningPath', path: '/path', icon: navIcons.learningPath },
    { labelKey: 'nav.flashcards', path: '/flashcards', icon: navIcons.flashcards },
    { labelKey: 'nav.character', path: '/character', icon: navIcons.character },
    { labelKey: 'nav.myExamResults', path: '/my-results', icon: navIcons.exams },
    { labelKey: 'nav.chooseSubjects', path: '/choose-subjects', icon: navIcons.enrollments },
    { labelKey: 'nav.fasaaha', path: '/fasaaha', icon: navIcons.fasaaha },
    { labelKey: 'nav.dialogue', path: '/fasaaha/conversation', icon: navIcons.dialogue },
    { labelKey: 'nav.leaderboard', path: '/fasaaha/leaderboard', icon: navIcons.leaderboard },
    { labelKey: 'nav.dailyGoals', path: '/fasaaha/goals', icon: navIcons.dailyGoals },
    { labelKey: 'nav.scoreTrends', path: '/fasaaha/trends', icon: navIcons.reports },
  ],
  ustaadh: [
    { labelKey: 'nav.dashboard', path: '/dashboard', icon: navIcons.dashboard },
    { labelKey: 'nav.myQuizzes', path: '/quizzes', icon: navIcons.myQuizzes },
    { labelKey: 'nav.questionBank', path: '/questions', icon: navIcons.questionBank },
    { labelKey: 'nav.students', path: '/students', icon: navIcons.students },
    { labelKey: 'nav.lessonPlanner', path: '/lesson-planner', icon: navIcons.lessonPlanner },
    { labelKey: 'nav.homework', path: '/homework', icon: navIcons.homework },
    { labelKey: 'nav.timetable', path: '/timetable', icon: navIcons.calendar },
    { labelKey: 'nav.quran', path: '/quran', icon: navIcons.quran },
    { labelKey: 'nav.character', path: '/character', icon: navIcons.character },
    { labelKey: 'nav.attendance', path: '/attendance', icon: navIcons.attendance },
    { labelKey: 'nav.announcements', path: '/announcements', icon: navIcons.announcements },
    { labelKey: 'nav.messages', path: '/messages', icon: navIcons.messages },
    { labelKey: 'nav.prayerTimes', path: '/prayer-times', icon: navIcons.prayerTimes },
    { labelKey: 'nav.resultsEntry', path: '/results', icon: navIcons.reports },
    { labelKey: 'nav.qrScanner', path: '/qr-scanner', icon: navIcons.attendance },
    { labelKey: 'nav.fasaaha', path: '/fasaaha', icon: navIcons.fasaaha },
  ],
  parent: [
    { labelKey: 'nav.dashboard', path: '/dashboard', icon: navIcons.dashboard },
    { labelKey: 'nav.messages', path: '/messages', icon: navIcons.messages },
    { labelKey: 'nav.attendance', path: '/attendance', icon: navIcons.attendance },
    { labelKey: 'nav.feeStatus', path: '/fees', icon: navIcons.feeStatus },
    { labelKey: 'nav.announcements', path: '/announcements', icon: navIcons.announcements },
    { labelKey: 'nav.prayerTimes', path: '/prayer-times', icon: navIcons.prayerTimes },
    { labelKey: 'nav.whatsapp', path: '/whatsapp', icon: navIcons.whatsapp },
    { labelKey: 'nav.childResults', path: '/child-results', icon: navIcons.reports },
  ],
  mudeer: [
    { labelKey: 'nav.dashboard', path: '/dashboard', icon: navIcons.dashboard },
    { labelKey: 'nav.users', path: '/users', icon: navIcons.users },
    { labelKey: 'nav.subjects', path: '/subjects', icon: navIcons.subjects },
    { labelKey: 'nav.exams', path: '/exams', icon: navIcons.exams },
    { labelKey: 'nav.enrollments', path: '/enrollments', icon: navIcons.enrollments },
    { labelKey: 'nav.finance', path: '/finance', icon: navIcons.finance },
    { labelKey: 'nav.attendance', path: '/attendance', icon: navIcons.attendance },
    { labelKey: 'nav.announcements', path: '/announcements', icon: navIcons.announcements },
    { labelKey: 'nav.reports', path: '/reports', icon: navIcons.reports },
    { labelKey: 'nav.interventions', path: '/interventions', icon: navIcons.interventions },
    { labelKey: 'nav.engagement', path: '/engagement', icon: navIcons.engagement },
    { labelKey: 'nav.messages', path: '/messages', icon: navIcons.messages },
    { labelKey: 'nav.academic', path: '/academic', icon: navIcons.academic },
    { labelKey: 'nav.admissions', path: '/admissions', icon: navIcons.admissions },
    { labelKey: 'nav.atRisk', path: '/at-risk', icon: navIcons.atRisk },
    { labelKey: 'nav.teacherWorkload', path: '/teacher-workload', icon: navIcons.teacherWorkload },
    { labelKey: 'nav.character', path: '/character', icon: navIcons.character },
    { labelKey: 'nav.whatsapp', path: '/whatsapp', icon: navIcons.whatsapp },
    { labelKey: 'nav.prayerTimes', path: '/prayer-times', icon: navIcons.prayerTimes },
    { labelKey: 'nav.publishResults', path: '/results', icon: navIcons.reports },
    { labelKey: 'nav.parentLinks', path: '/parent-students', icon: navIcons.parentLinks },
  ],
  idaarah: [
    { labelKey: 'nav.dashboard', path: '/dashboard', icon: navIcons.dashboard },
    { labelKey: 'nav.finance', path: '/finance', icon: navIcons.finance },
    { labelKey: 'nav.attendance', path: '/attendance', icon: navIcons.attendance },
    { labelKey: 'nav.announcements', path: '/announcements', icon: navIcons.announcements },
    { labelKey: 'nav.reports', path: '/reports', icon: navIcons.reports },
    { labelKey: 'nav.engagement', path: '/engagement', icon: navIcons.engagement },
    { labelKey: 'nav.messages', path: '/messages', icon: navIcons.messages },
    { labelKey: 'nav.lessonPlanner', path: '/lesson-planner', icon: navIcons.lessonPlanner },
    { labelKey: 'nav.homework', path: '/homework', icon: navIcons.homework },
    { labelKey: 'nav.prayerTimes', path: '/prayer-times', icon: navIcons.prayerTimes },
  ],
};

const rolePrefixMap: Record<User['role'], string> = {
  student: '/student',
  ustaadh: '/teacher',
  parent: '/parent',
  mudeer: '/admin',
  idaarah: '/board',
};

const roleLabelKeys: Record<User['role'], string> = {
  student: 'roles.student',
  ustaadh: 'roles.ustaadh',
  parent: 'roles.parent',
  mudeer: 'roles.mudeer',
  idaarah: 'roles.idaarah',
};

const roleColors: Record<User['role'], string> = {
  student: 'bg-emerald-500',
  ustaadh: 'bg-blue-500',
  parent: 'bg-purple-500',
  mudeer: 'bg-amber-500',
  idaarah: 'bg-rose-500',
};

export default function Layout() {
  const { user, logout, switchAccount, getStoredSessions, removeStoredSession } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    notificationAPI.unreadCount()
      .then(res => setUnreadCount(res.data.count))
      .catch(() => {});
  }, []);

  const loadNotifications = () => {
    notificationAPI.list()
      .then(res => setNotifications(res.data.results ?? res.data))
      .catch(() => {});
  };

  const handleMarkAllRead = () => {
    notificationAPI.markAllRead().then(() => {
      setUnreadCount(0);
      setNotifications([]);
    }).catch(() => {});
  };

  const handleMarkRead = (id: number) => {
    notificationAPI.markRead(id).then(() => {
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => prev.filter(n => n.id !== id));
    }).catch(() => {});
  };

  const toggleNotifMenu = () => {
    if (!notifMenuOpen) {
      loadNotifications();
    }
    setNotifMenuOpen(!notifMenuOpen);
  };

  const links = user ? roleNavLinks[user.role].map(l => ({
    ...l,
    label: t(l.labelKey),
    path: `${rolePrefixMap[user.role]}${l.path}`,
  })) : [];

  const visibleLinks = links.filter(l => l.label !== l.labelKey);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSwitchAccount = (email: string) => {
    const success = switchAccount(email);
    if (success) {
      setAccountMenuOpen(false);
      const sessions = getStoredSessions();
      const session = sessions.find(s => s.user.email === email);
      if (session) {
        const prefix = rolePrefixMap[session.user.role];
        navigate(`${prefix}/dashboard`);
      }
    }
  };

  const handleRemoveAccount = (email: string) => {
    removeStoredSession(email);
    setAccountMenuOpen(false);
  };

  const storedSessions = getStoredSessions();
  const otherAccounts = storedSessions.filter(s => s.user.email !== user?.email);

  const sidebarContent = (
    <div className="flex h-full flex-col bg-islamic-dark text-white">
      <div className="flex h-16 items-center gap-2 border-b border-white/10 px-6">
        <span className="text-lg font-semibold">{t('nav.schoolLms')}</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        {visibleLinks.map((link, i) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setSidebarOpen(false)}
              className={`nav-link flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium opacity-0 animate-slide-up ${
                isActive
                  ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/30'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {link.icon}
              <span className="truncate">{link.label}</span>
              {isActive && <span className="ms-auto h-1.5 w-1.5 rounded-full bg-white" />}
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="border-t border-white/10 p-4">
          <p className="text-xs text-gray-400">{t(roleLabelKeys[user.role])}</p>
          <p className="truncate text-sm font-medium">{user.full_name}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">{sidebarContent}</aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden animate-fade-in">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 end-0 z-50 w-64 sidebar-slide-enter">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 shadow-sm sm:px-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="btn-press rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden" style={{ color: 'var(--color-text-muted)' }}
              aria-label={t('common.openMenu')}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {user?.madrasah_name || t('nav.schoolLms')}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="btn-press rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Language toggle */}
            <button
              onClick={toggleLanguage}
              className="btn-press flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              title={t('common.toggleLanguage')}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              <span className="hidden sm:inline">{language === 'ar' ? 'EN' : 'عربي'}</span>
            </button>

            {/* Notification bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={toggleNotifMenu}
                className="btn-press relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
                title={t('common.notifications')}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -end-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {notifMenuOpen && (
                <div className="absolute end-0 top-full z-50 mt-2 w-80 rounded-xl border shadow-lg animate-scale-in dark:border-gray-700 dark:bg-gray-800" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
                  <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: 'var(--color-border-light)' }}>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{t('common.notifications')}</p>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
                      >
                        {t('common.markAllRead')}
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 && (
                      <div className="px-4 py-8 text-center">
                        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('common.noNotifications')}</p>
                      </div>
                    )}
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="flex items-start gap-3 border-b px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50" style={{ borderColor: 'var(--color-border-light)' }}
                      >
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-900/30">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{notif.title}</p>
                          {notif.message && (
                            <p className="mt-0.5 text-xs line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>{notif.message}</p>
                          )}
                          <p className="mt-1 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{notif.created_at ? new Date(notif.created_at).toLocaleString() : ''}</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMarkRead(notif.id); }}
                          className="shrink-0 rounded p-1 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700" style={{ color: 'var(--color-text-muted)' }}
                          title={t('common.markRead')}
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Account switcher */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                className="btn-press flex items-center gap-2 rounded-lg border py-1.5 ps-1.5 pe-2.5 text-sm font-medium transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                {user && (
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white ${roleColors[user.role]}`}>
                    {user.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                )}
                <svg className={`h-3.5 w-3.5 transition-transform ${accountMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {accountMenuOpen && (
                <div className="absolute end-0 top-full z-50 mt-2 w-72 rounded-xl border py-2 shadow-lg animate-scale-in dark:border-gray-700 dark:bg-gray-800" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
                  {/* Current account */}
                  {user && (
                    <div className="border-b px-4 py-3" style={{ borderColor: 'var(--color-border-light)' }}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[11px] font-medium uppercase" style={{ color: 'var(--color-text-muted)' }}>{t('common.currentAccount')}</p>
                        <div className="flex gap-2">
                          <Link
                            to={`${rolePrefixMap[user.role]}/change-password`}
                            className="text-[11px] font-medium transition-colors hover:text-gray-700 dark:hover:text-gray-300" style={{ color: 'var(--color-text-muted)' }}
                          >
                            Password
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="text-[11px] font-medium text-red-500 hover:text-red-600 transition-colors"
                          >
                            {t('nav.logout')}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${roleColors[user.role]}`}>
                          {user.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{user.full_name}</p>
                          <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{user.email}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Other accounts */}
                  {otherAccounts.length > 0 && (
                    <div className="px-2 py-1">
                      <p className="px-2 py-1 text-[11px] font-medium uppercase" style={{ color: 'var(--color-text-muted)' }}>{t('common.savedAccounts')}</p>
                      {otherAccounts.map((session) => (
                        <div key={session.user.email} className="flex items-center gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 group">
                          <button
                            onClick={() => handleSwitchAccount(session.user.email)}
                            className="flex flex-1 items-center gap-2.5 text-start"
                          >
                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${roleColors[session.user.role]}`}>
                              {session.user.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{session.user.full_name}</p>
                              <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{t('roles.' + session.user.role)} — {session.user.email}</p>
                            </div>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemoveAccount(session.user.email); }}
                            className="shrink-0 rounded p-1 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20" style={{ color: 'var(--color-text-muted)' }}
                            title={t('common.removeAccount')}
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {otherAccounts.length === 0 && (
                    <div className="px-4 py-3 text-center">
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('common.noOtherAccounts')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6" style={{ backgroundColor: 'var(--color-bg-secondary)' }}><div className="page-enter"><Outlet /><PageNavigation links={links} /></div></main>
      </div>
    </div>
  );
}
