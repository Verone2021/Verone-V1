'use client';

import { Badge } from '@verone/ui';
import { AlertTriangle } from 'lucide-react';

import type { Filters } from './types';

interface CatalogueTabsProps {
  activeTab: 'active' | 'incomplete' | 'archived';
  total: number;
  incompleteTotal: number;
  archivedCount: number;
  filters: Filters;
  onTabChange: (tab: 'active' | 'incomplete' | 'archived') => void;
  onSetIncompletePage: (page: number) => void;
  syncFiltersToUrl: (filters: Filters, tab: string) => void;
}

export function CatalogueTabs({
  activeTab,
  total,
  incompleteTotal,
  archivedCount,
  filters,
  onTabChange,
  onSetIncompletePage,
  syncFiltersToUrl,
}: CatalogueTabsProps) {
  return (
    <div className="flex border-b border-black">
      <button
        onClick={() => {
          onTabChange('active');
          syncFiltersToUrl(filters, 'active');
        }}
        className={`px-6 py-3 font-medium transition-colors ${
          activeTab === 'active'
            ? 'border-b-2 border-black text-black'
            : 'text-black opacity-60 hover:opacity-80'
        }`}
      >
        Produits Actifs ({total})
      </button>
      <button
        onClick={() => {
          onTabChange('incomplete');
          onSetIncompletePage(1);
          syncFiltersToUrl(filters, 'incomplete');
        }}
        className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
          activeTab === 'incomplete'
            ? 'border-b-2 border-black text-black'
            : 'text-black opacity-60 hover:opacity-80'
        }`}
      >
        <AlertTriangle className="h-4 w-4 text-orange-500" />À compléter
        {incompleteTotal > 0 && (
          <Badge className="bg-orange-100 text-orange-700 border-orange-300 text-[10px] px-1.5 py-0">
            {incompleteTotal}
          </Badge>
        )}
      </button>
      <button
        onClick={() => {
          onTabChange('archived');
          syncFiltersToUrl(filters, 'archived');
        }}
        className={`px-6 py-3 font-medium transition-colors ${
          activeTab === 'archived'
            ? 'border-b-2 border-black text-black'
            : 'text-black opacity-60 hover:opacity-80'
        }`}
      >
        Produits Archivés ({archivedCount})
      </button>
    </div>
  );
}
