'use client';

import { ButtonV2 } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Input } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Search, Filter } from 'lucide-react';

interface PrixClientsFiltersProps {
  searchQuery: string;
  customerFilter: string;
  statusFilter: string;
  onSearchChange: (value: string) => void;
  onCustomerFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onReset: () => void;
}

export function PrixClientsFilters({
  searchQuery,
  customerFilter,
  statusFilter,
  onSearchChange,
  onCustomerFilterChange,
  onStatusFilterChange,
  onReset,
}: PrixClientsFiltersProps) {
  return (
    <Card className="border-black mb-6">
      <CardHeader>
        <CardTitle className="text-black flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Filtres
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher client, produit..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="flex-1"
            />
          </div>

          <Select value={customerFilter} onValueChange={onCustomerFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="Type client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="organization">Organisation</SelectItem>
              <SelectItem value="individual">Individuel</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="active">Actifs</SelectItem>
              <SelectItem value="inactive">Inactifs</SelectItem>
            </SelectContent>
          </Select>

          <ButtonV2
            variant="outline"
            onClick={onReset}
            className="border-black text-black hover:bg-black hover:text-white"
          >
            Réinitialiser
          </ButtonV2>
        </div>
      </CardContent>
    </Card>
  );
}
