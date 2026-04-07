'use client';

import { ButtonV2, Input } from '@verone/ui';
import { colors } from '@verone/ui/design-system';
import { cn } from '@verone/utils';
import { Search, LayoutGrid, List } from 'lucide-react';

import type { Organisation } from '@verone/organisations';

interface PartnersFiltersProps {
  activeTab: 'active' | 'archived' | 'preferred';
  setActiveTab: (tab: 'active' | 'archived' | 'preferred') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  partners: Organisation[];
  archivedCount: number;
}

export function PartnersFilters({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  viewMode,
  onViewModeChange,
  partners,
  archivedCount,
}: PartnersFiltersProps) {
  const tabClass = (tab: typeof activeTab) =>
    cn(
      'px-4 py-2 rounded-lg text-sm font-medium transition-all',
      activeTab === tab
        ? 'bg-black text-white'
        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
    );

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => setActiveTab('active')}
        className={tabClass('active')}
      >
        Actifs
        <span className="ml-2 opacity-70">({partners.length})</span>
      </button>

      <button
        onClick={() => setActiveTab('archived')}
        className={tabClass('archived')}
      >
        Archivés
        <span className="ml-2 opacity-70">({archivedCount})</span>
      </button>

      <button
        onClick={() => setActiveTab('preferred')}
        className={tabClass('preferred')}
      >
        Favoris
        <span className="ml-2 opacity-70">
          ({partners.filter(p => p.preferred_supplier === true).length})
        </span>
      </button>

      <div className="relative w-64">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
          style={{ color: colors.text.muted }}
        />
        <Input
          placeholder="Rechercher par nom..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10 h-10 rounded-lg"
          style={{
            borderColor: colors.border.DEFAULT,
            color: colors.text.DEFAULT,
          }}
        />
      </div>

      <div className="flex gap-1 ml-auto">
        <ButtonV2
          variant={viewMode === 'grid' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('grid')}
          icon={LayoutGrid}
          className="h-10 px-3"
          aria-label="Vue grille"
        />
        <ButtonV2
          variant={viewMode === 'list' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('list')}
          icon={List}
          className="h-10 px-3"
          aria-label="Vue liste"
        />
      </div>
    </div>
  );
}
