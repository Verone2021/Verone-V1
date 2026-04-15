'use client';

import type { SourcingProduct } from '@verone/products';
import { Card, CardContent } from '@verone/ui';
import { cn } from '@verone/ui';
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

function SortableHeader({
  label,
  column,
  currentSort,
  currentDir,
  onSort,
  className,
}: {
  label: string;
  column: string;
  currentSort?: string;
  currentDir?: 'asc' | 'desc';
  onSort?: (col: string) => void;
  className?: string;
}) {
  const isActive = currentSort === column;
  return (
    <th
      className={cn(
        'p-3 font-medium text-xs uppercase tracking-wider text-gray-500 cursor-pointer hover:text-black select-none',
        isActive && 'text-black',
        className
      )}
      onClick={() => onSort?.(column)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive ? (
          currentDir === 'asc' ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </span>
    </th>
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
  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Chargement des produits...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-3 text-red-500" />
          <p className="text-red-600 text-sm">Erreur: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Package className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">Aucun produit trouvé</p>
          <p className="text-xs text-gray-400 mt-1">
            Modifiez vos filtres ou créez un nouveau sourcing
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50/80">
              <tr className="text-left">
                <SortableHeader
                  label="Produit"
                  column="name"
                  currentSort={sortBy}
                  currentDir={sortDir}
                  onSort={onSort}
                />
                <SortableHeader
                  label="Fournisseur"
                  column="supplier"
                  currentSort={sortBy}
                  currentDir={sortDir}
                  onSort={onSort}
                />
                <SortableHeader
                  label="Prix"
                  column="cost_price"
                  currentSort={sortBy}
                  currentDir={sortDir}
                  onSort={onSort}
                  className="text-right"
                />
                <th className="p-3 font-medium text-xs uppercase tracking-wider text-gray-500 text-center">
                  Statut
                </th>
                <th className="p-3 font-medium text-xs uppercase tracking-wider text-gray-500 text-center">
                  Type
                </th>
                <SortableHeader
                  label="Date"
                  column="created_at"
                  currentSort={sortBy}
                  currentDir={sortDir}
                  onSort={onSort}
                  className="text-right"
                />
                <th className="p-3 font-medium text-xs uppercase tracking-wider text-gray-500 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
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
            </tbody>
          </table>
        </div>
        <div className="border-t bg-gray-50/50 px-4 py-2 text-xs text-gray-500">
          {products.length} produit{products.length > 1 ? 's' : ''}
        </div>
      </CardContent>
    </Card>
  );
}
