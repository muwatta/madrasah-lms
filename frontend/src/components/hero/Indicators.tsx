import { memo } from 'react';
import { motion } from 'framer-motion';

interface Props {
  total: number;
  current: number;
  progress: number;
  onChange: (index: number) => void;
}

function Indicators({ total, current, progress, onChange }: Props) {
  return (
    <div className="absolute bottom-3 sm:bottom-4 md:bottom-6 lg:bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2 md:gap-3">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          className="group relative"
          aria-label={`Go to slide ${i + 1}`}
        >
          <div
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? 'bg-white w-6 sm:w-8 md:w-10 lg:w-12 h-1.5 sm:h-2'
                : 'bg-white/30 hover:bg-white/50 w-1.5 sm:w-2 h-1.5 sm:h-2'
            }`}
          >
            {i === current && (
              <motion.div
                className="absolute left-0 top-0 h-full rounded-full bg-emerald-400"
                initial={{ width: '0%' }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.1, ease: 'linear' }}
              />
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

export default memo(Indicators);
