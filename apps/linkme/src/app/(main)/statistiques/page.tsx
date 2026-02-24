'use client';

/**
 * Page Statistiques - Vue unifiée avec 2 onglets
 *
 * Onglet 1 "Commissions" : Analytics détaillées (période, 4 KPIs, graphiques, top produits)
 * Onglet 2 "Produits"    : Stats produits (quantités, CA, tableau paginé, export CSV)
 *
 * URLs :
 *   /statistiques              → onglet Commissions (défaut)
 *   /statistiques?tab=produits → onglet Produits
 */

import { useState, useMemo, useCallback, Suspense } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { Card, DonutChart, AreaChart } from '@tremor/react';
import {
  BarChart3,
  RefreshCw,
  AlertCircle,
  Calendar,
  Wallet,
  CheckCircle,
  Clock,
  Banknote,
  Filter,
  TrendingUp,
  Package,
  ShoppingCart,
  DollarSign,
  Receipt,
  Download,
} from 'lucide-react';

import { ProductStatsTable } from '@/components/analytics/ProductStatsTable';
import { TopProductsTable } from '@/components/analytics';
import { useAffiliateAnalytics } from '@/lib/hooks/use-affiliate-analytics';
import {
  useAllProductsStats,
  type ProductStatsFilters,
} from '@/lib/hooks/use-all-products-stats';
import { formatCurrency } from '@/types/analytics';
import type { AnalyticsPeriod } from '@/types/analytics';

import { ProductSalesDetailModal } from './produits/components/ProductSalesDetailModal';
import { ProductStatsCharts } from './produits/components/ProductStatsCharts';

// ─── Types filtres commissions ────────────────────────────────────────────────

type FilterPreset =
  | 'all'
  | 'this_month'
  | 'this_quarter'
  | 'this_year'
  | 'custom';

interface PeriodFilter {
  preset: FilterPreset;
  startDate?: Date;
  endDate?: Date;
}

