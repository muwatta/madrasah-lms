import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

interface NavLink {
  labelKey: string;
  path: string;
  icon: React.ReactNode;
  label: string;
}

interface Props {
  links: NavLink[];
}

export default function PageNavigation({ links }: Props) {
  const { t, dir } = useLanguage();
  const location = useLocation();

  const idx = links.findIndex(l => l.path === location.pathname);
  if (idx === -1) return null;

  const prev = idx > 0 ? links[idx - 1] : null;
  const next = idx < links.length - 1 ? links[idx + 1] : null;
  if (!prev && !next) return null;

  return (
    <div
      className="mt-8 flex items-center justify-between gap-4 border-t pt-6"
      style={{ borderColor: 'var(--color-border-light)' }}
    >
      <div className="min-w-0 flex-1">
        {prev ? (
          <Link
            to={prev.path}
            className="group flex items-center gap-2 rounded-lg px-4 py-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <svg
              className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ transform: dir === 'rtl' ? 'scaleX(-1)' : undefined }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <div className="min-w-0">
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('common.previous')}</p>
              <p className="truncate text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{prev.label}</p>
            </div>
          </Link>
        ) : null}
      </div>

      <div className="min-w-0 flex-1 text-end">
        {next ? (
          <Link
            to={next.path}
            className="group inline-flex items-center gap-2 rounded-lg px-4 py-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <div className="min-w-0">
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('common.next')}</p>
              <p className="truncate text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{next.label}</p>
            </div>
            <svg
              className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ transform: dir === 'rtl' ? 'scaleX(-1)' : undefined }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
