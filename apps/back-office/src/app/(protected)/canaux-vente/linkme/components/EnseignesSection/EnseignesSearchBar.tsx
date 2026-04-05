'use client';

import { ButtonV2, Input } from '@verone/ui';
import { Search } from 'lucide-react';

interface EnseignesSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'all' | 'active' | 'inactive';
  onStatusFilterChange: (value: 'all' | 'active' | 'inactive') => void;
  placeholder: string;
}

export function EnseignesSearchBar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  placeholder,
}: EnseignesSearchBarProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="flex gap-2">
        <ButtonV2
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onStatusFilterChange('all')}
        >
          Toutes
        </ButtonV2>
        <ButtonV2
          variant={statusFilter === 'active' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onStatusFilterChange('active')}
        >
          Actives
        </ButtonV2>
        <ButtonV2
          variant={statusFilter === 'inactive' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onStatusFilterChange('inactive')}
        >
          Inactives
        </ButtonV2>
      </div>
    </div>
  );
}
