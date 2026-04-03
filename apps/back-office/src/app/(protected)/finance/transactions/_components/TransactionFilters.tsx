'use client';

import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Search, Filter } from 'lucide-react';

import {
  formatAmount,
  type StatusFilter,
  type SideFilter,
} from './transaction-helpers';

interface TransactionFiltersProps {
  totalBalance: number;
  search: string;
  statusFilter: StatusFilter;
  sideFilter: SideFilter;
  yearFilter: number | null;
  years: number[];
  onSearch: (value: string) => void;
  onStatusChange: (status: StatusFilter) => void;
  onSideChange: (side: SideFilter) => void;
  onYearChange: (year: number | null) => void;
}

export function TransactionFilters({
  totalBalance,
  search,
  statusFilter,
  sideFilter,
  yearFilter,
  years,
  onSearch,
  onStatusChange,
  onSideChange,
  onYearChange,
}: TransactionFiltersProps) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div>
        <p className="text-3xl font-bold">{formatAmount(totalBalance)}</p>
        <p className="text-sm text-muted-foreground">Tresorerie actuelle</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            className="pl-9 w-64"
            value={search}
            onChange={e => onSearch(e.target.value)}
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={v => onStatusChange(v as StatusFilter)}
        >
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="to_process">A traiter</SelectItem>
            <SelectItem value="classified">Classees</SelectItem>
            <SelectItem value="matched">Rapprochees</SelectItem>
            <SelectItem value="cca">CCA</SelectItem>
            <SelectItem value="ignored">Ignorees</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={sideFilter}
          onValueChange={v => onSideChange(v as SideFilter)}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="debit">Sorties</SelectItem>
            <SelectItem value="credit">Entrees</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={yearFilter?.toString() ?? 'all'}
          onValueChange={v => onYearChange(v === 'all' ? null : parseInt(v))}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            {years.map(year => (
              <SelectItem key={year} value={String(year)}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
