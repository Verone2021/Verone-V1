import { Search } from 'lucide-react';

import { ButtonV2 } from '@verone/ui';
import { Card, CardContent } from '@verone/ui';
import { Input } from '@verone/ui';

import type { FilterRole, FilterType } from './types';

interface ContactsFiltersProps {
  searchTerm: string;
  filterType: FilterType;
  filterRole: FilterRole;
  onSearchChange: (value: string) => void;
  onFilterTypeChange: (value: FilterType) => void;
  onFilterRoleChange: (value: FilterRole) => void;
}

export function ContactsFilters({
  searchTerm,
  filterType,
  filterRole,
  onSearchChange,
  onFilterTypeChange,
  onFilterRoleChange,
}: ContactsFiltersProps) {
  return (
    <Card className="border">
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="Rechercher par nom, email, organisation..."
                className="pl-10"
                value={searchTerm}
                onChange={e => onSearchChange(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex gap-2">
              <ButtonV2
                variant={filterType === 'all' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => onFilterTypeChange('all')}
              >
                Tous
              </ButtonV2>
              <ButtonV2
                variant={filterType === 'supplier' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => onFilterTypeChange('supplier')}
              >
                Fournisseurs
              </ButtonV2>
              <ButtonV2
                variant={filterType === 'customer' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => onFilterTypeChange('customer')}
              >
                Clients Pro
              </ButtonV2>
            </div>
            <div className="flex gap-2">
              <ButtonV2
                variant={filterRole === 'all' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => onFilterRoleChange('all')}
              >
                Tous rôles
              </ButtonV2>
              <ButtonV2
                variant={filterRole === 'primary' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => onFilterRoleChange('primary')}
              >
                Principaux
              </ButtonV2>
              <ButtonV2
                variant={filterRole === 'commercial' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => onFilterRoleChange('commercial')}
              >
                Commercial
              </ButtonV2>
              <ButtonV2
                variant={filterRole === 'technical' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => onFilterRoleChange('technical')}
              >
                Technique
              </ButtonV2>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
