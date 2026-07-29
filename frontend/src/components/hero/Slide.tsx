import { motion } from 'framer-motion';
import { BookOpen, Mic, GraduationCap, Trophy, Award, MessageSquare, ClipboardCheck, Users, Building2, School } from 'lucide-react';
import type { SlideData } from './data';
import Background from './Background';
import FloatingIcons from './FloatingIcons';
import FloatingCard from './FloatingCard';
import CTAButton from './CTAButton';
import Waveform from './Waveform';

interface Props {
  slide: SlideData;
  isActive: boolean;
  slideIndex: number;
}

const cardIcons: Record<string, React.ReactNode> = {
  Attendance: <ClipboardCheck className="w-4 h-4" />,
  Assessments: <BookOpen className="w-4 h-4" />,
  Communication: <MessageSquare className="w-4 h-4" />,
  'For Teachers': <GraduationCap className="w-4 h-4" />,
  'For Students': <BookOpen className="w-4 h-4" />,
  'For Parents': <Users className="w-4 h-4" />,
  'For Admin': <Building2 className="w-4 h-4" />,
  Schools: <School className="w-4 h-4" />,
  Students: <Users className="w-4 h-4" />,
  Teachers: <GraduationCap className="w-4 h-4" />,
  Countries: <Award className="w-4 h-4" />,
};

function ClassroomVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <motion.div
        className="relative w-56 h-56 md:w-72 md:h-72"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, type: 'spring', stiffness: 80, damping: 12 }}
      >
        <svg viewBox="0 0 280 280" className="w-full h-full">
          <defs>
            <linearGradient id="glow1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(20,184,166,0.3)" />
              <stop offset="100%" stopColor="rgba(15,118,110,0.1)" />
            </linearGradient>
          </defs>

          <motion.circle
            cx="140" cy="140" r="120"
            fill="url(#glow1)"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />

          <motion.rect x="80" y="190" width="120" height="10" rx="3" className="fill-amber-700/60"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          />
          <motion.rect x="90" y="200" width="8" height="30" rx="2" className="fill-amber-800/50"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} />
          <motion.rect x="182" y="200" width="8" height="30" rx="2" className="fill-amber-800/50"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} />

          <motion.ellipse cx="140" cy="155" rx="28" ry="35" className="fill-emerald-600/70"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} />
          <motion.circle cx="140" cy="115" r="22" className="fill-amber-200/80"
            initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }} />
          <motion.circle cx="131" cy="112" r="3" className="fill-gray-800/70" />
          <motion.circle cx="149" cy="112" r="3" className="fill-gray-800/70" />
          <motion.path d="M133 122 q7 7 14 0" className="stroke-gray-800/70" strokeWidth="1.5" fill="none" strokeLinecap="round" />

          <motion.path d="M165 145 q20 -15 15 -40" className="stroke-emerald-600/70" strokeWidth="10" strokeLinecap="round" fill="none"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, delay: 0.8 }} />
          <motion.circle cx="180" cy="103" r="7" className="fill-amber-200/80"
            initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 1.2, type: 'spring' }} />

          <motion.rect x="120" y="180" width="30" height="22" rx="2" className="fill-emerald-800/60 stroke-emerald-600/40" strokeWidth="1"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.9 }} />

          <motion.circle cx="50" cy="80" r="3" className="fill-emerald-400/60"
            animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], y: [0, -20] }}
            transition={{ duration: 2, delay: 1.5, repeat: Infinity, repeatDelay: 3 }} />
          <motion.circle cx="220" cy="90" r="2" className="fill-emerald-400/60"
            animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], y: [0, -15] }}
            transition={{ duration: 2, delay: 2.5, repeat: Infinity, repeatDelay: 3 }} />
          <motion.circle cx="60" cy="140" r="2" className="fill-blue-400/60"
            animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], y: [0, -18] }}
            transition={{ duration: 2, delay: 3.5, repeat: Infinity, repeatDelay: 3 }} />
          <motion.circle cx="230" cy="150" r="3" className="fill-amber-400/60"
            animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], y: [0, -22] }}
            transition={{ duration: 2, delay: 1.0, repeat: Infinity, repeatDelay: 3 }} />
        </svg>
      </motion.div>
    </div>
  );
}

