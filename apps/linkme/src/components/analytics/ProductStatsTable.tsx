/**
 * ProductStatsTable Component
 * Tableau paginé de tous les produits vendus
 *
 * 100% orienté produit : quantités, prix unitaire, CA.
 * Zero commission, zero marge.
 *
 * Features:
 * - Pagination (10/20 par page)
 * - Tri par quantité (défaut) ou CA HT
 * - Badges source : Catalogue / Mes produits / Sur-mesure
 *
 * @module ProductStatsTable
 * @since 2026-01-08
 * @updated 2026-02-10 - Purge commissions, focus produit
 */

'use client';

import { useState, useMemo } from 'react';

import Image from 'next/image';

import { Card } from '@tremor/react';
import { Package, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

import type { ProductStatsData } from '@/lib/hooks/use-all-products-stats';

// ============================================
// TYPES
// ============================================

interface ProductStatsTableProps {
  products: ProductStatsData[];
  isLoading?: boolean;
}

type SortField = 'quantity' | 'revenue';
type SortDirection = 'asc' | 'desc';

// ============================================
// HELPERS
// ============================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

const SOURCE_BADGE_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  catalogue: {
    bg: 'bg-teal-100',
    text: 'text-teal-700',
    label: 'Catalogue',
  },
  'mes-produits': {
    bg: 'bg-violet-100',
    text: 'text-violet-700',
    label: 'Mes produits',
  },
  'sur-mesure': {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    label: 'Sur-mesure',
  },
};

// ============================================
// COMPONENT
// ============================================

export function ProductStatsTable({
  products,
  isLoading = false,
}: ProductStatsTableProps): JSX.Element {
  // States
  const [sortField, setSortField] = useState<SortField>('quantity');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Trier les produits
  const sortedProducts = useMemo(() => {
    const result = [...products];

    result.sort((a, b) => {
      const valueA = sortField === 'quantity' ? a.quantitySold : a.revenueHT;
      const valueB = sortField === 'quantity' ? b.quantitySold : b.revenueHT;
      return sortDirection === 'desc' ? valueB - valueA : valueA - valueB;
    });

    return result;
  }, [products, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / perPage);
  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * perPage;
    return sortedProducts.slice(start, start + perPage);
  }, [sortedProducts, page, perPage]);

  // Reset page when products change
  useMemo(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length]);

  const handleSortChange = (field: SortField): void => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setPage(1);
  };

  const handlePerPageChange = (value: number): void => {
    setPerPage(value);
    setPage(1);
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="animate-pulse h-10 bg-gray-200 rounded w-64" />
          <div className="animate-pulse h-64 bg-gray-200 rounded" />
        </div>
      </Card>
    );
  }

  // Empty state
  if (products.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucun produit vendu</p>
          <p className="text-sm text-gray-400 mt-1">
            Vos statistiques produits apparaîtront ici
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {/* Header avec tri */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-900">
          Détail par produit
        </h3>

        {/* Tri */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Trier par :</span>
          <div className="flex gap-1">
            {[
              { field: 'quantity' as const, label: 'Quantité' },
              { field: 'revenue' as const, label: 'CA HT' },
            ].map(({ field, label }) => (
              <button
                key={field}
                onClick={() => handleSortChange(field)}
                className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1 transition-colors ${
                  sortField === field
                    ? 'bg-[#5DBEBB] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
                {sortField === field && <ArrowUpDown className="h-3 w-3" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2 font-medium text-gray-500 w-10">
                #
              </th>
              <th className="text-left py-3 px-2 font-medium text-gray-500">
                Produit
              </th>
              <th className="text-right py-3 px-2 font-medium text-gray-500">
                Qté
              </th>
              <th className="text-right py-3 px-2 font-medium text-gray-500">
                Prix unit. HT
              </th>
              <th className="text-right py-3 px-2 font-medium text-gray-500">
                CA HT
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedProducts.map((product, index) => {
              const rank = (page - 1) * perPage + index + 1;
              const badge = SOURCE_BADGE_STYLES[product.productSource];

              return (
                <tr
                  key={product.productId}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* Rang */}
                  <td className="py-3 px-2">
                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-500">
                        {rank}
                      </span>
                    </div>
                  </td>

                  {/* Produit avec Badge source */}
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                        {product.productImageUrl ? (
                          <Image
                            src={product.productImageUrl}
                            alt={product.productName}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-[#183559] truncate max-w-[180px]">
                            {product.productName}
                          </p>
                          {badge && (
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${badge.bg} ${badge.text}`}
                            >
                              {badge.label}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">
                          {product.productSku}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Quantité */}
                  <td className="py-3 px-2 text-right font-medium">
                    {product.quantitySold.toLocaleString('fr-FR')}
                  </td>

                  {/* Prix unitaire HT */}
                  <td className="py-3 px-2 text-right text-gray-600">
                    {formatCurrency(product.avgPriceHT)}
                  </td>

                  {/* CA HT */}
                  <td className="py-3 px-2 text-right font-semibold text-[#183559]">
                    {formatCurrency(product.revenueHT)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 pt-4 border-t border-gray-100">
        {/* Info */}
        <div className="text-sm text-gray-500">
          {sortedProducts.length} produit
          {sortedProducts.length > 1 ? 's' : ''} trouvé
          {sortedProducts.length > 1 ? 's' : ''}
        </div>

        {/* Per page selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Afficher :</span>
          <div className="flex gap-1">
            {[10, 20].map(value => (
              <button
                key={value}
                onClick={() => handlePerPageChange(value)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  perPage === value
                    ? 'bg-[#183559] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        {/* Page navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="text-sm text-gray-600 min-w-[80px] text-center">
            Page {page} / {Math.max(1, totalPages)}
          </span>

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Card>
  );
}
