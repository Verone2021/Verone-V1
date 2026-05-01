'use client';

import { useCallback, useState } from 'react';

import { useRouter } from 'next/navigation';

import type { Product } from '@verone/categories';
import type { QuickEditField } from '@verone/products';
import { Checkbox, ResponsiveDataView } from '@verone/ui';
import type { Database } from '@verone/types';

import {
  type SortField,
  type SortDir,
  SortableHeader,
} from './catalogue-list-helpers';
import { ProductCardMobile } from './CatalogueProductCardMobile';
import { ProductRow } from './CatalogueProductRow';

type ProductImage = Database['public']['Tables']['product_images']['Row'];

interface CatalogueListViewProps {
  products: Product[];
  activeTab?: 'active' | 'incomplete' | 'archived';
  getPrimaryImage?: (id: string) => ProductImage | null;
  getIncompletePrimaryImage?: (id: string) => ProductImage | null;
  onQuickEdit?: (product: Product, field: QuickEditField) => void;
  selectable?: boolean;
  isSelected?: (id: string) => boolean;
  allSelected?: boolean;
  someSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onToggleAll?: () => void;
}

export function CatalogueListView({
  products,
  activeTab = 'active',
  getPrimaryImage,
  getIncompletePrimaryImage,
  onQuickEdit,
  selectable = false,
  isSelected,
  allSelected = false,
  someSelected = false,
  onToggleSelect,
  onToggleAll,
}: CatalogueListViewProps) {
  const router = useRouter();
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDir('asc');
      }
    },
    [sortField]
  );

  const handleRowClick = useCallback(
    (productId: string) => {
      router.push(`/produits/catalogue/${productId}`);
    },
    [router]
  );

  const sortedProducts = [...products].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    switch (sortField) {
      case 'name':
        return dir * (a.name ?? '').localeCompare(b.name ?? '');
      case 'supplier': {
        const sa = a.supplier?.trade_name ?? a.supplier?.legal_name ?? '';
        const sb = b.supplier?.trade_name ?? b.supplier?.legal_name ?? '';
        return dir * sa.localeCompare(sb);
      }
      case 'subcategory': {
        const ca = a.subcategories?.name ?? '';
        const cb = b.subcategories?.name ?? '';
        return dir * ca.localeCompare(cb);
      }
      case 'weight':
        return dir * ((a.weight ?? 0) - (b.weight ?? 0));
      case 'stock_real':
        return dir * ((a.stock_real ?? 0) - (b.stock_real ?? 0));
      case 'cost_price':
        return dir * ((a.cost_price ?? 0) - (b.cost_price ?? 0));
      case 'margin_percentage':
        return dir * ((a.margin_percentage ?? 0) - (b.margin_percentage ?? 0));
      case 'completion_percentage':
        return (
          dir *
          ((a.completion_percentage ?? 0) - (b.completion_percentage ?? 0))
        );
      case 'product_status':
        return (
          dir * (a.product_status ?? '').localeCompare(b.product_status ?? '')
        );
      default:
        return 0;
    }
  });

  const resolvePreloadedImage = (productId: string): ProductImage | null => {
    if (activeTab === 'active') return getPrimaryImage?.(productId) ?? null;
    if (activeTab === 'incomplete')
      return getIncompletePrimaryImage?.(productId) ?? null;
    return null;
  };

  return (
    <ResponsiveDataView
      data={sortedProducts}
      breakpoint="md"
      emptyMessage="Aucun produit à afficher"
      renderTable={items => (
        <div className="border border-gray-200 rounded-lg bg-white">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {selectable && (
                  <th className="py-2 px-2 w-10">
                    <Checkbox
                      checked={
                        allSelected
                          ? true
                          : someSelected
                            ? 'indeterminate'
                            : false
                      }
                      onCheckedChange={() => onToggleAll?.()}
                      aria-label={
                        allSelected
                          ? 'Tout désélectionner'
                          : 'Tout sélectionner'
                      }
                    />
                  </th>
                )}
                <th className="py-2 px-2 w-12 text-xs font-semibold text-gray-500 uppercase">
                  Photo
                </th>
                <SortableHeader
                  label="Produit"
                  field="name"
                  currentSort={sortField}
                  currentDir={sortDir}
                  onSort={handleSort}
                  className="min-w-[180px]"
                />
                <SortableHeader
                  label="Fournisseur"
                  field="supplier"
                  currentSort={sortField}
                  currentDir={sortDir}
                  onSort={handleSort}
                  className="hidden lg:table-cell"
                />
                <SortableHeader
                  label="Sous-cat."
                  field="subcategory"
                  currentSort={sortField}
                  currentDir={sortDir}
                  onSort={handleSort}
                  className="hidden xl:table-cell"
                />
                <SortableHeader
                  label="Poids"
                  field="weight"
                  currentSort={sortField}
                  currentDir={sortDir}
                  onSort={handleSort}
                  className="text-right hidden 2xl:table-cell"
                />
                <th className="py-2 px-2 text-xs font-semibold text-gray-500 uppercase text-center hidden 2xl:table-cell">
                  Dimensions
                </th>
                <SortableHeader
                  label="Stock"
                  field="stock_real"
                  currentSort={sortField}
                  currentDir={sortDir}
                  onSort={handleSort}
                  className="text-right"
                />
                <SortableHeader
                  label="Prix HT"
                  field="cost_price"
                  currentSort={sortField}
                  currentDir={sortDir}
                  onSort={handleSort}
                  className="text-right"
                />
                <SortableHeader
                  label="Marge"
                  field="margin_percentage"
                  currentSort={sortField}
                  currentDir={sortDir}
                  onSort={handleSort}
                  className="text-right hidden lg:table-cell"
                />
                <SortableHeader
                  label="Compl."
                  field="completion_percentage"
                  currentSort={sortField}
                  currentDir={sortDir}
                  onSort={handleSort}
                  className="text-center hidden xl:table-cell"
                />
                <SortableHeader
                  label="Statut"
                  field="product_status"
                  currentSort={sortField}
                  currentDir={sortDir}
                  onSort={handleSort}
                />
              </tr>
            </thead>
            <tbody>
              {items.map(product => (
                <ProductRow
                  key={product.id}
                  product={product}
                  preloadedImage={resolvePreloadedImage(product.id)}
                  onQuickEdit={onQuickEdit}
                  onRowClick={handleRowClick}
                  selectable={selectable}
                  selected={isSelected?.(product.id) ?? false}
                  onToggleSelect={onToggleSelect}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
      renderCard={product => (
        <ProductCardMobile
          key={product.id}
          product={product}
          preloadedImage={resolvePreloadedImage(product.id)}
          onQuickEdit={onQuickEdit}
          onCardClick={handleRowClick}
          selectable={selectable}
          selected={isSelected?.(product.id) ?? false}
          onToggleSelect={onToggleSelect}
        />
      )}
    />
  );
}
