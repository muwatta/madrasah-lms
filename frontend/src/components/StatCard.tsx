import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color?: string;
  delay?: number;
}

export default function StatCard({ title, value, icon, color = 'bg-primary-600', delay = 0 }: StatCardProps) {
  return (
    <div
      className="card-hover rounded-xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm opacity-0 animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-4">
        <div className={`flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl ${color} text-white shadow-sm`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
        </div>
      </div>
    </div>
  );
}
