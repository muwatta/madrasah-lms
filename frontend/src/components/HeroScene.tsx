import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const studentSvg = (
  <svg viewBox="0 0 120 160" className="w-full h-full">
    <motion.rect
      x="10" y="120" width="100" height="8" rx="2"
      className="fill-amber-700/80"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6 }}
    />
    <motion.rect
      x="20" y="128" width="8" height="28" rx="1"
      className="fill-amber-800/80"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.7 }}
    />
    <motion.rect
      x="92" y="128" width="8" height="28" rx="1"
      className="fill-amber-800/80"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.7 }}
    />
    <motion.ellipse
      cx="60" cy="88" rx="18" ry="24"
      className="fill-emerald-600/80"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    />
    <motion.circle
      cx="60" cy="56" r="16"
      className="fill-amber-200/90"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    />
    <motion.circle cx="53" cy="54" r="2.5" className="fill-gray-800/80" />
    <motion.circle cx="67" cy="54" r="2.5" className="fill-gray-800/80" />
    <motion.path d="M54 62 Q60 68 66 62" className="stroke-gray-800/80" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <motion.path
      d="M75 82 Q90 65 88 45"
      className="stroke-emerald-600/80" strokeWidth="8" strokeLinecap="round" fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.5, delay: 0.8 }}
    />
    <motion.circle
      cx="88" cy="42" r="6"
      className="fill-amber-200/90"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 1.1, type: "spring" }}
    />
    <motion.path
      d="M45 95 Q30 100 25 115"
      className="stroke-emerald-600/80" strokeWidth="7" strokeLinecap="round" fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.4, delay: 0.7 }}
    />
  </svg>
);

const teacherSvg = (
  <svg viewBox="0 0 130 180" className="w-full h-full">
    <motion.ellipse
      cx="65" cy="108" rx="20" ry="30"
      className="fill-blue-600/80"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
    />
    <motion.circle
      cx="65" cy="68" r="18"
      className="fill-amber-200/90"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.4 }}
    />
    <motion.circle cx="56" cy="66" r="6" className="stroke-gray-700" strokeWidth="1.5" fill="none" />
    <motion.circle cx="74" cy="66" r="6" className="stroke-gray-700" strokeWidth="1.5" fill="none" />
    <motion.path d="M62 66 Q65 64 68 66" className="stroke-gray-700" strokeWidth="1.5" fill="none" />
    <motion.path
      d="M82 100 Q110 85 120 70"
      className="stroke-blue-600/80" strokeWidth="8" strokeLinecap="round" fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.5, delay: 1.0 }}
    />
    <motion.circle
      cx="120" cy="68" r="5"
      className="fill-amber-200/90"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 1.3 }}
    />
    <motion.line
      x1="120" y1="72" x2="130" y2="48"
      className="stroke-amber-700/90" strokeWidth="2.5" strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.3, delay: 1.4 }}
    />
    <motion.path
      d="M48 115 Q30 125 20 140"
      className="stroke-blue-600/80" strokeWidth="7" strokeLinecap="round" fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.4, delay: 0.9 }}
    />
    <motion.rect x="52" y="138" width="8" height="35" rx="2" className="fill-gray-700/70"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} />
    <motion.rect x="72" y="138" width="8" height="35" rx="2" className="fill-gray-700/70"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} />
    <motion.rect
      x="85" y="0" width="45" height="60" rx="3"
      className="fill-emerald-900/60 stroke-emerald-700/50"
      strokeWidth="2"
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      style={{ originX: 1 }}
    />
    <motion.text
      x="100" y="20" className="fill-white/70 text-[6px] font-mono"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 1.0 }}
    >
      2 + 2 = ?
    </motion.text>
    <motion.text
      x="100" y="32" className="fill-white/70 text-[6px] font-mono"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 1.6 }}
    >
      الفعل
    </motion.text>
    <motion.text
      x="100" y="44" className="fill-white/70 text-[6px] font-mono"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 1.8 }}
    >
      مَاضٍ
    </motion.text>
    <motion.line
      x1="88" y1="50" x2="127" y2="50"
      className="stroke-white/40" strokeWidth="0.5"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.3, delay: 1.3 }}
    />
    <motion.circle
      cx="107" cy="55" r="2"
      className="fill-emerald-300/80"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3, delay: 2.0, type: "spring" }}
    />
  </svg>
);

function SceneAnimations() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 300 200">
      <motion.g
        initial={{ opacity: 0, x: -30, y: 30 }}
        animate={{ opacity: [0, 1, 1, 0], x: [-30, 10, 30, 60], y: [30, 0, -20, -40] }}
        transition={{ duration: 3, delay: 1.5, repeat: Infinity, repeatDelay: 2 }}
      >
        <text className="fill-emerald-200/80 text-[14px] font-bold" x="0" y="0">?</text>
      </motion.g>
      <motion.g
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 1, 1, 0], scale: [0, 1.2, 1, 0], y: [0, -10, -20, -40] }}
        transition={{ duration: 2.5, delay: 3, repeat: Infinity, repeatDelay: 2.5 }}
      >
        <text className="fill-emerald-300/80 text-[14px] font-bold" x="0" y="0">✓</text>
      </motion.g>
      <motion.g
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 1, 1, 0], scale: [0, 1.2, 1, 0], y: [0, -10, -20] }}
        transition={{ duration: 2.5, delay: 2, repeat: Infinity, repeatDelay: 3 }}
      >
        <text className="fill-amber-300/70 text-[16px]" x="100" y="60">💡</text>
      </motion.g>
      <motion.g
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: [0, 1, 0.8, 0], y: [20, -5, -20], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 4, delay: 1, repeat: Infinity, repeatDelay: 2 }}
      >
        <text className="fill-emerald-200/50 text-[12px]" x="140" y="140">📚</text>
      </motion.g>
      <motion.g
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 1, 0.5, 0], scale: [0, 1, 0.8, 0], y: [100, 70] }}
        transition={{ duration: 2.5, delay: 2.5, repeat: Infinity, repeatDelay: 2.5 }}
      >
        <text className="fill-yellow-300/60 text-[10px]" x="30" y="100">★</text>
      </motion.g>
      <motion.g
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 1, 0.5, 0], scale: [0, 1, 0.8, 0], y: [50, 20] }}
        transition={{ duration: 2.5, delay: 3.5, repeat: Infinity, repeatDelay: 2.5 }}
      >
        <text className="fill-yellow-300/60 text-[10px]" x="250" y="50">★</text>
      </motion.g>
    </svg>
  );
}

export default function HeroScene() {
  const [key, setKey] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setKey(k => k + 1), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative w-full h-full max-w-[400px] mx-auto" key={key}>
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute right-0 bottom-0 w-[140px] h-[200px]">
          {teacherSvg}
        </div>
        <div className="absolute left-0 bottom-0 w-[130px] h-[180px]">
          {studentSvg}
        </div>
        <SceneAnimations />
      </motion.div>
    </div>
  );
}
