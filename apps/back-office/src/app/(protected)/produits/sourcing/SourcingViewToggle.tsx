'use client';

import { ButtonV2 } from '@verone/ui';
import { Columns3, List } from 'lucide-react';

export type SourcingViewMode = 'list' | 'kanban';

interface SourcingViewToggleProps {
  view: SourcingViewMode;
  onViewChange: (view: SourcingViewMode) => void;
}

const VIEWS = [
  { id: 'list' as const, icon: List, label: 'Liste' },
  { id: 'kanban' as const, icon: Columns3, label: 'Étapes' },
];

export function SourcingViewToggle({
  view,
  onViewChange,
}: SourcingViewToggleProps) {
  return (
    <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white p-0.5">
      {VIEWS.map(v => {
        const Icon = v.icon;
        const isActive = view === v.id;
        return (
          <ButtonV2
            key={v.id}
            variant={isActive ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onViewChange(v.id)}
            aria-pressed={isActive}
            title={v.label}
            className={
              isActive
                ? 'h-11 bg-black text-white hover:bg-gray-800 md:h-9'
                : 'h-11 text-gray-500 hover:bg-gray-50 hover:text-black md:h-9'
            }
          >
            <Icon className="h-4 w-4" />
            <span className="ml-1.5 hidden text-xs sm:inline">{v.label}</span>
          </ButtonV2>
        );
      })}
    </div>
  );
}
