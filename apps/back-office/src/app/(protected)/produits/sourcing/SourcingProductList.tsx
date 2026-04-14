'use client';

import type { SourcingProduct } from '@verone/products';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { cn } from '@verone/ui';
import { colors } from '@verone/ui/design-system';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Package,
} from 'lucide-react';

import { SourcingProductRow } from './SourcingProductRow';

interface SourcingProductListProps {
  products: SourcingProduct[];
  loading: boolean;
  error: string | null;
  onView: (id: string) => void;
  onViewSupplier: (supplierId: string) => void;
  onEdit: (id: string) => void;
  onValidate: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (column: string) => void;
}

function SortIcon({
  column,
  currentSort,
  currentDir,
}: {
  column: string;
  currentSort?: string;
  currentDir?: 'asc' | 'desc';
}) {
  if (currentSort !== column)
    return <ArrowUpDown className="h-3 w-3 text-gray-300" />;
  return currentDir === 'asc' ? (
    <ArrowUp className="h-3 w-3 text-black" />
  ) : (
    <ArrowDown className="h-3 w-3 text-black" />
  );
}

export function SourcingProductList({
  products,
  loading,
  error,
  onView,
  onViewSupplier,
  onEdit,
  onValidate,
  onArchive,
  onDelete,
  sortBy,
  sortDir,
  onSort,
}: SourcingProductListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle style={{ color: colors.text.DEFAULT }}>
          Produits à Sourcer ({products.length})
        </CardTitle>
        <CardDescription>
          Liste complète des demandes de sourcing
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Sort headers */}
        {onSort && !loading && products.length > 0 && (
          <div className="flex items-center gap-4 pb-3 mb-3 border-b border-gray-200 text-xs text-gray-500">
            <span className="w-10" />
            <button
              onClick={() => onSort('name')}
              className={cn(
                'flex items-center gap-1 hover:text-black',
                sortBy === 'name' && 'text-black font-medium'
              )}
            >
              Nom{' '}
              <SortIcon
                column="name"
                currentSort={sortBy}
                currentDir={sortDir}
              />
            </button>
            <button
              onClick={() => onSort('supplier')}
              className={cn(
                'flex items-center gap-1 hover:text-black ml-auto',
                sortBy === 'supplier' && 'text-black font-medium'
              )}
            >
              Fournisseur{' '}
              <SortIcon
                column="supplier"
                currentSort={sortBy}
                currentDir={sortDir}
              />
            </button>
            <button
              onClick={() => onSort('created_at')}
              className={cn(
                'flex items-center gap-1 hover:text-black',
                sortBy === 'created_at' && 'text-black font-medium'
              )}
            >
              Date{' '}
              <SortIcon
                column="created_at"
                currentSort={sortBy}
                currentDir={sortDir}
              />
            </button>
            <button
              onClick={() => onSort('cost_price')}
              className={cn(
                'flex items-center gap-1 hover:text-black',
                sortBy === 'cost_price' && 'text-black font-medium'
              )}
            >
              Prix{' '}
              <SortIcon
                column="cost_price"
                currentSort={sortBy}
                currentDir={sortDir}
              />
            </button>
          </div>
        )}
        {loading && (
          <div className="text-center py-8">
            <Package
              className="h-12 w-12 mx-auto mb-4 animate-spin"
              style={{ color: colors.text.muted }}
            />
            <p style={{ color: colors.text.subtle }}>
              Chargement des produits...
            </p>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <AlertCircle
              className="h-12 w-12 mx-auto mb-4"
              style={{ color: colors.danger[500] }}
            />
            <p style={{ color: colors.danger[500] }}>Erreur: {error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            {products.map(product => (
              <SourcingProductRow
                key={product.id}
                product={product}
                onView={() => onView(product.id)}
                onViewSupplier={
                  product.supplier_id
                    ? () => onViewSupplier(product.supplier_id!)
                    : undefined
                }
                onEdit={() => onEdit(product.id)}
                onValidate={() => onValidate(product.id)}
                onArchive={() => onArchive(product.id)}
                onDelete={() => onDelete(product.id)}
              />
            ))}

            {products.length === 0 && (
              <div className="text-center py-8">
                <Package
                  className="h-12 w-12 mx-auto mb-4"
                  style={{ color: colors.text.muted }}
                />
                <p style={{ color: colors.text.subtle }}>
                  Aucun produit trouvé
                </p>
                <p className="text-sm" style={{ color: colors.text.muted }}>
                  Essayez de modifier vos filtres ou créez votre premier produit
                  sourcing
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
