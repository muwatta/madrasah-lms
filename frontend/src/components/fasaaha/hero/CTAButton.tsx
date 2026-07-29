import { motion } from 'framer-motion';
import { useRef, useState } from 'react';

interface Props {
  children: React.ReactNode;
  icon: React.ReactNode;
  delay: number;
}

export default function CTAButton({ children, icon, delay }: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const handleClick = (e: React.MouseEvent) => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();
      setRipples(prev => [...prev, { x, y, id }]);
      setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 1000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay }}
    >
      <motion.button
        ref={buttonRef}
        onClick={handleClick}
        className="group relative overflow-hidden inline-flex items-center gap-2 px-6 md:px-8 py-3 md:py-3.5 bg-white text-emerald-900 font-semibold rounded-xl shadow-2xl shadow-emerald-500/25 cursor-pointer"
        whileHover={{ scale: 1.03, boxShadow: '0 20px 40px -10px rgba(15, 118, 110, 0.4)' }}
        whileTap={{ scale: 0.97 }}
      >
        <motion.span
          className="absolute inset-0 bg-gradient-to-r from-emerald-100 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        />
        <motion.span
          className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay }}
        />

        {ripples.map(ripple => (
          <span
            key={ripple.id}
            className="absolute pointer-events-none rounded-full bg-emerald-400/30"
            style={{
              left: ripple.x - 10,
              top: ripple.y - 10,
              width: 20,
              height: 20,
              animation: 'ripple 1s ease-out forwards',
            }}
          />
        ))}

        <span className="relative flex items-center gap-2">
          <motion.span
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            {icon}
          </motion.span>
          <span>{children}</span>
        </span>

        <style>{`
          @keyframes ripple {
            0% { transform: scale(0); opacity: 0.5; }
            100% { transform: scale(20); opacity: 0; }
          }
        `}</style>
      </motion.button>
    </motion.div>
  );
}
