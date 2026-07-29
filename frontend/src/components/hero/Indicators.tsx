import { motion } from 'framer-motion';

interface Props {
  total: number;
  current: number;
  progress: number;
  onChange: (index: number) => void;
}

export default function Indicators({ total, current, progress, onChange }: Props) {
  return (
    <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 md:gap-4 z-20">
      <div className="flex gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            onClick={() => onChange(i)}
            className="relative h-1.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
            style={{ width: i === current ? 32 : 8 }}
            aria-label={`Go to slide ${i + 1}`}
          >
            <motion.div
              className="absolute inset-0 rounded-full bg-white/20"
              animate={{ opacity: i === current ? 1 : 0.5 }}
            />
            {i === current && (
              <motion.div
                className="absolute inset-0 rounded-full bg-white"
                style={{ width: `${progress}%` }}
              />
            )}
            {i === current && (
              <motion.div
                className="absolute inset-0 rounded-full bg-white/40"
                initial={{ width: '0%' }}
                animate={{ width: `${100 - progress}%` }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
