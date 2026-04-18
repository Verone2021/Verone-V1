'use client';

import Image from 'next/image';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Card, CardContent } from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { formatPrice } from '@verone/utils';
import { StockDisplay } from '@verone/stock';
import {
  History,
  Plus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

import type { ProductWithStock } from './types';

interface StocksProductTableProps {
  products: ProductWithStock[];
  loading: boolean;
  onAddMovement: (product: ProductWithStock) => void;
  onShowHistory: (product: ProductWithStock) => void;
}

export function StocksProductTable({
  products,
  loading,
  onAddMovement,
  onShowHistory,
}: StocksProductTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produit</TableHead>
              <TableHead className="hidden lg:table-cell">SKU</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="hidden xl:table-cell">Prévisions</TableHead>
              <TableHead className="hidden xl:table-cell">Disponible</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Chargement des données...
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-gray-500"
                >
                  Aucun produit trouvé
                </TableCell>
              </TableRow>
            ) : (
              products.map(product => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {product.primary_image_url && (
                        <Image
                          src={product.primary_image_url}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="rounded object-cover"
                        />
                      )}
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-600">
                          {formatPrice(
                            (product['minimumSellingPrice'] as
                              | number
                              | undefined) ??
                              (product['price_ttc'] as number | undefined) ??
                              0
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm hidden lg:table-cell">
                    {product.sku}
                  </TableCell>
                  <TableCell>
                    <StockDisplay
                      stock_real={product.stock_real}
                      min_stock={5}
                      size="sm"
                    />
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <div className="flex items-center gap-2 text-sm">
                      {product.stock_forecasted_in > 0 && (
                        <span className="flex items-center gap-1 text-green-600">
                          <TrendingUp className="h-3 w-3" />+
                          {product.stock_forecasted_in}
                        </span>
                      )}
                      {product.stock_forecasted_out > 0 && (
                        <span className="flex items-center gap-1 text-red-600">
                          <TrendingDown className="h-3 w-3" />-
                          {product.stock_forecasted_out}
                        </span>
                      )}
                      {product.stock_forecasted_in === 0 &&
                        product.stock_forecasted_out === 0 && (
                          <span className="text-gray-400">-</span>
                        )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <Badge
                      variant={
                        product.stock_available <= 5 ? 'destructive' : 'default'
                      }
                    >
                      {product.stock_available}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <ButtonV2
                        variant="outline"
                        size="sm"
                        onClick={() => onAddMovement(product)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Mouvement
                      </ButtonV2>
                      <ButtonV2
                        variant="outline"
                        size="sm"
                        onClick={() => onShowHistory(product)}
                      >
                        <History className="h-4 w-4" />
                      </ButtonV2>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
