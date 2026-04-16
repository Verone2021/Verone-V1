'use client';

import { cn } from '@verone/utils';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export type SortField =
  | 'name'
  | 'supplier'
  | 'subcategory'
  | 'weight'
  | 'stock_real'
  | 'cost_price'
  | 'margin_percentage'
  | 'completion_percentage'
  | 'product_status';

export type SortDir = 'asc' | 'desc';

export const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  active: {
    label: 'Actif',
    className: 'bg-green-100 text-green-800 border-green-300',
  },
  preorder: {
    label: 'Precommande',
    className: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  discontinued: {
    label: 'Arrete',
    className: 'bg-gray-100 text-gray-800 border-gray-300',
  },
  draft: {
    label: 'Brouillon',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
};

export function formatDimensions(
  dims: Record<string, unknown> | undefined | null
): string {
  if (!dims) return '-';
  const l = dims.length_cm ?? dims.length;
  const w = dims.width_cm ?? dims.width;
  const h = dims.height_cm ?? dims.height;
  if (l == null && w == null && h == null) return '-';
  return `${l ?? '?'} x ${w ?? '?'} x ${h ?? '?'}`;
}

export function completionColor(pct: number | null | undefined): string {
  if (pct == null) return 'text-gray-400';
  if (pct >= 80) return 'text-green-600';
  if (pct >= 50) return 'text-orange-600';
  return 'text-red-600';
}

export function stockColor(stock: number | null | undefined): string {
  if (stock == null) return 'text-gray-400';
  if (stock > 10) return 'text-green-600';
  if (stock > 0) return 'text-orange-600';
  return 'text-red-600';
}

interface SortableHeaderProps {
  label: string;
  field: SortField;
  currentSort: SortField;
  currentDir: SortDir;
  onSort: (field: SortField) => void;
  className?: string;
}

export function SortableHeader({
  label,
  field,
  currentSort,
  currentDir,
  onSort,
  className,
}: SortableHeaderProps) {
  const isActive = currentSort === field;
  return (
    <th
      className={cn(
        'py-2 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-black select-none',
        className
      )}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive ? (
          currentDir === 'asc' ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </div>
    </th>
  );
}
