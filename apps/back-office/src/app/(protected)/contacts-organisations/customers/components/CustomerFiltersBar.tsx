'use client';

import { ButtonV2, Input } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { colors } from '@verone/ui/design-system';
import { cn } from '@verone/utils';
import { Search, Filter, LayoutGrid, List } from 'lucide-react';
import { type Organisation } from '@verone/organisations';

interface Enseigne {
  id: string;
  name: string;
}

interface CustomerFiltersBarProps {
  activeTab: 'active' | 'archived' | 'preferred' | 'incomplete';
  setActiveTab: (
    tab: 'active' | 'archived' | 'preferred' | 'incomplete'
  ) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  enseigneFilter: string | null;
  setEnseigneFilter: (filter: string | null) => void;
  enseignes: Enseigne[];
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  filteredCustomers: Organisation[];
  archivedCount: number;
  incompleteCount: number;
}

export function CustomerFiltersBar({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  enseigneFilter,
  setEnseigneFilter,
  enseignes,
  viewMode,
  onViewModeChange,
  filteredCustomers,
  archivedCount,
  incompleteCount,
}: CustomerFiltersBarProps) {
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
        Actifs
        <span className="ml-2 opacity-70">({filteredCustomers.length})</span>
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
        Archivés
        <span className="ml-2 opacity-70">({archivedCount})</span>
      </button>

      <button
        onClick={() => setActiveTab('preferred')}
        className={cn(
          'px-4 py-2 rounded-lg text-sm font-medium transition-all',
          activeTab === 'preferred'
            ? 'bg-black text-white'
            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
        )}
      >
        Favoris
        <span className="ml-2 opacity-70">
          ({filteredCustomers.filter(c => c.preferred_supplier === true).length}
          )
        </span>
      </button>

      <button
        onClick={() => setActiveTab('incomplete')}
        className={cn(
          'px-4 py-2 rounded-lg text-sm font-medium transition-all',
          activeTab === 'incomplete'
            ? 'bg-orange-500 text-white'
            : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
        )}
      >
        À compléter
        <span className="ml-2 opacity-70">({incompleteCount})</span>
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
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10 h-10 rounded-lg"
          style={{
            borderColor: colors.border.DEFAULT,
            color: colors.text.DEFAULT,
          }}
        />
      </div>

      {/* Filtre par enseigne */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4" style={{ color: colors.text.muted }} />
        <Select
          value={enseigneFilter ?? 'all'}
          onValueChange={value =>
            setEnseigneFilter(value === 'all' ? null : value)
          }
        >
          <SelectTrigger className="w-[180px] h-10">
            <SelectValue placeholder="Toutes les enseignes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les enseignes</SelectItem>
            {enseignes.map(enseigne => (
              <SelectItem key={enseigne.id} value={enseigne.id}>
                {enseigne.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
