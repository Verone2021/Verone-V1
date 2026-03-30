'use client';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { cn } from '@verone/utils';
import { Filter, ChevronDown } from 'lucide-react';

import type { DirectionFilter } from './utils';

interface MovementsDirectionBarProps {
  directionFilter: DirectionFilter;
  filtersOpen: boolean;
  activeFiltersCount: number;
  onToggleFilters: () => void;
  onDirectionChange: (direction: DirectionFilter) => void;
  onAdjustmentsClick: () => void;
}

export function MovementsDirectionBar({
  directionFilter,
  filtersOpen,
  activeFiltersCount,
  onToggleFilters,
  onDirectionChange,
  onAdjustmentsClick,
}: MovementsDirectionBarProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <ButtonV2
          variant="outline"
          size="sm"
          onClick={onToggleFilters}
          className="border-black text-black hover:bg-black hover:text-white transition-all"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtres
          {activeFiltersCount > 0 && (
            <Badge className="ml-2 bg-blue-600 text-white">
              {activeFiltersCount}
            </Badge>
          )}
          <ChevronDown
            className={cn(
              'h-4 w-4 ml-2 transition-transform duration-300',
              filtersOpen && 'rotate-180'
            )}
          />
        </ButtonV2>

        <ButtonV2
          variant="outline"
          size="sm"
          onClick={onAdjustmentsClick}
          className="border-purple-600 text-purple-600 hover:bg-purple-50"
        >
          🔍 Ajustements uniquement
        </ButtonV2>
      </div>

      <div className="flex items-center border border-black rounded-md p-1 gap-1">
        {(['in', 'out', 'all'] as const).map(direction => (
          <ButtonV2
            key={direction}
            variant={directionFilter === direction ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onDirectionChange(direction)}
            className={cn(
              'px-4',
              directionFilter === direction
                ? 'bg-black text-white hover:bg-black/90'
                : 'text-black hover:bg-gray-100'
            )}
          >
            {direction === 'in'
              ? 'Entrées'
              : direction === 'out'
                ? 'Sorties'
                : 'Tous'}
          </ButtonV2>
        ))}
      </div>
    </div>
  );
}
