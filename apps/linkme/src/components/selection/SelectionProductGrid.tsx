'use client';

import { useState, useMemo } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import {
  Package,
  Plus,
  Edit3,
  Trash2,
  Loader2,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import type { SelectionItem } from '../../lib/hooks/use-user-selection';
import { formatCurrency } from '../../types/analytics';
import { StockBadge } from './StockBadge';

const ITEMS_PER_PAGE = 18;

interface SelectionProductGridProps {
  items: SelectionItem[];
  isLoading: boolean;
  onEdit?: (item: SelectionItem) => void;
  onRemove?: (item: SelectionItem) => void;
  deletingItemId?: string | null;
  searchQuery?: string;
  hasActiveFilters?: boolean;
  onResetFilters?: () => void;
}

export function SelectionProductGrid({
  items,
  isLoading,
  onEdit,
  onRemove,
  deletingItemId,
  searchQuery = '',
  hasActiveFilters = false,
  onResetFilters,
}: SelectionProductGridProps): React.JSX.Element {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when items change (filter change)
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const safePage = Math.min(currentPage, Math.max(1, totalPages));

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  }, [items, safePage]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <Loader2 className="h-8 w-8 text-linkme-turquoise animate-spin mx-auto" />
        <p className="text-linkme-marine/60 text-sm mt-3">
          Chargement des produits...
        </p>
      </div>
    );
  }

  if (paginatedItems.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-linkme-turquoise/10 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="h-8 w-8 text-linkme-turquoise" />
        </div>
        <h3 className="text-lg font-semibold text-linkme-marine mb-2">
          {hasActiveFilters
            ? 'Aucun produit trouvé'
            : 'Aucun produit dans cette boutique'}
        </h3>
        <p className="text-linkme-marine/60 mb-6 text-sm max-w-sm mx-auto">
          {hasActiveFilters
            ? "Essayez avec d'autres filtres."
            : 'Ajoutez des produits depuis le catalogue pour commencer à vendre.'}
        </p>
        {hasActiveFilters && onResetFilters ? (
          <button
            onClick={onResetFilters}
            className="text-sm text-linkme-turquoise hover:underline font-medium"
          >
            Réinitialiser les filtres
          </button>
        ) : (
          <Link
            href="/catalogue"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-linkme-turquoise text-white rounded-xl font-medium hover:bg-linkme-turquoise/90 transition-all duration-200 shadow-md hover:shadow-lg text-sm"
          >
            <Plus className="h-4 w-4" />
            Parcourir le catalogue
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {paginatedItems.map(item => (
          <ProductCard
            key={item.id}
            item={item}
            onEdit={onEdit ? () => onEdit(item) : undefined}
            onRemove={onRemove ? () => onRemove(item) : undefined}
            isDeleting={deletingItemId === item.id}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 px-1">
          <p className="text-xs text-gray-500">
            {items.length} produit{items.length > 1 ? 's' : ''}
            {searchQuery && ` trouvé${items.length > 1 ? 's' : ''}`}
            <span className="text-gray-400">
              {' '}
              &middot; Page {safePage}/{totalPages}
            </span>
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Page précédente"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => {
                if (page === 1 || page === totalPages) return true;
                if (Math.abs(page - safePage) <= 1) return true;
                return false;
              })
              .reduce<(number | 'ellipsis')[]>((acc, page, idx, arr) => {
                if (idx > 0) {
                  const prev = arr[idx - 1];
                  if (page - prev > 1) acc.push('ellipsis');
                }
                acc.push(page);
                return acc;
              }, [])
              .map((item, idx) =>
                item === 'ellipsis' ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-1 text-xs text-gray-400"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setCurrentPage(item)}
                    className={`flex h-8 min-w-[32px] items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                      safePage === item
                        ? 'bg-linkme-turquoise text-white'
                        : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {item}
                  </button>
                )
              )}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Page suivante"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================================
// Composant ProductCard - Carte produit compacte avec actions
// ============================================================================

interface ProductCardProps {
  item: SelectionItem;
  onEdit?: () => void;
  onRemove?: () => void;
  isDeleting: boolean;
}

function ProductCard({
  item,
  onEdit,
  onRemove,
  isDeleting,
}: ProductCardProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-white border-gray-100 hover:border-linkme-turquoise/40 p-2.5 hover:shadow-sm transition-all group">
      {/* Image */}
      <div className="relative h-16 w-16 flex-shrink-0 rounded-md bg-gray-50 overflow-hidden">
        {item.product_image_url ? (
          <Image
            src={item.product_image_url}
            alt={item.product_name}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-6 w-6 text-gray-200" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">
            {item.product_reference}
          </span>
          <h3 className="text-sm font-medium text-gray-900 truncate">
            {item.product_name}
          </h3>
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-sm font-semibold text-gray-900">
            {formatCurrency(item.selling_price_ht)}
            <span className="text-[10px] font-normal text-gray-400 ml-0.5">
              HT
            </span>
          </span>
          {!item.is_affiliate_product ? (
            <span className="text-xs text-linkme-turquoise font-medium">
              Marge : {item.margin_rate.toFixed(2)}%
            </span>
          ) : (
            <span className="text-xs text-indigo-500 font-medium">Affilié</span>
          )}
          <StockBadge stock={item.product_stock_real} />
        </div>
      </div>

      {/* Actions */}
      {(onEdit != null || onRemove != null) && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1.5 text-linkme-turquoise hover:bg-linkme-turquoise/10 rounded-lg transition-colors"
              title="Modifier la marge"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
          )}
          {onRemove && (
            <button
              onClick={onRemove}
              disabled={isDeleting}
              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="Retirer de la sélection"
            >
              {isDeleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
