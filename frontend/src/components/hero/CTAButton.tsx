import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';

interface Props {
  to?: string;
  icon?: ReactNode;
  delay: number;
  children: React.ReactNode;
}

export default function CTAButton({ to, icon, delay, children }: Props) {
  const navigate = useNavigate();

  return (
    <motion.button
      onClick={() => to && navigate(to)}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay, type: 'spring', stiffness: 100, damping: 15 }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className="group relative inline-flex items-center gap-2 sm:gap-3 px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-3.5 rounded-xl font-semibold text-sm sm:text-base text-white overflow-hidden shadow-2xl w-full sm:w-auto justify-center"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <span className="relative z-10">{children}</span>
      {icon ? (
        <span className="relative z-10 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-300">
          {icon}
        </span>
      ) : (
        <ArrowRight className="relative z-10 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-300" />
      )}
    </motion.button>
  );
}
