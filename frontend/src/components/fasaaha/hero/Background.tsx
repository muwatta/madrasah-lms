import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface Props {
  slideIndex: number;
}

function FloatingOrbs() {
  const orbs = useMemo(() => [
    { size: 300, x: '10%', y: '20%', color: 'from-emerald-400/15 to-teal-400/5', duration: 20, delay: 0 },
    { size: 250, x: '70%', y: '10%', color: 'from-blue-400/10 to-cyan-400/5', duration: 25, delay: 2 },
    { size: 200, x: '80%', y: '60%', color: 'from-amber-400/10 to-orange-400/5', duration: 18, delay: 1 },
    { size: 180, x: '15%', y: '70%', color: 'from-violet-400/10 to-purple-400/5', duration: 22, delay: 3 },
    { size: 350, x: '50%', y: '50%', color: 'from-emerald-500/5 to-teal-500/3', duration: 30, delay: 0.5 },
  ], []);

  return (
    <>
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full bg-gradient-to-br ${orb.color} blur-3xl`}
          style={{ width: orb.size, height: orb.size, left: orb.x, top: orb.y }}
          animate={{
            x: [0, 30, -20, 10, 0],
            y: [0, -20, 10, -10, 0],
            scale: [1, 1.05, 0.95, 1.02, 1],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: orb.delay,
          }}
        />
      ))}
    </>
  );
}

function GridPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-[0.03] dark:opacity-[0.05]">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}

export default function Background({ slideIndex }: Props) {
  const gradients = [
    'from-emerald-950 via-emerald-900 to-teal-900',
    'from-slate-950 via-blue-950 to-indigo-950',
    'from-gray-950 via-emerald-950 to-teal-950',
  ];

  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${gradients[slideIndex % gradients.length]} transition-colors duration-1000`}
        animate={{ opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <FloatingOrbs />
      <GridPattern />

      <motion.div
        className="absolute inset-0"
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(20, 184, 166, 0.3) 0%, transparent 60%)',
            backgroundSize: '100% 100%',
          }}
        />
      </motion.div>
    </div>
  );
}
