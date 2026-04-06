'use client';

import { SupplierSelector } from '@verone/products/components/sourcing/supplier-selector';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { colors } from '@verone/ui/design-system';
import { Search } from 'lucide-react';

interface SourcingFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  sourcingTypeFilter: string;
  onSourcingTypeChange: (value: string) => void;
  supplierFilter: string | null;
  onSupplierChange: (id: string | null) => void;
}

export function SourcingFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  sourcingTypeFilter,
  onSourcingTypeChange,
  supplierFilter,
  onSupplierChange,
}: SourcingFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle style={{ color: colors.text.DEFAULT }}>
          Filtres et Recherche
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-3 h-4 w-4"
              style={{ color: colors.text.muted }}
            />
            <Input
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={e => onSearchChange(e.target.value)}
              className="pl-10"
              style={{ borderColor: colors.border.DEFAULT }}
            />
          </div>

          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger style={{ borderColor: colors.border.DEFAULT }}>
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="draft">En sourcing</SelectItem>
              <SelectItem value="preorder">Échantillon commandé</SelectItem>
              <SelectItem value="active">Au catalogue</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sourcingTypeFilter}
            onValueChange={onSourcingTypeChange}
          >
            <SelectTrigger style={{ borderColor: colors.border.DEFAULT }}>
              <SelectValue placeholder="Type sourcing" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="client">Client</SelectItem>
              <SelectItem value="interne">Interne</SelectItem>
            </SelectContent>
          </Select>

          <SupplierSelector
            selectedSupplierId={supplierFilter}
            onSupplierChange={onSupplierChange}
            label=""
            placeholder="Tous les fournisseurs"
            required={false}
          />
        </div>
      </CardContent>
    </Card>
  );
}
