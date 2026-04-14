'use client';

import {
  Calendar,
  Filter,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Package,
} from 'lucide-react';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Checkbox } from '@verone/ui';
import { Label } from '@verone/ui';

import type { HistoryFilters } from './types';

interface ProductHistoryFiltersProps {
  filters: HistoryFilters;
  hasActiveFilters: boolean;
  onDateRangeChange: (range: HistoryFilters['dateRange']) => void;
  onToggleMovementType: (type: string) => void;
  onReset: () => void;
}

const DATE_RANGE_BUTTONS: {
  value: HistoryFilters['dateRange'];
  label: string;
}[] = [
  { value: 'all', label: 'Tout afficher' },
  { value: 'today', label: "Aujourd'hui" },
  { value: '7days', label: '7 derniers jours' },
  { value: '30days', label: '30 derniers jours' },
];

const MOVEMENT_TYPES = [
  { value: 'IN', label: 'Entrées', icon: TrendingUp },
  { value: 'OUT', label: 'Sorties', icon: TrendingDown },
  { value: 'ADJUST', label: 'Ajustements', icon: Package },
  { value: 'TRANSFER', label: 'Transferts', icon: Package },
];

export function ProductHistoryFilters({
  filters,
  hasActiveFilters,
  onDateRangeChange,
  onToggleMovementType,
  onReset,
}: ProductHistoryFiltersProps) {
  return (
    <div className="p-4 space-y-4 border-b border-gray-200 bg-white">
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Calendar className="h-4 w-4" />
          Période
        </Label>
        <div className="flex flex-wrap gap-2">
          {DATE_RANGE_BUTTONS.map(({ value, label }) => (
            <ButtonV2
              key={value}
              variant="outline"
              size="sm"
              onClick={() => onDateRangeChange(value)}
              className={`h-8 text-xs ${filters.dateRange === value ? 'bg-black text-white hover:bg-gray-800' : 'border-gray-300'}`}
            >
              {label}
            </ButtonV2>
          ))}
          {hasActiveFilters && (
            <ButtonV2
              variant="outline"
              size="sm"
              onClick={onReset}
              className="h-8 text-xs border-red-300 text-red-600 hover:bg-red-50"
            >
              <RotateCcw className="h-3 w-3 mr-1.5" />
              Reset
            </ButtonV2>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Filter className="h-4 w-4" />
          Types de mouvement
          {filters.movementTypes.length > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {filters.movementTypes.length} sélectionné
              {filters.movementTypes.length > 1 ? 's' : ''}
            </Badge>
          )}
        </Label>
        <div className="grid grid-cols-4 gap-2">
          {MOVEMENT_TYPES.map(({ value, label, icon: Icon }) => (
            <div key={value} className="flex items-center space-x-2">
              <Checkbox
                id={`modal-type-${value}`}
                checked={filters.movementTypes.includes(value)}
                onCheckedChange={() => onToggleMovementType(value)}
              />
              <Label
                htmlFor={`modal-type-${value}`}
                className="text-xs cursor-pointer flex items-center gap-1.5 font-normal"
              >
                <Icon className="h-3 w-3" />
                {label}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
