import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface Props {
  color?: string;
}

export default function Waveform({ color = 'rgba(20, 184, 166, 0.6)' }: Props) {
  const bars = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      height: 15 + Math.sin(i * 0.5) * 20 + Math.random() * 15,
      delay: i * 0.05,
    })),
  []);

  return (
    <div className="flex items-end gap-[2px] h-16 md:h-20">
      {bars.map((bar, i) => (
        <motion.div
          key={i}
          className="w-[3px] md:w-[4px] rounded-full"
          style={{ backgroundColor: color }}
          animate={{
            height: [
              bar.height * 0.3,
              bar.height,
              bar.height * 0.5,
              bar.height * 0.8,
              bar.height * 0.3,
            ],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: bar.delay,
          }}
        />
      ))}
    </div>
  );
}
