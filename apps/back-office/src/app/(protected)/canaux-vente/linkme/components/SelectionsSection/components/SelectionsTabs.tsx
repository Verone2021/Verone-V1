'use client';

import { cn } from '@verone/utils';

interface SelectionsTabsProps {
  activeTab: 'active' | 'archived';
  onTabChange: (tab: 'active' | 'archived') => void;
  activeCount: number;
  archivedCount: number;
}

export function SelectionsTabs({
  activeTab,
  onTabChange,
  activeCount,
  archivedCount,
}: SelectionsTabsProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <button
        onClick={() => onTabChange('active')}
        className={cn(
          'px-4 py-2 rounded-lg text-sm font-medium transition-all',
          activeTab === 'active'
            ? 'bg-black text-white'
            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
        )}
      >
        Actives
        <span className="ml-2 opacity-70">({activeCount})</span>
      </button>

      <button
        onClick={() => onTabChange('archived')}
        className={cn(
          'px-4 py-2 rounded-lg text-sm font-medium transition-all',
          activeTab === 'archived'
            ? 'bg-black text-white'
            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
        )}
      >
        Archivées
        <span className="ml-2 opacity-70">({archivedCount})</span>
      </button>
    </div>
  );
}
