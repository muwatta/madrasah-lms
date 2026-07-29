import { BookOpen, Users, GraduationCap, ClipboardCheck, MessageSquare, Target, Sparkles, Award, Building2, School } from 'lucide-react';
import type { ReactNode } from 'react';

export interface FloatingCardData {
  title: string;
  value?: string;
  color: string;
  icon: ReactNode;
  position: { x: number; y: number };
  delay: number;
}

export interface SlideData {
  id: number;
  title: string;
  subtitle: string;
  cta: string;
  ctaIcon: ReactNode;
  floatingIcons: string[];
  cards?: FloatingCardData[];
}

export const slides: SlideData[] = [
  {
    id: 1,
    title: 'Stop Juggling Paper.\nStart Inspiring.',
    subtitle: 'Replace spreadsheets, attendance registers, and WhatsApp groups with one joyful platform. Teachers teach, parents engage, students excel - all in one place.',
    cta: 'Start Free Trial',
    ctaIcon: <Sparkles className="w-4 h-4" />,
    floatingIcons: ['📊', '📋', '✅', '📱'],
    cards: [
      { title: 'Attendance', color: 'from-emerald-500/20 to-emerald-600/10', icon: <ClipboardCheck className="w-4 h-4" />, position: { x: 70, y: 15 }, delay: 0.3 },
      { title: 'Assessments', color: 'from-blue-500/20 to-blue-600/10', icon: <BookOpen className="w-4 h-4" />, position: { x: 15, y: 60 }, delay: 0.5 },
      { title: 'Communication', color: 'from-amber-500/20 to-amber-600/10', icon: <MessageSquare className="w-4 h-4" />, position: { x: 80, y: 70 }, delay: 0.7 },
    ],
  },
  {
    id: 2,
    title: 'AI-Powered Tools\nfor Every Role',
    subtitle: 'Teachers assign work, track Quran progress, and give feedback. Students learn with AI-powered tools. Parents stay informed. Admins get full oversight.',
    cta: 'Explore Features',
    ctaIcon: <Target className="w-4 h-4" />,
    floatingIcons: ['🤖', '📈', '🎯', '📚'],
    cards: [
      { title: 'For Teachers', value: 'Assign & Assess', color: 'from-violet-500/20 to-violet-600/10', icon: <GraduationCap className="w-4 h-4" />, position: { x: 10, y: 10 }, delay: 0.2 },
      { title: 'For Students', value: 'Practice & Grow', color: 'from-emerald-500/20 to-emerald-600/10', icon: <BookOpen className="w-4 h-4" />, position: { x: 75, y: 20 }, delay: 0.4 },
      { title: 'For Parents', value: 'Track & Engage', color: 'from-blue-500/20 to-blue-600/10', icon: <Users className="w-4 h-4" />, position: { x: 5, y: 55 }, delay: 0.6 },
      { title: 'For Admin', value: 'Manage & Report', color: 'from-amber-500/20 to-amber-600/10', icon: <Building2 className="w-4 h-4" />, position: { x: 80, y: 65 }, delay: 0.8 },
    ],
  },
  {
    id: 3,
    title: 'Join Thousands of\nMadrasahs Worldwide',
    subtitle: 'Complete school management made simple. Track attendance, manage finances, issue certificates, and monitor student progress — all from one dashboard.',
    cta: 'Begin Your Journey',
    ctaIcon: <GraduationCap className="w-4 h-4" />,
    floatingIcons: ['🌍', '🏆', '🎓', '⭐'],
    cards: [
      { title: 'Schools', value: '500+', color: 'from-emerald-500/20 to-emerald-600/10', icon: <School className="w-4 h-4" />, position: { x: 10, y: 15 }, delay: 0.2 },
      { title: 'Students', value: '50,000+', color: 'from-blue-500/20 to-blue-600/10', icon: <Users className="w-4 h-4" />, position: { x: 70, y: 10 }, delay: 0.4 },
      { title: 'Teachers', value: '5,000+', color: 'from-amber-500/20 to-amber-600/10', icon: <GraduationCap className="w-4 h-4" />, position: { x: 85, y: 60 }, delay: 0.6 },
      { title: 'Countries', value: '25+', color: 'from-violet-500/20 to-violet-600/10', icon: <Award className="w-4 h-4" />, position: { x: 5, y: 70 }, delay: 0.8 },
    ],
  },
];
