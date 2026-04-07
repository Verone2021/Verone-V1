'use client';

import { Search } from 'lucide-react';

import { CategoryFilterCombobox } from '@verone/categories';

import type { LocalVariantFilters } from './variantes.types';

interface VariantesFiltersProps {
  filters: LocalVariantFilters;
  setFilters: React.Dispatch<React.SetStateAction<LocalVariantFilters>>;
}

export function VariantesFilters({
  filters,
  setFilters,
}: VariantesFiltersProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] max-w-xs relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={filters.search}
            onChange={e =>
              setFilters(prev => ({ ...prev, search: e.target.value }))
            }
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>
        <div className="w-72">
          <CategoryFilterCombobox
            value={filters.subcategoryId}
            onValueChange={subcategoryId =>
              setFilters(prev => ({ ...prev, subcategoryId }))
            }
            entityType="variant_groups"
            placeholder="Filtrer par catégorie..."
          />
        </div>
        <select
          value={filters.status}
          onChange={e =>
            setFilters(prev => ({
              ...prev,
              status: e.target.value as LocalVariantFilters['status'],
            }))
          }
          className="border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="all">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="inactive">Inactifs</option>
        </select>
        <select
          value={filters.type}
          onChange={e =>
            setFilters(prev => ({
              ...prev,
              type: e.target.value as LocalVariantFilters['type'],
            }))
          }
          className="border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="all">Tous les types</option>
          <option value="color">Couleur</option>
          <option value="material">Matériau</option>
        </select>
      </div>
    </div>
  );
}
