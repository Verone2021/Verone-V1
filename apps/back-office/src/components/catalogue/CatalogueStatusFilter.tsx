'use client';

import { Badge } from '@verone/ui';
import { Button } from '@verone/ui';
import { Checkbox } from '@verone/ui';
import { Popover, PopoverContent, PopoverTrigger } from '@verone/ui';
import { cn } from '@verone/utils';
import { Activity, ChevronDown } from 'lucide-react';

import { STATUS_ICONS, STATUS_LABELS } from './catalogue-filter.types';

interface CatalogueStatusFilterProps {
  availableStatuses: string[];
  statusCounts: Map<string, number>;
  selectedStatuses: string[];
  onStatusToggle: (status: string) => void;
}

export function CatalogueStatusFilter({
  availableStatuses,
  statusCounts,
  selectedStatuses,
  onStatusToggle,
}: CatalogueStatusFilterProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-9 gap-2',
            selectedStatuses.length > 0 && 'border-black bg-gray-50'
          )}
        >
          <Activity className="h-4 w-4" />
          Statut
          {selectedStatuses.length > 0 && (
            <Badge
              variant="secondary"
              className="bg-black text-white text-xs px-1.5 py-0"
            >
              {selectedStatuses.length}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <div className="p-2 space-y-1">
          {availableStatuses.map(status => {
            const isSelected = selectedStatuses.includes(status);
            const count = statusCounts.get(status) ?? 0;
            const label = STATUS_LABELS[status] ?? status;
            const icon = STATUS_ICONS[status] ?? '';
            return (
              <label
                key={status}
                className={cn(
                  'flex items-center gap-3 p-2 rounded cursor-pointer transition-colors',
                  isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'
                )}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onStatusToggle(status)}
                  className="h-4 w-4"
                />
                <span
                  className={cn('flex-1 text-sm', isSelected && 'font-medium')}
                >
                  {icon} {label}
                </span>
                <span className="text-xs text-gray-500">({count})</span>
              </label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
