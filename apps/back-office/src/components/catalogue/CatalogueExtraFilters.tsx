'use client';

import {
  Badge,
  Button,
  Checkbox,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@verone/ui';
import { cn } from '@verone/utils';
import { ChevronDown, PackageCheck, Sparkles, BarChart3 } from 'lucide-react';

interface FilterOption {
  key: string;
  label: string;
}

interface DropdownFilterProps {
  label: string;
  icon: React.ReactNode;
  options: FilterOption[];
  selected: string[];
  onToggle: (key: string) => void;
}

function DropdownFilter({
  label,
  icon,
  options,
  selected,
  onToggle,
}: DropdownFilterProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-9 gap-2',
            selected.length > 0 && 'border-black bg-gray-50'
          )}
        >
          {icon}
          {label}
          {selected.length > 0 && (
            <Badge
              variant="secondary"
              className="bg-black text-white text-xs px-1.5 py-0"
            >
              {selected.length}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <div className="p-2 space-y-1">
          {options.map(opt => {
            const isSelected = selected.includes(opt.key);
            return (
              <label
                key={opt.key}
                className={cn(
                  'flex items-center gap-3 p-2 rounded cursor-pointer transition-colors',
                  isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'
                )}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggle(opt.key)}
                  className="h-4 w-4"
                />
                <span
                  className={cn('flex-1 text-sm', isSelected && 'font-medium')}
                >
                  {opt.label}
                </span>
              </label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const STOCK_OPTIONS: FilterOption[] = [
  { key: 'in_stock', label: 'En stock (> 10)' },
  { key: 'low_stock', label: 'Stock bas (1-10)' },
  { key: 'out_of_stock', label: 'Rupture (0)' },
];

const CONDITION_OPTIONS: FilterOption[] = [
  { key: 'new', label: 'Neuf' },
  { key: 'refurbished', label: 'Reconditionne' },
  { key: 'used', label: 'Occasion' },
];

const COMPLETION_OPTIONS: FilterOption[] = [
  { key: 'high', label: 'Complete (> 80%)' },
  { key: 'medium', label: 'Partiel (50-80%)' },
  { key: 'low', label: 'Incomplet (< 50%)' },
];

interface CatalogueExtraFiltersProps {
  stockLevels: string[];
  conditions: string[];
  completionLevels: string[];
  onStockToggle: (key: string) => void;
  onConditionToggle: (key: string) => void;
  onCompletionToggle: (key: string) => void;
}

export function CatalogueExtraFilters({
  stockLevels,
  conditions,
  completionLevels,
  onStockToggle,
  onConditionToggle,
  onCompletionToggle,
}: CatalogueExtraFiltersProps) {
  return (
    <>
      <DropdownFilter
        label="Stock"
        icon={<PackageCheck className="h-4 w-4" />}
        options={STOCK_OPTIONS}
        selected={stockLevels}
        onToggle={onStockToggle}
      />
      <DropdownFilter
        label="Condition"
        icon={<Sparkles className="h-4 w-4" />}
        options={CONDITION_OPTIONS}
        selected={conditions}
        onToggle={onConditionToggle}
      />
      <DropdownFilter
        label="Completude"
        icon={<BarChart3 className="h-4 w-4" />}
        options={COMPLETION_OPTIONS}
        selected={completionLevels}
        onToggle={onCompletionToggle}
      />
    </>
  );
}
