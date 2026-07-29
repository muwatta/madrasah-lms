import { motion } from 'framer-motion';

interface Props {
  title: string;
  value?: string;
  color: string;
  icon: React.ReactNode;
  position: { x: number; y: number };
  delay: number;
  slideIndex: number;
}

export default function FloatingCard({ title, value, color, icon, position, delay, slideIndex }: Props) {
  return (
    <motion.div
      className="absolute"
      style={{ left: `${position.x}%`, top: `${position.y}%` }}
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.8 }}
      transition={{
        duration: 0.6,
        delay,
        type: 'spring',
        stiffness: 100,
        damping: 15,
      }}
      whileHover={{ scale: 1.05, y: -2 }}
    >
      <motion.div
        className="relative backdrop-blur-xl rounded-xl px-3 py-2 md:px-4 md:py-2.5 border border-white/10 shadow-xl"
        style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))` }}
        animate={{
          y: [0, -4, 0, 2, 0],
        }}
        transition={{
          duration: 4 + delay,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: delay * 0.5,
        }}
      >
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center backdrop-blur-sm`}>
            {icon}
          </div>
          <div>
            <p className="text-[10px] md:text-xs font-medium text-white/70">{title}</p>
            {value && (
              <motion.p
                className="text-xs md:text-sm font-bold text-white"
                key={`${slideIndex}-${title}`}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: delay + 0.3 }}
              >
                {value}
              </motion.p>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
