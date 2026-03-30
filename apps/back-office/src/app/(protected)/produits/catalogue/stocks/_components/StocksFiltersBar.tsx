'use client';

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
import { ArrowUpDown } from 'lucide-react';

import type { StockFilters } from './types';

interface StocksFiltersBarProps {
  filters: StockFilters;
  onFiltersChange: (filters: StockFilters) => void;
}

export function StocksFiltersBar({
  filters,
  onFiltersChange,
}: StocksFiltersBarProps) {
  const update = (patch: Partial<StockFilters>) =>
    onFiltersChange({ ...filters, ...patch });

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Rechercher un produit..."
              value={filters.search}
              onChange={e => update({ search: e.target.value })}
              className="w-full"
            />
          </div>
          <Select
            value={filters.status}
            onValueChange={(value: StockFilters['status']) =>
              update({ status: value })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Statut stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="in_stock">En stock</SelectItem>
              <SelectItem value="low_stock">Stock faible</SelectItem>
              <SelectItem value="out_of_stock">Épuisé</SelectItem>
              <SelectItem value="forecasted_shortage">
                Rupture prévue
              </SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.sortBy}
            onValueChange={(value: StockFilters['sortBy']) =>
              update({ sortBy: value })
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nom</SelectItem>
              <SelectItem value="sku">SKU</SelectItem>
              <SelectItem value="stock_real">Stock physique</SelectItem>
              <SelectItem value="stock_available">Stock disponible</SelectItem>
            </SelectContent>
          </Select>
          <ButtonV2
            variant="outline"
            size="sm"
            onClick={() =>
              update({
                sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc',
              })
            }
          >
            <ArrowUpDown className="h-4 w-4" />
          </ButtonV2>
        </div>
      </CardContent>
    </Card>
  );
}
