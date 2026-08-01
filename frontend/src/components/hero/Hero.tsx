import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Check, ChevronDown } from 'lucide-react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import Background from './Background';

const MotionLink = motion.create(Link);

const EASE = [0.22, 1, 0.36, 1] as const;

const container: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: EASE },
  },
};

interface FloatingCardProps {
  className: string;
  delay: number;
  reducedMotion: boolean | null;
  children: React.ReactNode;
}

function FloatingCard({ className, delay, reducedMotion, children }: FloatingCardProps) {
  return (
    <motion.div
      className={`pointer-events-none absolute z-[1] hidden select-none xl:block ${className}`}
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 28, scale: 0.92 }}
      animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: EASE, delay }}
    >
      <motion.div
        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-2xl shadow-emerald-900/20 backdrop-blur-md"
        animate={reducedMotion ? undefined : { y: [0, -9, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: delay + 0.8 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export default function Hero() {
  const { t, language } = useLanguage();
  const reducedMotion = useReducedMotion();

  const iconWrap = 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300';
  const sub = 'text-[11px] font-medium text-emerald-100/50';
  const value = 'text-sm font-bold text-white';

  return (
    <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden bg-gray-950 px-6 py-20 select-none">
      <Background />

      <FloatingCard className="left-[5%] top-[26%]" delay={0.3} reducedMotion={reducedMotion}>
        <span className={iconWrap}><Check className="h-5 w-5" /></span>
        <div>
          <div className={sub}>{language === 'ar' ? 'نجحت في الاختبار' : 'Quiz passed'}</div>
          <div className={value}>A+ · 96%</div>
        </div>
      </FloatingCard>

      <FloatingCard className="right-[5%] top-[32%]" delay={1.2} reducedMotion={reducedMotion}>
        <span className={iconWrap}><BookOpen className="h-5 w-5" /></span>
        <div>
          <div className={sub}>{language === 'ar' ? 'حفظ القرآن' : 'Qur\'an memorisation'}</div>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[65%] rounded-full bg-gradient-to-r from-emerald-400 to-teal-300" />
            </div>
            <span className={value}>24/37</span>
          </div>
        </div>
      </FloatingCard>

      <FloatingCard className="left-[8%] bottom-[18%]" delay={2.1} reducedMotion={reducedMotion}>
        <span className={iconWrap}><Check className="h-5 w-5" /></span>
        <div>
          <div className={sub}>{language === 'ar' ? 'حضور الطلاب' : 'Attendance'}</div>
          <div className={value}>98%</div>
        </div>
      </FloatingCard>

      <motion.div
        className="relative z-10 mx-auto max-w-3xl text-center"
        variants={container}
        initial={reducedMotion ? undefined : 'hidden'}
        animate="visible"
      >
        <motion.span
          variants={item}
          className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-emerald-300"
        >
          {t('landing.platformTag')}
        </motion.span>

        <motion.h1
          variants={item}
          className="mt-6 text-4xl font-bold leading-[1.15] tracking-tight text-white sm:text-5xl md:text-6xl"
        >
          {t('landing.heroTitle1')}{' '}
          <span className="animate-gradient-x bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent">
            {t('landing.heroTitle2')}
          </span>
        </motion.h1>

        <motion.p
          variants={item}
          className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-emerald-100/75 sm:text-lg"
        >
          {t('landing.heroDesc')}
        </motion.p>

        <motion.div
          variants={item}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <MotionLink
            to="/register"
            whileHover={reducedMotion ? undefined : { y: -2, scale: 1.02 }}
            whileTap={reducedMotion ? undefined : { scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-600/30 transition-colors hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 sm:w-auto"
          >
            {t('landing.startFreeTrial')}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </MotionLink>
          <MotionLink
            to="/pricing"
            whileHover={reducedMotion ? undefined : { y: -2, scale: 1.02 }}
            whileTap={reducedMotion ? undefined : { scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className="inline-flex w-full items-center justify-center rounded-xl border border-white/15 bg-white/5 px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 sm:w-auto"
          >
            {t('landing.exploreFeatures')}
          </MotionLink>
        </motion.div>

        <motion.p variants={item} className="mt-6 text-sm text-emerald-100/50">
          {t('landing.noCard')}
        </motion.p>
      </motion.div>

      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-6 z-[1] flex justify-center">
        <motion.div
          className="text-emerald-300/70"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={reducedMotion ? undefined : { opacity: [0, 1, 0.6, 1, 0] }}
          transition={{ duration: 4, times: [0, 0.2, 0.5, 0.8, 1], repeat: Infinity, repeatDelay: 1, delay: 1.4 }}
        >
          <ChevronDown className="h-6 w-6" />
        </motion.div>
      </div>
    </section>
  );
}
