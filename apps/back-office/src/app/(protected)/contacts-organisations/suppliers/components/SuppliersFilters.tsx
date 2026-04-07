'use client';

import { type Organisation } from '@verone/organisations';
import { Input } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { colors } from '@verone/ui/design-system';
import { cn } from '@verone/utils';
import { Search, LayoutGrid, List } from 'lucide-react';

interface SuppliersFiltersProps {
  activeTab: 'active' | 'archived' | 'preferred';
  onTabChange: (tab: 'active' | 'archived' | 'preferred') => void;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  suppliers: Organisation[];
  archivedSuppliers: Organisation[];
}

export function SuppliersFilters({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  suppliers,
  archivedSuppliers,
}: SuppliersFiltersProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onTabChange('active')}
        className={cn(
          'px-4 py-2 rounded-lg text-sm font-medium transition-all',
          activeTab === 'active'
            ? 'bg-black text-white'
            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
        )}
      >
        Actifs
        <span className="ml-2 opacity-70">({suppliers.length})</span>
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
        Archivés
        <span className="ml-2 opacity-70">({archivedSuppliers.length})</span>
      </button>

      <button
        onClick={() => onTabChange('preferred')}
        className={cn(
          'px-4 py-2 rounded-lg text-sm font-medium transition-all',
          activeTab === 'preferred'
            ? 'bg-black text-white'
            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
        )}
      >
        Favoris
        <span className="ml-2 opacity-70">
          ({suppliers.filter(s => s.preferred_supplier === true).length})
        </span>
      </button>

      {/* Barre de recherche alignée */}
      <div className="relative w-64">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
          style={{ color: colors.text.muted }}
        />
        <Input
          placeholder="Rechercher par nom..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
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
