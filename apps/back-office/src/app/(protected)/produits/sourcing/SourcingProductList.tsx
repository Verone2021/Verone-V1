'use client';

import { useMemo } from 'react';

import type { SourcingProduct } from '@verone/products';
import type { SourcingListSegment } from '@verone/products/utils';
import {
  Card,
  CardContent,
  Checkbox,
  ResponsiveDataView,
  cn,
} from '@verone/ui';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Package,
} from 'lucide-react';

import { useProductsWithHistory } from '@/hooks/use-products-with-history';

import type { SourcingProductActionHandlers } from './SourcingProductActions';
import { SourcingProductCard } from './SourcingProductCard';
import { SourcingProductRow } from './SourcingProductRow';

interface SourcingProductListProps {
  products: SourcingProduct[];
  segment: SourcingListSegment;
  loading: boolean;
  error: string | null;
  onView: (id: string) => void;
  onViewSupplier: (supplierId: string) => void;
  onEdit: (id: string) => void;
  onValidate: (id: string) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  /** Sélection multiple, pour commander plusieurs échantillons d'un coup. */
  selectable?: boolean;
  selectedIds?: string[];
  onToggleSelect?: (productId: string) => void;
  onToggleAll?: (productIds: string[], selectAll: boolean) => void;
}

const HEADER = 'p-3 font-medium text-xs uppercase tracking-wider text-gray-500';

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
        HEADER,
        'cursor-pointer select-none hover:text-black',
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
  segment,
  loading,
  error,
  onView,
  onViewSupplier,
  onEdit,
  onValidate,
  onArchive,
  onRestore,
  onDelete,
  sortBy,
  sortDir,
  onSort,
  selectable = false,
  selectedIds = [],
  onToggleSelect,
  onToggleAll,
}: SourcingProductListProps) {
  // « Supprimer » n'existe que pour les produits retirés : on ne vérifie qu'eux.
  const archivedIds = useMemo(
    () => products.filter(p => p.archived_at).map(p => p.id),
    [products]
  );
  const { canDelete } = useProductsWithHistory(archivedIds);

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-500" />
          <p className="text-sm text-red-600">Erreur : {error}</p>
        </CardContent>
      </Card>
    );
  }

  const handlersFor = (
    product: SourcingProduct
  ): SourcingProductActionHandlers => {
    const supplierId = product.supplier_id;
    return {
      onView: () => onView(product.id),
      onViewSupplier: supplierId ? () => onViewSupplier(supplierId) : undefined,
      onEdit: () => onEdit(product.id),
      onValidate: () => onValidate(product.id),
      onArchive: () => onArchive(product.id),
      onRestore: () => onRestore(product.id),
      onDelete: () => onDelete(product.id),
    };
  };

  return (
    <ResponsiveDataView
      data={products}
      loading={loading}
      emptyMessage={
        <div className="text-center">
          <Package className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="text-gray-500">Aucun produit</p>
          <p className="mt-1 text-sm text-gray-400">
            Modifiez vos filtres ou créez un nouveau sourcing
          </p>
        </div>
      }
      renderTable={items => (
        <Card>
          <CardContent className="p-0">
            <div className="w-full overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-50/80">
                  <tr className="text-left">
                    {selectable && (
                      <th className={cn(HEADER, 'w-[44px]')}>
                        <Checkbox
                          checked={
                            items.length > 0 &&
                            items.every(p => selectedIds.includes(p.id))
                          }
                          onCheckedChange={checked =>
                            onToggleAll?.(
                              items.map(p => p.id),
                              checked === true
                            )
                          }
                          aria-label="Tout sélectionner"
                        />
                      </th>
                    )}
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
                      className="hidden lg:table-cell"
                    />
                    <SortableHeader
                      label="Prix"
                      column="cost_price"
                      currentSort={sortBy}
                      currentDir={sortDir}
                      onSort={onSort}
                      className="text-right"
                    />
                    <th className={HEADER}>Étape</th>
                    <th
                      className={cn(HEADER, 'hidden text-center xl:table-cell')}
                    >
                      Type
                    </th>
                    <SortableHeader
                      label="Date"
                      column="created_at"
                      currentSort={sortBy}
                      currentDir={sortDir}
                      onSort={onSort}
                      className="hidden text-right xl:table-cell"
                    />
                    <th className={cn(HEADER, 'text-right')}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(product => (
                    <SourcingProductRow
                      key={product.id}
                      product={product}
                      segment={segment}
                      canDelete={canDelete(product.id)}
                      selectable={selectable}
                      selected={selectedIds.includes(product.id)}
                      onToggleSelect={() => onToggleSelect?.(product.id)}
                      {...handlersFor(product)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t bg-gray-50/50 px-4 py-2 text-xs text-gray-500">
              {items.length} produit{items.length > 1 ? 's' : ''}
            </div>
          </CardContent>
        </Card>
      )}
      renderCard={product => (
        <SourcingProductCard
          product={product}
          segment={segment}
          canDelete={canDelete(product.id)}
          selectable={selectable}
          selected={selectedIds.includes(product.id)}
          onToggleSelect={() => onToggleSelect?.(product.id)}
          {...handlersFor(product)}
        />
      )}
    />
  );
}
