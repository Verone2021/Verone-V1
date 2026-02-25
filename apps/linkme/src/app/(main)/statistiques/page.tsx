'use client';

/**
 * Page Statistiques - Stats produits (quantités + CA)
 *
 * Affiche les performances produits :
 * - 4 KPIs : nb produits, quantité vendue, CA HT, CA TTC
 * - Graphiques par produit/source
 * - Tableau paginé avec export CSV
 *
 * @module StatistiquesPage
 * @since 2026-02-25
 */

import { useState, useMemo, useCallback, Suspense } from 'react';

import { Card } from '@tremor/react';
import {
  BarChart3,
  RefreshCw,
  AlertCircle,
  Package,
  ShoppingCart,
  DollarSign,
  Receipt,
  Download,
} from 'lucide-react';

import { ProductStatsTable } from '@/components/analytics/ProductStatsTable';
import {
  useAllProductsStats,
  type ProductStatsFilters,
} from '@/lib/hooks/use-all-products-stats';

import { ProductSalesDetailModal } from './produits/components/ProductSalesDetailModal';
import { ProductStatsCharts } from './produits/components/ProductStatsCharts';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrencyLocal(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// ─── Contenu principal ────────────────────────────────────────────────────────

function StatistiquesContent(): JSX.Element {
  const [filters, setFilters] = useState<ProductStatsFilters>({});
  const [search, setSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null
  );

  const { data, isLoading, error, refetch } = useAllProductsStats(filters);

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

  const handleYearFilterChange = useCallback(
    (year: number | undefined): void => {
      setFilters(prev => ({ ...prev, year }));
    },
    []
  );

  const exportToCSV = useCallback((): void => {
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#5DBEBB] to-[#3976BB] rounded-lg shadow-lg">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#183559]">Statistiques</h1>
              <p className="text-gray-500 text-sm">
                Performances produits — quantités et chiffre d&apos;affaires
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={exportToCSV}
              disabled={isLoading || filteredProducts.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Exporter en CSV"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
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
                {formatCurrencyLocal(data?.totals.totalRevenueHT ?? 0)}
              </p>
            )}
          </Card>

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
                {formatCurrencyLocal(data?.totals.totalRevenueTTC ?? 0)}
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

        {/* Tableau */}
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

        <div className="text-center text-xs text-gray-400 pb-2">
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

        <ProductSalesDetailModal
          productId={selectedProductId}
          onClose={() => setSelectedProductId(null)}
        />
      </div>
    </div>
  );
}

// ─── Export ────────────────────────────────────────────────────────────────────

export default function StatistiquesPage(): JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-[#5DBEBB]" />
        </div>
      }
    >
      <StatistiquesContent />
    </Suspense>
  );
}
