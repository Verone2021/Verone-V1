'use client';

import { Search } from 'lucide-react';

import type { LocalCollectionFilters } from '../types';

interface CollectionsFiltersProps {
  filters: LocalCollectionFilters;
  onFiltersChange: (filters: LocalCollectionFilters) => void;
}

export function CollectionsFilters({
  filters,
  onFiltersChange,
}: CollectionsFiltersProps) {
  return (
    <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 px-6">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder="Rechercher une collection..."
          value={filters.search}
          onChange={e =>
            onFiltersChange({ ...filters, search: e.target.value })
          }
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
        />
      </div>

      <div className="flex space-x-2">
        <select
          value={filters.status}
          onChange={e =>
            onFiltersChange({
              ...filters,
              status: e.target.value as 'all' | 'active' | 'inactive',
            })
          }
          className="border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="all">Tous les statuts</option>
          <option value="active">Actives</option>
          <option value="inactive">Inactives</option>
        </select>

        <select
          value={filters.visibility}
          onChange={e =>
            onFiltersChange({
              ...filters,
              visibility: e.target.value as 'all' | 'public' | 'private',
            })
          }
          className="border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="all">Toutes visibilités</option>
          <option value="public">Publiques</option>
          <option value="private">Privées</option>
        </select>
      </div>
    </div>
  );
}
