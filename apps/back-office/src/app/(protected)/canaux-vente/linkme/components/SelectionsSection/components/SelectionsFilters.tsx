'use client';

import { Input } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Search } from 'lucide-react';

interface SelectionsFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  affiliateFilter: string;
  onAffiliateFilterChange: (value: string) => void;
  affiliates: { id: string; display_name: string }[];
}

export function SelectionsFilters({
  searchTerm,
  onSearchChange,
  affiliateFilter,
  onAffiliateFilterChange,
  affiliates,
}: SelectionsFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher une sélection..."
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <Select value={affiliateFilter} onValueChange={onAffiliateFilterChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Affilié" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les affiliés</SelectItem>
          {affiliates.map(affiliate => (
            <SelectItem key={affiliate.id} value={affiliate.id}>
              {affiliate.display_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
