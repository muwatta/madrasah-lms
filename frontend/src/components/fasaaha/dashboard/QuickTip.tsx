import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

const TIPS = ['fasaaha.tipPronunciation', 'fasaaha.tipDaily', 'fasaaha.tipHints', 'fasaaha.tipAiTutor', 'fasaaha.tipReview'];

export default function QuickTip() {
  const { t } = useLanguage();
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (reducedMotion || paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % TIPS.length), 12000);
    return () => clearInterval(id);
  }, [paused, reducedMotion]);

  return (
    <div
      className="flex h-full flex-col rounded-2xl border p-5 card-hover"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
          <Lightbulb className="h-[18px] w-[18px]" aria-hidden />
        </span>
        <h3 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {t('fasaaha.quickTip')}
        </h3>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          className="flex-1 text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
          transition={{ duration: 0.35 }}
        >
          {t(TIPS[index])}
        </motion.p>
      </AnimatePresence>

      <div className="mt-4 flex gap-1.5" aria-hidden>
        {TIPS.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${i === index ? 'w-5 bg-primary-500' : 'w-1.5'}`}
            style={{ background: i === index ? undefined : 'var(--color-border)' }}
          />
        ))}
      </div>
    </div>
  );
}
