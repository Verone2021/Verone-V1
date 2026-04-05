'use client';

import { Checkbox } from '@verone/ui';
import { TableHead, TableHeader, TableRow } from '@verone/ui';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

import type { Commission, SortColumn, SortDirection } from '../types';

interface CommissionsTableHeaderProps {
  showCheckboxes: boolean;
  tabCommissions: Commission[];
  selectedIds: string[];
  toggleSelectAll: (list: Commission[]) => void;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
}

function SortIcon({
  column,
  sortColumn,
  sortDirection,
}: {
  column: SortColumn;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
}) {
  if (sortColumn !== column) {
    return <ArrowUpDown className="h-4 w-4 opacity-50" />;
  }
  return sortDirection === 'asc' ? (
    <ArrowUp className="h-4 w-4" />
  ) : (
    <ArrowDown className="h-4 w-4" />
  );
}

export function CommissionsTableHeader({
  showCheckboxes,
  tabCommissions,
  selectedIds,
  toggleSelectAll,
  sortColumn,
  sortDirection,
  onSort,
}: CommissionsTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow>
        {showCheckboxes && (
          <TableHead className="w-[50px]">
            <Checkbox
              checked={
                selectedIds.length === tabCommissions.length &&
                tabCommissions.length > 0
              }
              onCheckedChange={() => toggleSelectAll(tabCommissions)}
            />
          </TableHead>
        )}
        <TableHead
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => onSort('date')}
        >
          <span className="inline-flex items-center gap-1">
            Date
            <SortIcon
              column="date"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
            />
          </span>
        </TableHead>
        <TableHead
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => onSort('order_number')}
        >
          <span className="inline-flex items-center gap-1">
            N° Commande
            <SortIcon
              column="order_number"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
            />
          </span>
        </TableHead>
        <TableHead>Organisation</TableHead>
        <TableHead>Affilié</TableHead>
        <TableHead>Paiement</TableHead>
        <TableHead className="text-right">Total HT</TableHead>
        <TableHead className="text-right">Total TTC</TableHead>
        <TableHead className="text-right">Rémunération HT</TableHead>
        <TableHead className="text-right text-orange-600">
          Rémunération TTC
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
