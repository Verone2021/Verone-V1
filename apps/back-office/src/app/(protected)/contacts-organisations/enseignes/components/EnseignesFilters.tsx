'use client';

import { ButtonV2, Input } from '@verone/ui';
import { colors } from '@verone/ui/design-system';
import { cn } from '@verone/utils';
import { Search, LayoutGrid, List } from 'lucide-react';

interface EnseignesFiltersProps {
  activeTab: 'active' | 'archived' | 'all';
  setActiveTab: (tab: 'active' | 'archived' | 'all') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  stats: {
    active: number;
    archived: number;
    total: number;
  };
}

export function EnseignesFilters({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  stats,
}: EnseignesFiltersProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => setActiveTab('active')}
        className={cn(
          'px-4 py-2 rounded-lg text-sm font-medium transition-all',
          activeTab === 'active'
            ? 'bg-black text-white'
            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
        )}
      >
        Actives
        <span className="ml-2 opacity-70">({stats.active})</span>
      </button>

      <button
        onClick={() => setActiveTab('archived')}
        className={cn(
          'px-4 py-2 rounded-lg text-sm font-medium transition-all',
          activeTab === 'archived'
            ? 'bg-black text-white'
            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
        )}
      >
        Archivées
        <span className="ml-2 opacity-70">({stats.archived})</span>
      </button>

      <button
        onClick={() => setActiveTab('all')}
        className={cn(
          'px-4 py-2 rounded-lg text-sm font-medium transition-all',
          activeTab === 'all'
            ? 'bg-black text-white'
            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
        )}
      >
        Toutes
        <span className="ml-2 opacity-70">({stats.total})</span>
      </button>

      {/* Barre de recherche */}
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

      {/* Toggle Grid/List View */}
      <div className="flex gap-1 ml-auto">
        <ButtonV2
          variant={viewMode === 'grid' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('grid')}
          icon={LayoutGrid}
          className="h-10 px-3"
          aria-label="Vue grille"
        />
        <ButtonV2
          variant={viewMode === 'list' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('list')}
          icon={List}
          className="h-10 px-3"
          aria-label="Vue liste"
        />
      </div>
    </div>
  );
}
