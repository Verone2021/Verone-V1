'use client';

import { ButtonV2 } from '@verone/ui';
import { List, Columns3, LayoutGrid } from 'lucide-react';

export type SourcingViewMode = 'list' | 'kanban' | 'card';

interface SourcingViewToggleProps {
  view: SourcingViewMode;
  onViewChange: (view: SourcingViewMode) => void;
}

const VIEWS = [
  { id: 'list' as const, icon: List, label: 'Liste' },
  { id: 'kanban' as const, icon: Columns3, label: 'Kanban' },
  { id: 'card' as const, icon: LayoutGrid, label: 'Carte' },
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
            className={
              isActive
                ? 'bg-black text-white hover:bg-gray-800'
                : 'text-gray-500 hover:text-black hover:bg-gray-50'
            }
          >
            <Icon className="h-4 w-4" />
            <span className="ml-1.5 text-xs hidden sm:inline">{v.label}</span>
          </ButtonV2>
        );
      })}
    </div>
  );
}
