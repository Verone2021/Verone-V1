'use client';

import { useMemo, useState } from 'react';

import { Input } from '@verone/ui';
import { Loader2, Warehouse, Search } from 'lucide-react';

import { useStorageOverview } from '../../hooks/use-linkme-storage';

import { StorageCard } from './StorageCard';

export function StockageClientsTab(): React.ReactElement {
  const [searchFilter, setSearchFilter] = useState('');
  const { data: overview, isLoading } = useStorageOverview();

  const filteredOverview = useMemo(() => {
    if (!overview) return [];
    if (!searchFilter) return overview;
    const lower = searchFilter.toLowerCase();
    return overview.filter(item =>
      item.owner_name?.toLowerCase().includes(lower)
    );
  }, [overview, searchFilter]);

  return (
    <div>
      {/* Search Filter */}
      <div className="mb-4">
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input
            type="text"
            placeholder="Rechercher..."
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredOverview.length === 0 && (
        <div className="bg-white rounded-lg p-8 text-center border">
          <Warehouse className="h-8 w-8 text-gray-400 mx-auto mb-3" />
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            Aucun stockage
          </h2>
          <p className="text-sm text-gray-500 mb-3">
            {searchFilter
              ? 'Aucun client ne correspond'
              : "Aucun client n'a de produits"}
          </p>
        </div>
      )}

      {/* Cards Grid */}
      {!isLoading && filteredOverview.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredOverview.map(item => (
            <StorageCard
              key={`${item.owner_type}-${item.owner_id}`}
              item={item}
            />
          ))}
        </div>
      )}
    </div>
  );
}
