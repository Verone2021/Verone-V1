/**
 * ProductStatsTable Component
 * Tableau paginé de tous les produits vendus avec statistiques complètes
 *
 * Features:
 * - Pagination (10/20 par page)
 * - Tri par commission, quantité, CA
 * - Recherche par nom/SKU
 * - Badge Sur mesure / Catalogue
 * - Affichage HT uniquement (pas de TTC)
 *
 * @module ProductStatsTable
 * @since 2026-01-08
 */

'use client';

import { useState, useMemo } from 'react';

import Image from 'next/image';

import { Card } from '@tremor/react';
import {
  Package,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react';

import type { ProductStatsData } from '@/lib/hooks/use-all-products-stats';

// ============================================
// TYPES
// ============================================

interface ProductStatsTableProps {
  products: ProductStatsData[];
  isLoading?: boolean;
  /** Mode revendeur: affiche "Frais LinkMe" au lieu de "Commission" */
  isRevendeur?: boolean;
}

type SortField = 'commission' | 'quantity' | 'revenue';
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

function formatPercent(value: number): string {
  return `${value.toFixed(1)} %`;
}

// ============================================
// COMPONENT
// ============================================

export function ProductStatsTable({
  products,
  isLoading = false,
  isRevendeur = false,
}: ProductStatsTableProps): JSX.Element {
  // Labels dynamiques selon le type
  const commissionLabel = isRevendeur ? 'Frais LinkMe' : 'Commission';

  // States
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('commission');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Filtrer et trier les produits
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Filtre par recherche
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        p =>
          p.productName.toLowerCase().includes(searchLower) ||
          p.productSku.toLowerCase().includes(searchLower)
      );
    }

    // Tri
    result.sort((a, b) => {
      let valueA: number;
      let valueB: number;

      switch (sortField) {
        case 'commission':
          valueA = a.commissionHT;
          valueB = b.commissionHT;
          break;
        case 'quantity':
          valueA = a.quantitySold;
          valueB = b.quantitySold;
          break;
        case 'revenue':
          valueA = a.revenueHT;
          valueB = b.revenueHT;
          break;
        default:
          valueA = a.commissionHT;
          valueB = b.commissionHT;
      }

      return sortDirection === 'desc' ? valueB - valueA : valueA - valueB;
    });

    return result;
  }, [products, search, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedProducts.length / perPage);
  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredAndSortedProducts.slice(start, start + perPage);
  }, [filteredAndSortedProducts, page, perPage]);

  // Reset page when filter changes
  const handleSearchChange = (value: string): void => {
    setSearch(value);
    setPage(1);
  };

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
      {/* Header avec recherche et tri */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        {/* Recherche */}
        <div className="relative flex-1 sm:max-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom ou SKU..."
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#5DBEBB] focus:border-transparent"
          />
        </div>

        {/* Tri */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Trier par :</span>
          <div className="flex gap-1">
            {[
              { field: 'commission' as const, label: commissionLabel },
              { field: 'quantity' as const, label: 'Quantité' },
              { field: 'revenue' as const, label: 'CA' },
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
              <th className="text-left py-3 px-2 font-medium text-gray-500">
                #
              </th>
              <th className="text-left py-3 px-2 font-medium text-gray-500">
                Produit
              </th>
              <th className="text-right py-3 px-2 font-medium text-gray-500">
                Qté
              </th>
              <th className="text-right py-3 px-2 font-medium text-gray-500">
                CA HT
              </th>
              <th className="text-right py-3 px-2 font-medium text-gray-500">
                Taux
              </th>
              <th className="text-right py-3 px-2 font-medium text-gray-500">
                Marge/u
              </th>
              <th className="text-right py-3 px-2 font-medium text-gray-500">
                {commissionLabel} HT
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedProducts.map((product, index) => {
              const rank = (page - 1) * perPage + index + 1;

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

                  {/* Produit avec Badge */}
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
                          {/* Badge Sur mesure / Catalogue */}
                          {!isRevendeur && (
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                product.isCustomProduct
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {product.isCustomProduct
                                ? 'Sur mesure'
                                : 'Catalogue'}
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

                  {/* CA HT */}
                  <td className="py-3 px-2 text-right text-gray-600">
                    {formatCurrency(product.revenueHT)}
                  </td>

                  {/* Taux de commission moyen */}
                  <td className="py-3 px-2 text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700">
                      {formatPercent(product.avgMarginRate)}
                    </span>
                  </td>

                  {/* Marge par unité */}
                  <td className="py-3 px-2 text-right text-gray-600">
                    {formatCurrency(product.marginPerUnit)}
                  </td>

                  {/* Commission HT */}
                  <td className="py-3 px-2 text-right font-semibold text-[#5DBEBB]">
                    {formatCurrency(product.commissionHT)}
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
          {filteredAndSortedProducts.length} produit
          {filteredAndSortedProducts.length > 1 ? 's' : ''} trouvé
          {filteredAndSortedProducts.length > 1 ? 's' : ''}
          {search && ` pour "${search}"`}
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
