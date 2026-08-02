import { CheckCircle2, Loader2, RotateCcw, PlayCircle } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import type { MissionStatus } from './missionStatus';

interface MissionStatusBadgeProps {
  status: MissionStatus;
  bestScore?: number | null;
  className?: string;
}

const STYLES: Record<MissionStatus, string> = {
  notStarted: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  inProgress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  needsPractice: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const ICONS = {
  notStarted: PlayCircle,
  inProgress: Loader2,
  needsPractice: RotateCcw,
  completed: CheckCircle2,
};

export default function MissionStatusBadge({ status, bestScore, className = '' }: MissionStatusBadgeProps) {
  const { t } = useLanguage();
  const Icon = ICONS[status];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STYLES[status]} ${className}`}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {t(`fasaaha.${status}`)}
      {status === 'completed' && bestScore !== null && bestScore !== undefined && (
        <span className="font-bold">{Math.round(bestScore)}%</span>
      )}
    </span>
  );
}
