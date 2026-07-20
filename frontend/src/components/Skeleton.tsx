interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'table-row' | 'avatar' | 'chart';
}

const base = 'animate-pulse rounded bg-gray-200 dark:bg-gray-700';

export function Skeleton({ className = '', variant = 'text' }: SkeletonProps) {
  const variantClass = {
    text: 'h-4 w-full',
    card: 'h-32 w-full rounded-xl',
    'table-row': 'h-10 w-full',
    avatar: 'h-10 w-10 rounded-full',
    chart: 'h-48 w-full rounded-xl',
  }[variant];

  return <div className={`${base} ${variantClass} ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 space-y-3">
      <Skeleton variant="text" className="w-1/3" />
      <Skeleton variant="text" className="w-2/3" />
      <Skeleton variant="text" className="w-1/2" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} variant="table-row" className="rounded-lg" />
      ))}
    </div>
  );
}

export function SkeletonStatsGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <Skeleton variant="text" className="mb-4 w-1/4" />
      <Skeleton variant="chart" />
    </div>
  );
}
