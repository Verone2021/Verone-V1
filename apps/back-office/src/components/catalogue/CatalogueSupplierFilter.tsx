'use client';

import type { Organisation } from '@verone/organisations';
import { Badge } from '@verone/ui';
import { Button } from '@verone/ui';
import { Checkbox } from '@verone/ui';
import { Popover, PopoverContent, PopoverTrigger } from '@verone/ui';
import { ScrollArea } from '@verone/ui';
import { cn } from '@verone/utils';
import { Building2, ChevronDown } from 'lucide-react';

interface CatalogueSupplierFilterProps {
  suppliersWithProducts: Organisation[];
  selectedSuppliers: string[];
  onSupplierToggle: (id: string) => void;
}

export function CatalogueSupplierFilter({
  suppliersWithProducts,
  selectedSuppliers,
  onSupplierToggle,
}: CatalogueSupplierFilterProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-9 gap-2',
            selectedSuppliers.length > 0 && 'border-black bg-gray-50'
          )}
        >
          <Building2 className="h-4 w-4" />
          Fournisseurs
          {selectedSuppliers.length > 0 && (
            <Badge
              variant="secondary"
              className="bg-black text-white text-xs px-1.5 py-0"
            >
              {selectedSuppliers.length}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="start">
        <ScrollArea className="h-64">
          <div className="p-2 space-y-1">
            {suppliersWithProducts.map(supplier => {
              const isSelected = selectedSuppliers.includes(supplier.id);
              const count = supplier._count?.products ?? 0;
              return (
                <label
                  key={supplier.id}
                  className={cn(
                    'flex items-center gap-3 p-2 rounded cursor-pointer transition-colors',
                    isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'
                  )}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onSupplierToggle(supplier.id)}
                    className="h-4 w-4"
                  />
                  <span
                    className={cn(
                      'flex-1 text-sm truncate',
                      isSelected && 'font-medium'
                    )}
                  >
                    {supplier.name}
                  </span>
                  <span className="text-xs text-gray-500">({count})</span>
                </label>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
