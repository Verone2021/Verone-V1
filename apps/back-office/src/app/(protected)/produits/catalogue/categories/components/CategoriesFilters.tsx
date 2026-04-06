import { Search } from 'lucide-react';

import type { HierarchyFilters } from '../types';

interface CategoriesFiltersProps {
  filters: HierarchyFilters;
  setFilters: React.Dispatch<React.SetStateAction<HierarchyFilters>>;
}

export function CategoriesFilters({
  filters,
  setFilters,
}: CategoriesFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
      <div className="flex-1 min-w-64">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher familles, catégories, sous-catégories..."
            value={filters.search}
            onChange={e =>
              setFilters(prev => ({ ...prev, search: e.target.value }))
            }
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black"
          />
        </div>
      </div>

      <select
        value={filters.status}
        onChange={e =>
          setFilters(prev => ({
            ...prev,
            status: e.target.value as HierarchyFilters['status'],
          }))
        }
        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black"
      >
        <option value="all">Tous les statuts</option>
        <option value="active">Actifs uniquement</option>
        <option value="inactive">Inactifs uniquement</option>
      </select>

      <select
        value={filters.level}
        onChange={e =>
          setFilters(prev => ({
            ...prev,
            level: e.target.value as HierarchyFilters['level'],
          }))
        }
        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black"
      >
        <option value="all">Tous les niveaux</option>
        <option value="family">Familles uniquement</option>
        <option value="category">Catégories uniquement</option>
        <option value="subcategory">Sous-catégories uniquement</option>
      </select>
    </div>
  );
}
