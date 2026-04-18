'use client';

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

import type { SortField, SortDirection } from './commissions-table.types';
import { Checkbox } from './commissions-table.sub-components';

interface CommissionsTableHeadProps {
  showCheckbox: boolean;
  showSelectAll: boolean;
  allPayableSelected: boolean;
  onSelectAll: (checked: boolean) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

export function CommissionsTableHead({
  showCheckbox,
  showSelectAll,
  allPayableSelected,
  onSelectAll,
  sortField,
  sortDirection,
  onSort,
}: CommissionsTableHeadProps) {
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3 w-3" />
    ) : (
      <ArrowDown className="h-3 w-3" />
    );
  };

  return (
    <thead className="bg-gray-50 sticky top-0">
      <tr>
        <th className="w-8" />
        {showCheckbox && (
          <th className="px-3 py-2 w-10">
            {showSelectAll && (
              <Checkbox checked={allPayableSelected} onChange={onSelectAll} />
            )}
          </th>
        )}
        <th
          className="px-3 py-2 text-left text-xs font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700 transition-colors hidden sm:table-cell"
          onClick={() => onSort('date')}
        >
          <span className="inline-flex items-center gap-1">
            Date
            <SortIcon field="date" />
          </span>
        </th>
        <th
          className="px-3 py-2 text-left text-xs font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700 transition-colors"
          onClick={() => onSort('order')}
        >
          <span className="inline-flex items-center gap-1">
            Commande
            <SortIcon field="order" />
          </span>
        </th>
        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 hidden md:table-cell">
          Client
        </th>
        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 hidden lg:table-cell">
          CA HT
        </th>
        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 hidden lg:table-cell">
          CA TTC
        </th>
        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 hidden sm:table-cell">
          Remuneration HT
        </th>
        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
          Remuneration TTC
        </th>
        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
          Statut
        </th>
      </tr>
    </thead>
  );
}
