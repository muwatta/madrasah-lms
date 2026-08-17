import { useState, type ReactNode } from 'react';
import { useLanguage } from '../context/LanguageContext';

export interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab?: string;
  onChange: (tabId: string) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export default function Tabs({ tabs, activeTab: controlledTab, onChange, size = 'md', className = '' }: TabsProps) {
  const { language } = useLanguage();
  const [internalTab, setInternalTab] = useState(tabs[0]?.id ?? '');
  const activeTab = controlledTab ?? internalTab;

  const handleChange = (id: string) => {
    if (!controlledTab) setInternalTab(id);
    onChange(id);
  };

  const sizeClasses = size === 'sm'
    ? 'gap-1 rounded-lg p-0.5'
    : 'gap-1 rounded-xl p-1';

  return (
    <div
      className={`inline-flex flex-wrap items-center ${sizeClasses} border ${language === 'ar' ? 'flex-row-reverse' : ''} ${className}`}
      style={{
        borderColor: 'var(--color-border)',
        backgroundColor: 'var(--color-bg-secondary)',
      }}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => handleChange(tab.id)}
            className={`
              flex items-center gap-1.5 rounded-lg font-medium transition-all
              ${size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-4 py-2 text-sm'}
              ${isActive
                ? 'shadow-sm'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }
            `}
            style={isActive ? {
              backgroundColor: 'var(--color-bg-primary)',
              color: 'var(--color-text-primary)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            } : {
              color: 'var(--color-text-muted)',
            }}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none"
                style={isActive ? {
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-muted)',
                } : {
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-muted)',
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function useTabState(defaultTab: string) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  return { activeTab, setActiveTab };
}
