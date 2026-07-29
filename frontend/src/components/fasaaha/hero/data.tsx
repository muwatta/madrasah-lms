import { BookOpen, Mic, GraduationCap, Headphones, PenTool, MessageSquare, BarChart3, Trophy, Target, Sparkles, Award } from 'lucide-react';

export interface FloatingCardData {
  title: string;
  value?: string;
  color: string;
  icon: React.ReactNode;
  position: { x: number; y: number };
  delay: number;
}

export interface SlideData {
  id: number;
  title: string;
  subtitle: string;
  cta: string;
  ctaIcon: React.ReactNode;
  floatingIcons: string[];
  cards?: FloatingCardData[];
}

export const slides: SlideData[] = [
  {
    id: 1,
    title: 'Learn Arabic\nBeyond Memorization',
    subtitle: 'Most students memorize Arabic but struggle to understand native speakers or speak confidently.',
    cta: 'Discover Fasaaha',
    ctaIcon: <Sparkles className="w-4 h-4" />,
    floatingIcons: ['🎧', '🎙️', '📖', '✍️'],
    cards: [
      { title: 'Listening', color: 'from-emerald-500/20 to-emerald-600/10', icon: <Headphones className="w-4 h-4" />, position: { x: 70, y: 15 }, delay: 0.3 },
      { title: 'Speaking', color: 'from-blue-500/20 to-blue-600/10', icon: <Mic className="w-4 h-4" />, position: { x: 15, y: 60 }, delay: 0.5 },
      { title: 'Reading', color: 'from-amber-500/20 to-amber-600/10', icon: <BookOpen className="w-4 h-4" />, position: { x: 80, y: 70 }, delay: 0.7 },
    ],
  },
  {
    id: 2,
    title: 'Your AI Arabic\nLanguage Laboratory',
    subtitle: 'Practice listening, speaking, dictation, reading and conversation with intelligent real-time feedback.',
    cta: 'Start Practicing',
    ctaIcon: <Mic className="w-4 h-4" />,
    floatingIcons: ['🔊', '🎵', '📊', '🎯'],
    cards: [
      { title: 'Pronunciation', value: '92%', color: 'from-violet-500/20 to-violet-600/10', icon: <Target className="w-4 h-4" />, position: { x: 10, y: 10 }, delay: 0.2 },
      { title: 'Grammar', value: '85%', color: 'from-emerald-500/20 to-emerald-600/10', icon: <PenTool className="w-4 h-4" />, position: { x: 75, y: 20 }, delay: 0.4 },
      { title: 'Fluency', value: '78%', color: 'from-blue-500/20 to-blue-600/10', icon: <MessageSquare className="w-4 h-4" />, position: { x: 5, y: 55 }, delay: 0.6 },
      { title: 'Vocabulary', value: '1,240', color: 'from-amber-500/20 to-amber-600/10', icon: <BookOpen className="w-4 h-4" />, position: { x: 80, y: 65 }, delay: 0.8 },
      { title: 'Conversation', value: 'A2', color: 'from-rose-500/20 to-rose-600/10', icon: <MessageSquare className="w-4 h-4" />, position: { x: 40, y: 5 }, delay: 1.0 },
    ],
  },
  {
    id: 3,
    title: 'Helping Students.\nEmpowering Teachers.\nTransforming Schools.',
    subtitle: 'Teachers assign speaking missions. Students practice anywhere. AI evaluates instantly. Schools monitor measurable progress.',
    cta: 'Begin Your Journey',
    ctaIcon: <GraduationCap className="w-4 h-4" />,
    floatingIcons: ['📈', '🏆', '🎖️', '⭐'],
    cards: [
      { title: 'Students Active', value: '2,847', color: 'from-emerald-500/20 to-emerald-600/10', icon: <GraduationCap className="w-4 h-4" />, position: { x: 10, y: 15 }, delay: 0.2 },
      { title: 'Missions Done', value: '14,203', color: 'from-blue-500/20 to-blue-600/10', icon: <Trophy className="w-4 h-4" />, position: { x: 70, y: 10 }, delay: 0.4 },
      { title: 'Avg. Score', value: '87%', color: 'from-amber-500/20 to-amber-600/10', icon: <Award className="w-4 h-4" />, position: { x: 85, y: 60 }, delay: 0.6 },
      { title: 'Progress', value: '+34%', color: 'from-violet-500/20 to-violet-600/10', icon: <BarChart3 className="w-4 h-4" />, position: { x: 5, y: 70 }, delay: 0.8 },
    ],
  },
];
