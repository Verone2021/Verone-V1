'use client';

import React from 'react';

import { cn } from '@verone/ui';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Wallet,
  Users,
} from 'lucide-react';

export type DashboardTab =
  | 'apercu'
  | 'ventes'
  | 'stock'
  | 'finances'
  | 'linkme';

interface TabConfig {
  id: DashboardTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabConfig[] = [
  { id: 'apercu', label: 'Aperçu', icon: LayoutDashboard },
  { id: 'ventes', label: 'Ventes', icon: ShoppingCart },
  { id: 'stock', label: 'Stock', icon: Package },
  { id: 'finances', label: 'Finances', icon: Wallet },
  { id: 'linkme', label: 'LinkMe', icon: Users },
];

interface DashboardTabsProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

export function DashboardTabs({ activeTab, onTabChange }: DashboardTabsProps) {
  return (
    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
      {TABS.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export { TABS };
