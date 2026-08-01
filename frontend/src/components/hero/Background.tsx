import { motion, useReducedMotion, type Transition, type TargetAndTransition } from 'framer-motion';

export default function Background() {
  const reducedMotion = useReducedMotion();

  const orb = (className: string, animate: TargetAndTransition, transition: Transition) => (
    <motion.div
      className={`absolute rounded-full blur-3xl ${className}`}
      animate={reducedMotion ? undefined : animate}
      transition={transition}
    />
  );

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-slate-950 to-teal-950" />
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: 'clamp(40px, 6vw, 80px) clamp(40px, 6vw, 80px)',
          }}
        />
      </div>

      {orb('left-[-6%] top-[14%] h-72 w-72 bg-emerald-500/20', { y: [0, 34, 0], x: [0, -14, 0] }, { duration: 11, repeat: Infinity, ease: 'easeInOut' })}
      {orb('right-[-5%] top-[22%] h-80 w-80 bg-teal-400/15', { y: [0, -28, 0], x: [0, 18, 0] }, { duration: 13, repeat: Infinity, ease: 'easeInOut' })}
      {orb('bottom-[-10%] left-[28%] h-72 w-72 bg-emerald-600/10', { y: [0, -22, 0] }, { duration: 9, repeat: Infinity, ease: 'easeInOut' })}

      <motion.div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(circle at 50% 35%, rgba(16,185,129,0.18) 0%, transparent 55%)' }}
        animate={reducedMotion ? undefined : { opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