const PRESET_TO_PERIOD: Record<FilterPreset, AnalyticsPeriod> = {
  all: 'all',
  this_month: 'month',
  this_quarter: 'quarter',
  this_year: 'year',
  custom: 'year',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrencyLocal(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// ─── Onglet Commissions ───────────────────────────────────────────────────────

function CommissionsTab(): JSX.Element {
  const [filter, setFilter] = useState<PeriodFilter>({ preset: 'all' });

  const apiPeriod = PRESET_TO_PERIOD[filter.preset];
  const { data, isLoading, error, refetch } = useAffiliateAnalytics(apiPeriod);

  const commissionsChartData = useMemo(() => {
    if (!data?.revenueByPeriod) return [];
    return data.revenueByPeriod.map(d => ({
      date: d.label,
      'CA HT': d.revenue,
      Commandes: d.orders,
    }));
  }, [data?.revenueByPeriod]);

  const { commissionDonutData, donutColors } = useMemo(() => {
    if (!data?.commissionsByStatus)
      return { commissionDonutData: [], donutColors: [] };

    const { pending, validated, requested, paid } = data.commissionsByStatus;
    const statuses = [
      { name: 'Payables', value: validated.amountTTC, color: 'emerald' },
      { name: 'En attente', value: pending.amountTTC, color: 'amber' },
      { name: 'En cours', value: requested.amountTTC, color: 'blue' },
      { name: 'Payées', value: paid.amountTTC, color: 'violet' },
    ];
    const filtered = statuses.filter(s => s.value > 0);
    return {
      commissionDonutData: filtered.map(s => ({
        name: s.name,
        value: s.value,
      })),
      donutColors: filtered.map(s => s.color),
    };
  }, [data?.commissionsByStatus]);

  const formatDateInput = (date: Date): string =>
    date.toISOString().split('T')[0];

  const handlePresetChange = (preset: FilterPreset): void => {
    if (preset === 'custom') {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      setFilter({ preset: 'custom', startDate, endDate });
    } else {
      setFilter({ preset });
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtres de période */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Filter className="h-4 w-4" />
            <span className="font-medium">Période :</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                'all',
                'this_month',
                'this_quarter',
                'this_year',
              ] as FilterPreset[]
            ).map(preset => (
              <button
                key={preset}
                onClick={() => handlePresetChange(preset)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter.preset === preset
                    ? 'bg-[#5DBEBB] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {preset === 'all' && 'Tout'}
                {preset === 'this_month' && 'Ce mois'}
                {preset === 'this_quarter' && 'Ce trimestre'}
                {preset === 'this_year' && 'Cette année'}
              </button>
            ))}
            <button
              onClick={() => handlePresetChange('custom')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                filter.preset === 'custom'
                  ? 'bg-[#5DBEBB] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              Personnalisé
            </button>
          </div>

          {filter.preset === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={
                  filter.startDate ? formatDateInput(filter.startDate) : ''
                }
                onChange={e =>
                  setFilter(f => ({
                    ...f,
                    startDate: new Date(e.target.value),
                  }))
                }
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#5DBEBB] focus:border-transparent"
              />
              <span className="text-gray-400">→</span>
              <input
                type="date"
                value={filter.endDate ? formatDateInput(filter.endDate) : ''}
                onChange={e =>
                  setFilter(f => ({ ...f, endDate: new Date(e.target.value) }))
                }
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#5DBEBB] focus:border-transparent"
              />
            </div>
          )}
        </div>
      </Card>

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
              onClick={() => {
                void refetch().catch(err => {
                  console.error('[CommissionsTab] Refetch failed:', err);
                });
              }}
              className="ml-auto px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-colors"
            >
              Réessayer
            </button>
          </div>
        </Card>
      )}

      {/* 4 KPIs Commissions */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-[#5DBEBB]">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-[#5DBEBB]/10 rounded-lg">
              <Wallet className="h-4 w-4 text-[#5DBEBB]" />
            </div>
            <span className="text-sm text-gray-600">Total TTC</span>
          </div>
          {isLoading ? (
            <div className="animate-pulse h-8 bg-gray-200 rounded w-24" />
          ) : (
            <>
              <p className="text-2xl font-bold text-[#5DBEBB]">
                {formatCurrency(
                  data?.commissionsByStatus?.total?.amountTTC ?? 0
                )}
              </p>
              <p className="text-xs text-gray-500">
                {data?.commissionsByStatus?.total?.count ?? 0} commissions
              </p>
            </>
          )}
        </Card>

        <Card className="p-4 border-l-4 border-emerald-500">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-emerald-50 rounded-lg">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
            <span className="text-sm text-gray-600">Payables</span>
          </div>
          {isLoading ? (
            <div className="animate-pulse h-8 bg-gray-200 rounded w-24" />
          ) : (
            <>
              <p className="text-2xl font-bold text-emerald-600">
                {formatCurrency(
                  data?.commissionsByStatus?.validated?.amountTTC ?? 0
                )}
              </p>
              <p className="text-xs text-gray-500">
                {data?.commissionsByStatus?.validated?.count ?? 0} disponibles
              </p>
            </>
          )}
        </Card>

        <Card className="p-4 border-l-4 border-[#3976BB]">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-[#3976BB]/10 rounded-lg">
              <Banknote className="h-4 w-4 text-[#3976BB]" />
            </div>
            <span className="text-sm text-gray-600">En cours</span>
          </div>
          {isLoading ? (
            <div className="animate-pulse h-8 bg-gray-200 rounded w-24" />
          ) : (
            <>
              <p className="text-2xl font-bold text-[#3976BB]">
                {formatCurrency(
                  data?.commissionsByStatus?.requested?.amountTTC ?? 0
                )}
              </p>
              <p className="text-xs text-gray-500">
                {data?.commissionsByStatus?.requested?.count ?? 0} demandes
              </p>
            </>
          )}
        </Card>

        <Card className="p-4 border-l-4 border-amber-500">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-amber-50 rounded-lg">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <span className="text-sm text-gray-600">En attente</span>
          </div>
          {isLoading ? (
            <div className="animate-pulse h-8 bg-gray-200 rounded w-24" />
          ) : (
            <>
              <p className="text-2xl font-bold text-amber-600">
                {formatCurrency(
                  data?.commissionsByStatus?.pending?.amountTTC ?? 0
                )}
              </p>
              <p className="text-xs text-gray-500">
                {data?.commissionsByStatus?.pending?.count ?? 0} en attente
              </p>
            </>
          )}
        </Card>
      </section>

      {/* Graphiques */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-cyan-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Évolution du CA
            </h3>
          </div>
          {isLoading ? (
            <div className="animate-pulse h-64 bg-gray-200 rounded" />
          ) : commissionsChartData.length > 0 ? (
            <AreaChart
              data={commissionsChartData}
              index="date"
              categories={['CA HT']}
              colors={['cyan']}
              valueFormatter={value => formatCurrency(value)}
              showLegend={false}
              showGridLines
              showAnimation
              className="h-64"
              curveType="monotone"
              yAxisWidth={120}
            />
          ) : (
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">
                  Aucune donnée pour cette période
                </p>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Wallet className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Répartition des commissions
              </h3>
              <p className="text-sm text-gray-500">Par statut</p>
            </div>
          </div>
          {isLoading ? (
            <div className="animate-pulse h-64 bg-gray-200 rounded" />
          ) : commissionDonutData.length > 0 ? (
            <DonutChart
              data={commissionDonutData}
              category="value"
              index="name"
              colors={donutColors}
              valueFormatter={value => formatCurrency(value)}
              className="h-64"
              showAnimation
            />
          ) : (
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Aucune commission</p>
              </div>
            </div>
          )}
        </Card>
      </section>

      {/* Top Produits */}
      <section>
        <TopProductsTable
          products={data?.topProducts}
          isLoading={isLoading}
          title="Top 10 Produits Vendus"
          maxItems={10}
        />
      </section>

      <div className="text-center text-xs text-gray-400 pb-2">
        <p suppressHydrationWarning>
          Données actualisées en temps réel · Dernière mise à jour :{' '}
          {new Date().toLocaleString('fr-FR')}
        </p>
      </div>
    </div>
  );
}

// ─── Onglet Produits ──────────────────────────────────────────────────────────

function ProduitsTab(): JSX.Element {
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
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
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
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
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
        <ProductStatsCharts products={filteredProducts} isLoading={isLoading} />
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
  );
}

// ─── Tabs navigation ──────────────────────────────────────────────────────────

type TabId = 'commissions' | 'produits';

const TABS: { id: TabId; label: string }[] = [
  { id: 'commissions', label: 'Commissions' },
  { id: 'produits', label: 'Statistiques Produits' },
];

function StatistiquesContent(): JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawTab = searchParams.get('tab');
  const activeTab: TabId = rawTab === 'produits' ? 'produits' : 'commissions';

  const handleTabChange = (tab: TabId): void => {
    if (tab === 'commissions') {
      router.push('/statistiques', { scroll: false });
    } else {
      router.push(`/statistiques?tab=${tab}`, { scroll: false });
    }
  };

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
                Analysez vos performances en temps réel
              </p>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex gap-6" aria-label="Tabs">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#5DBEBB] text-[#5DBEBB]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Contenu onglet actif */}
        {activeTab === 'commissions' ? <CommissionsTab /> : <ProduitsTab />}
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