function MicrophoneVisual() {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center gap-4">
      <motion.div
        className="relative"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.8, type: 'spring', stiffness: 100, damping: 12 }}
      >
        <motion.div
          className="absolute inset-0 bg-emerald-400/20 rounded-full blur-2xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-emerald-400/20 to-emerald-600/10 backdrop-blur-sm border border-emerald-400/30 flex items-center justify-center">
          <Mic className="w-8 h-8 md:w-10 md:h-10 text-emerald-300" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <Waveform />
      </motion.div>
    </div>
  );
}

function DashboardVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <motion.div
        className="relative w-64 h-48 md:w-80 md:h-56 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-2xl"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))' }}
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, type: 'spring', stiffness: 80, damping: 14 }}
      >
        <div className="flex items-end gap-1.5 h-16 mb-3">
          {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
            <motion.div
              key={i}
              className="flex-1 rounded-t-sm"
              style={{
                background: `linear-gradient(to top, rgba(20,184,166,${0.3 + h / 200}), rgba(20,184,166,${0.1 + h / 300}))`,
              }}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ duration: 0.8, delay: 0.8 + i * 0.05 }}
            />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Attendance', value: '96%', color: 'from-emerald-400/20' },
            { label: 'Engagement', value: '88%', color: 'from-blue-400/20' },
            { label: 'Completion', value: '92%', color: 'from-amber-400/20' },
            { label: 'Satisfaction', value: '94%', color: 'from-violet-400/20' },
          ].map((metric, i) => (
            <motion.div
              key={metric.label}
              className={`rounded-lg bg-gradient-to-br ${metric.color} to-transparent p-2 border border-white/5`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.2 + i * 0.1 }}
            >
              <p className="text-[9px] md:text-[10px] text-white/50">{metric.label}</p>
              <p className="text-xs md:text-sm font-bold text-white">{metric.value}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center shadow-lg"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ duration: 0.5, delay: 2.0, type: 'spring' }}
        >
          <Trophy className="w-3 h-3 text-amber-900" />
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function Slide({ slide, isActive, slideIndex }: Props) {
  const lines = slide.title.split('\n');

  return (
    <div className="absolute inset-0">
      <Background slideIndex={slideIndex} />
      <FloatingIcons icons={slide.floatingIcons} />

      <div className="absolute inset-0 flex flex-col lg:flex-row items-center justify-center px-6 md:px-12 lg:px-20">
        <div className="flex-1 max-w-xl z-10 text-center lg:text-left">
          <motion.h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-white mb-4 md:mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {lines.map((line, i) => (
              <motion.span key={i} className="block">
                {i === 1 ? (
                  <span className="text-emerald-300">{line}</span>
                ) : (
                  line
                )}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p
            className="text-sm md:text-base lg:text-lg text-emerald-100/80 max-w-lg mx-auto lg:mx-0 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {slide.subtitle}
          </motion.p>

          <div className="mt-6 md:mt-8 flex justify-center lg:justify-start">
            <CTAButton icon={slide.ctaIcon} delay={0.5}>
              {slide.cta}
            </CTAButton>
          </div>
        </div>

        <div className="flex-1 w-full max-w-md lg:max-w-lg mt-8 lg:mt-0 z-10">
          {slide.id === 1 && <ClassroomVisual />}
          {slide.id === 2 && <MicrophoneVisual />}
          {slide.id === 3 && <DashboardVisual />}
        </div>
      </div>

      {slide.cards?.map((card, i) => (
        <FloatingCard
          key={`${slide.id}-${i}`}
          title={card.title}
          value={card.value}
          color={card.color}
          icon={cardIcons[card.title] ?? card.icon}
          position={card.position}
          delay={card.delay}
          slideIndex={slideIndex}
        />
      ))}
    </div>
  );
}
