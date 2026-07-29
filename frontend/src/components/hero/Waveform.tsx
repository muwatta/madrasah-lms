import { useMemo } from 'react';
import { motion } from 'framer-motion';

export default function Waveform() {
  const barValues = useMemo(() =>
    Array.from({ length: 40 }, () => ({
      height: 10 + Math.random() * 35,
      duration: 0.6 + Math.random() * 0.6,
    })),
  []
  );

  return (
    <div className="flex items-center justify-center gap-[2px] sm:gap-[3px]">
      {barValues.map((bar, i) => (
        <motion.div
          key={i}
          className={`w-[3px] sm:w-[4px] md:w-[5px] bg-gradient-to-t from-emerald-400/60 to-emerald-300/90 rounded-full ${i % 2 !== 0 ? 'hidden sm:block' : ''}`}
          style={{ height: `${bar.height * 0.4}px`, minHeight: '6px' }}
          initial={{ height: 0 }}
          animate={{
            height: [`${bar.height * 0.3}px`, `${bar.height * 0.6}px`, `${bar.height * 0.3}px`],
          }}
          transition={{
            duration: bar.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.04,
          }}
        />
      ))}
    </div>
  );
}
