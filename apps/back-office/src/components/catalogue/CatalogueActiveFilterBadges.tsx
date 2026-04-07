'use client';

import type { Organisation } from '@verone/organisations';
import { Badge } from '@verone/ui';
import { X } from 'lucide-react';

import type {
  Category,
  Family,
  FilterState,
  Subcategory,
} from './catalogue-filter.types';
import { STATUS_ICONS, STATUS_LABELS } from './catalogue-filter.types';

interface CatalogueActiveFilterBadgesProps {
  filters: FilterState;
  families: Family[];
  categories: Category[];
  subcategories: Subcategory[];
  suppliers: Organisation[];
  onFamilyToggle: (id: string) => void;
  onCategoryToggle: (id: string) => void;
  onSubcategoryToggle: (id: string) => void;
  onSupplierToggle: (id: string) => void;
  onStatusToggle: (status: string) => void;
}

export function CatalogueActiveFilterBadges({
  filters,
  families,
  categories,
  subcategories,
  suppliers,
  onFamilyToggle,
  onCategoryToggle,
  onSubcategoryToggle,
  onSupplierToggle,
  onStatusToggle,
}: CatalogueActiveFilterBadgesProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {filters.families.map(famId => {
        const fam = families.find(f => f.id === famId);
        return fam ? (
          <Badge
            key={`fam-${famId}`}
            variant="secondary"
            className="text-xs cursor-pointer hover:bg-gray-200 gap-1"
            onClick={() => onFamilyToggle(famId)}
          >
            {fam.name}
            <X className="h-3 w-3" />
          </Badge>
        ) : null;
      })}
      {filters.categories.map(catId => {
        const cat = categories.find(c => c.id === catId);
        return cat ? (
          <Badge
            key={`cat-${catId}`}
            variant="outline"
            className="text-xs cursor-pointer hover:bg-blue-100 gap-1 border-blue-300 text-blue-800"
            onClick={() => onCategoryToggle(catId)}
          >
            {cat.name}
            <X className="h-3 w-3" />
          </Badge>
        ) : null;
      })}
      {filters.subcategories.map(subId => {
        const sub = subcategories.find(s => s.id === subId);
        return sub ? (
          <Badge
            key={`sub-${subId}`}
            variant="outline"
            className="text-xs cursor-pointer hover:bg-gray-200 gap-1"
            onClick={() => onSubcategoryToggle(subId)}
          >
            {sub.name}
            <X className="h-3 w-3" />
          </Badge>
        ) : null;
      })}
      {filters.suppliers.map(suppId => {
        const supp = suppliers.find(s => s.id === suppId);
        return supp ? (
          <Badge
            key={`supp-${suppId}`}
            variant="outline"
            className="text-xs cursor-pointer hover:bg-gray-200 gap-1"
            onClick={() => onSupplierToggle(suppId)}
          >
            {supp.name}
            <X className="h-3 w-3" />
          </Badge>
        ) : null;
      })}
      {filters.statuses.map(status => {
        const label = STATUS_LABELS[status] ?? status;
        const icon = STATUS_ICONS[status] ?? '';
        return (
          <Badge
            key={`status-${status}`}
            variant="outline"
            className="text-xs cursor-pointer hover:bg-gray-200 gap-1"
            onClick={() => onStatusToggle(status)}
          >
            {icon} {label}
            <X className="h-3 w-3" />
          </Badge>
        );
      })}
    </div>
  );
}
