'use client';

import type { TabType } from './commandes.constants';

const TABS: Array<{ id: TabType; label: string; color: string }> = [
  { id: 'all', label: 'Toutes', color: 'blue' },
  { id: 'pending_approval', label: 'En approbation', color: 'teal' },
  { id: 'validated', label: 'Validée', color: 'blue' },
  { id: 'shipped', label: 'Expédiée', color: 'green' },
  { id: 'cancelled', label: 'Annulée', color: 'gray' },
];

function getBadgeColor(color: string, isActive: boolean): string {
  if (color === 'orange') return 'bg-amber-100 text-amber-600';
  if (color === 'teal') return 'bg-teal-100 text-teal-600';
  if (color === 'green') return 'bg-green-100 text-green-600';
  if (color === 'gray') return 'bg-gray-100 text-gray-500';
  return isActive
    ? 'bg-[#5DBEBB]/10 text-[#5DBEBB]'
    : 'bg-gray-100 text-gray-500';
}

interface CommandesTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  getTabCount: (tab: TabType) => number;
}

export function CommandesTabs({
  activeTab,
  onTabChange,
  getTabCount,
}: CommandesTabsProps) {
  return (
    <div className="border-b overflow-x-auto">
      <nav className="flex min-w-max">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          const count = getTabCount(tab.id);
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-[#5DBEBB] text-[#5DBEBB]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              <span
                className={`ml-2 px-2 py-0.5 text-xs rounded-full ${getBadgeColor(tab.color, isActive)}`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
