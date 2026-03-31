'use client';

import { ArrowUpDown, Search } from 'lucide-react';

import { ButtonV2 } from '@verone/ui';
import { Card, CardContent } from '@verone/ui';
import { Input } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';

import type { MetaFilters } from './types';

interface MetaFiltersBarProps {
  filters: MetaFilters;
  onFiltersChange: (filters: MetaFilters) => void;
  resultCount: number;
}

export function MetaFiltersBar({
  filters,
  onFiltersChange,
  resultCount,
}: MetaFiltersBarProps) {
  const update = (patch: Partial<MetaFilters>) =>
    onFiltersChange({ ...filters, ...patch });

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou SKU..."
              value={filters.search}
              onChange={e => update({ search: e.target.value })}
              className="pl-10"
            />
          </div>

          <Select
            value={filters.status}
            onValueChange={(v: MetaFilters['status']) => update({ status: v })}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Statut Meta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="rejected">Rejete</SelectItem>
              <SelectItem value="error">Erreur</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.sortBy}
            onValueChange={(v: MetaFilters['sortBy']) => update({ sortBy: v })}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nom</SelectItem>
              <SelectItem value="sku">SKU</SelectItem>
              <SelectItem value="price">Prix</SelectItem>
              <SelectItem value="status">Statut</SelectItem>
              <SelectItem value="synced_at">Date sync</SelectItem>
            </SelectContent>
          </Select>

          <ButtonV2
            variant="outline"
            size="icon"
            onClick={() =>
              update({
                sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc',
              })
            }
            title={filters.sortOrder === 'asc' ? 'Croissant' : 'Decroissant'}
          >
            <ArrowUpDown className="h-4 w-4" />
          </ButtonV2>

          <span className="text-sm text-muted-foreground ml-auto">
            {resultCount} produit{resultCount > 1 ? 's' : ''}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
