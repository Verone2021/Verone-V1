'use client';

/**
 * PriceProductSelector - Section de sélection de produit
 * Sub-component of PriceListItemFormModal
 */

import { Search } from 'lucide-react';

import { ButtonV2 } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Input } from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { formatCurrency } from '@verone/utils';

export interface SelectedProduct {
  id: string;
  name: string;
  sku: string;
  price_ht: number;
}

interface PriceProductSelectorProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  products: SelectedProduct[] | undefined;
  onSelect: (product: SelectedProduct) => void;
}

export function PriceProductSelector({
  searchTerm,
  onSearchChange,
  products,
  onSelect,
}: PriceProductSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">1. Sélectionner le Produit</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher par nom ou SKU..."
              value={searchTerm}
              onChange={e => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {products && products.length > 0 && (
            <div className="max-h-64 overflow-y-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Prix Catalogue</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product: SelectedProduct) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        {product.name}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{product.sku}</span>
                      </TableCell>
                      <TableCell>{formatCurrency(product.price_ht)}</TableCell>
                      <TableCell>
                        <ButtonV2
                          type="button"
                          size="sm"
                          onClick={() => onSelect(product)}
                        >
                          Sélectionner
                        </ButtonV2>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
