'use client';

/**
 * Page Statistiques Produits
 *
 * 100% orientée produit : quantités vendues, CA généré.
 * Zero commission, zero marge, zero rémunération.
 *
 * - 4 KPIs (produits, quantité, CA HT, CA TTC)
 * - Graphiques : DonutChart CA par source + Top 5 quantité
 * - Tableau paginé avec search + year + tri + clic détail
 * - Modal détail ventes par produit
 * - Export CSV
 *
 * @module StatistiquesProduits
 * @since 2026-01-08
 * @updated 2026-02-10 - Suppression onglets, search+year dans tableau, modal détail
 */

import { useState, useMemo, useCallback } from 'react';

import Link from 'next/link';

import { Card } from '@tremor/react';
import {
  ArrowLeft,
  Package,
  ShoppingCart,
  DollarSign,
  RefreshCw,
  AlertCircle,
  Receipt,
  Download,
} from 'lucide-react';

import { ProductStatsTable } from '@/components/analytics/ProductStatsTable';
import {
  useAllProductsStats,
  type ProductStatsFilters,
} from '@/lib/hooks/use-all-products-stats';

import { ProductSalesDetailModal } from './components/ProductSalesDetailModal';
import { ProductStatsCharts } from './components/ProductStatsCharts';

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

// ============================================
// PAGE
// ============================================

export default function StatistiquesProduits(): JSX.Element {
  // Filters state
  const [filters, setFilters] = useState<ProductStatsFilters>({});
  const [search, setSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null
  );

  // Data fetching with filters
  const { data, isLoading, error, refetch } = useAllProductsStats(filters);

  // Client-side search filtering (debounced via ProductStatsTable)
  const filteredProducts = useMemo(() => {
    const products = data?.products ?? [];
    if (!search.trim()) return products;
    const lower = search.toLowerCase();
    return products.filter(
      p =>
        p.productName.toLowerCase().includes(lower) ||
        p.productSku.toLowerCase().includes(lower)
    );
  }, [data?.products, search]);

  // Year filter handler
  const handleYearFilterChange = useCallback((year: number | undefined) => {
    setFilters(prev => ({ ...prev, year }));
  }, []);

  // Export CSV
  const exportToCSV = useCallback(() => {
    const headers = [
      'Produit',
      'SKU',
      'Source',
      'Quantité',
      'Prix unit. HT',
      'CA HT',
      'CA TTC',
    ];
    const rows = filteredProducts.map(p => [
      p.productName,
      p.productSku,
      p.productSource === 'catalogue'
        ? 'Catalogue'
        : p.productSource === 'mes-produits'
          ? 'Mes produits'
          : 'Sur-mesure',
      p.quantitySold.toString(),
      p.avgPriceHT.toFixed(2),
      p.revenueHT.toFixed(2),
      p.revenueTTC.toFixed(2),
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stats-produits-linkme-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filteredProducts]);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="p-2 bg-gradient-to-br from-[#7E84C0] to-[#3976BB] rounded-lg shadow-lg">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#183559]">
                Statistiques Produits
              </h1>
              <p className="text-gray-500 text-sm">
                Historique complet de vos ventes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Export CSV */}
            <button
              onClick={exportToCSV}
              disabled={isLoading || filteredProducts.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Exporter en CSV"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* Refresh */}
            <button
              onClick={() => void refetch()}
              disabled={isLoading}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Actualiser"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <Card className="p-3 border-l-4 border-red-500 bg-red-50">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <div>
                <p className="font-medium text-red-800 text-sm">
                  Erreur de chargement
                </p>
                <p className="text-xs text-red-600">{error.message}</p>
              </div>
              <button
                onClick={() => void refetch()}
                className="ml-auto px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-colors"
              >
                Réessayer
              </button>
            </div>
          </Card>
        )}

        {/* 4 KPIs */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Produits vendus */}
          <Card className="p-4 border-l-4 border-[#7E84C0]">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-[#7E84C0]/10 rounded-lg">
                <Package className="h-4 w-4 text-[#7E84C0]" />
              </div>
              <span className="text-xs text-gray-600">Produits</span>
            </div>
            {isLoading ? (
              <div className="animate-pulse h-7 bg-gray-200 rounded w-12" />
            ) : (
              <p className="text-xl font-bold text-[#7E84C0]">
                {data?.totals.productsCount ?? 0}
              </p>
            )}
          </Card>

          {/* Quantité totale */}
          <Card className="p-4 border-l-4 border-[#3976BB]">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-[#3976BB]/10 rounded-lg">
                <ShoppingCart className="h-4 w-4 text-[#3976BB]" />
              </div>
              <span className="text-xs text-gray-600">Quantité</span>
            </div>
            {isLoading ? (
              <div className="animate-pulse h-7 bg-gray-200 rounded w-16" />
            ) : (
              <p className="text-xl font-bold text-[#3976BB]">
                {(data?.totals.totalQuantity ?? 0).toLocaleString('fr-FR')}
              </p>
            )}
          </Card>

          {/* CA Total HT */}
          <Card className="p-4 border-l-4 border-[#183559]">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-[#183559]/10 rounded-lg">
                <DollarSign className="h-4 w-4 text-[#183559]" />
              </div>
              <span className="text-xs text-gray-600">CA HT</span>
            </div>
            {isLoading ? (
              <div className="animate-pulse h-7 bg-gray-200 rounded w-24" />
            ) : (
              <p className="text-xl font-bold text-[#183559]">
                {formatCurrency(data?.totals.totalRevenueHT ?? 0)}
              </p>
            )}
          </Card>

          {/* CA Total TTC */}
          <Card className="p-4 border-l-4 border-[#183559]/60">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-[#183559]/5 rounded-lg">
                <Receipt className="h-4 w-4 text-[#183559]/70" />
              </div>
              <span className="text-xs text-gray-600">CA TTC</span>
            </div>
            {isLoading ? (
              <div className="animate-pulse h-7 bg-gray-200 rounded w-24" />
            ) : (
              <p className="text-xl font-bold text-[#183559]/70">
                {formatCurrency(data?.totals.totalRevenueTTC ?? 0)}
              </p>
            )}
          </Card>
        </section>

        {/* Charts */}
        <section>
          <ProductStatsCharts
            products={filteredProducts}
            isLoading={isLoading}
          />
        </section>

        {/* Tableau des produits */}
        <section>
          <ProductStatsTable
            products={filteredProducts}
            isLoading={isLoading}
            search={search}
            onSearchChange={setSearch}
            yearFilter={filters.year}
            onYearFilterChange={handleYearFilterChange}
            onProductClick={setSelectedProductId}
          />
        </section>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 pb-6">
          <p suppressHydrationWarning>
            {filteredProducts.length} produit
            {filteredProducts.length > 1 ? 's' : ''} affiché
            {filteredProducts.length > 1 ? 's' : ''}
            {search && ` pour "${search}"`}
            {filters.year && ` en ${filters.year}`}
            {' · '}
            Dernière mise à jour : {new Date().toLocaleString('fr-FR')}
          </p>
        </div>
      </div>

      {/* Modal détail ventes produit */}
      <ProductSalesDetailModal
        productId={selectedProductId}
        onClose={() => setSelectedProductId(null)}
      />
    </div>
  );
}
