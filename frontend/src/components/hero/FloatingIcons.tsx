import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface Props {
  icons: string[];
}

export default function FloatingIcons({ icons }: Props) {
  const positions = useMemo(() => [
    { x: 'clamp(5%, 10%, 15%)', y: 'clamp(10%, 15%, 20%)', delay: 0 },
    { x: 'clamp(75%, 85%, 90%)', y: 'clamp(15%, 20%, 25%)', delay: 0.5 },
    { x: 'clamp(2%, 5%, 8%)', y: 'clamp(65%, 70%, 75%)', delay: 1 },
    { x: 'clamp(80%, 88%, 92%)', y: 'clamp(70%, 75%, 80%)', delay: 1.5 },
  ], []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {icons.map((icon, i) => (
        <motion.div
          key={i}
          className="absolute text-xl sm:text-2xl md:text-3xl"
          style={{ left: positions[i].x, top: positions[i].y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0.8, 1],
            scale: [0, 1, 0.9, 1],
            y: [0, -10, 5, -5, 0],
            x: [0, 5, -5, 3, 0],
          }}
          transition={{
            duration: 6,
            delay: positions[i].delay + 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {icon}
        </motion.div>
      ))}
    </div>
  );
}
