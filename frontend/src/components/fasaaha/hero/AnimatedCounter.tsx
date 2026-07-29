import { useEffect, useState, useRef } from 'react';

interface Props {
  value: string;
  duration?: number;
}

export default function AnimatedCounter({ value, duration = 2 }: Props) {
  const [display, setDisplay] = useState('0');
  const startRef = useRef<number | null>(null);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const numeric = parseInt(value.replace(/[^0-9]/g, ''));
    if (isNaN(numeric) || !value.includes('%')) {
      setDisplay(value);
      return;
    }

    const animate = (now: number) => {
      if (!startRef.current) startRef.current = now;
      const elapsed = (now - startRef.current) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(`${Math.round(eased * numeric)}%`);
      if (progress < 1) animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [value, duration]);

  return <>{display}</>;
}
