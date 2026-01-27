'use client';

/**
 * Page Performance par Affilié LinkMe
 *
 * Refonte 2025-12-17:
 * - Bouton retour vers Performance globale
 * - Filtres Année + Période cohérents
 * - KPIs compacts
 *
 * @module AffiliatePerformancePage
 * @since 2025-12-17
 */

import { useState, useMemo } from 'react';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Skeleton } from '@verone/ui';
import { Button } from '@verone/ui';
import {
  ShoppingCart,
  DollarSign,
  Wallet,
  ShoppingBag,
  Package,
  ChevronRight,
  ChevronLeft,
  Star,
  User,
} from 'lucide-react';

import { ProductThumbnail } from '@verone/products';

import {
  AnalyticsDateFilter,
  getDateRangeForYearAndPeriod,
  formatDateRangeLabel,
  type AnalyticsPeriod,
} from '../../../components/AnalyticsDateFilter';
import {
  usePerformanceAnalytics,
  type TopProduct,
  type SelectionListItem,
} from '../../../hooks/use-performance-analytics';

// ============================================================================
// Config
// ============================================================================

const AVAILABLE_YEARS = [2024, 2025];

// ============================================================================
// Helpers
// ============================================================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('fr-FR').format(num);
}

// ============================================================================
// KPI Card Component
// ============================================================================

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconBgColor: string;
  iconColor: string;
  isLoading?: boolean;
}

function KpiCard({
  title,
  value,
  icon: Icon,
  iconBgColor,
  iconColor,
  isLoading,
}: KpiCardProps) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${iconBgColor}`}
          >
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <div className="min-w-0 flex-1">
            {isLoading ? (
              <>
                <Skeleton className="h-6 w-24 mb-1" />
                <Skeleton className="h-4 w-16" />
              </>
            ) : (
              <>
                <p className="text-xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{title}</p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Top Product Row Component
// ============================================================================

interface TopProductRowProps {
  product: TopProduct;
  rank: number;
}

function TopProductRow({ product, rank }: TopProductRowProps) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600 shrink-0">
        {rank}
      </div>

      <ProductThumbnail
        src={product.imageUrl}
        alt={product.name}
        size="sm"
        className="rounded-md"
      />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {product.name}
        </p>
        <p className="text-xs text-gray-500">SKU: {product.sku}</p>
      </div>

      <div className="flex items-center gap-4 text-right shrink-0">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {formatNumber(product.quantitySold)}
          </p>
          <p className="text-xs text-gray-500">vendus</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-600">
            {formatCurrency(product.totalRevenueHT)}
          </p>
          <p className="text-xs text-gray-500">CA HT</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Selection Row Component
// ============================================================================

interface SelectionRowProps {
  selection: SelectionListItem;
  affiliateId: string;
}

function SelectionRow({ selection, affiliateId }: SelectionRowProps) {
  return (
    <Link
      href={`/canaux-vente/linkme/analytics/performance/${affiliateId}/${selection.id}`}
      className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors px-2 -mx-2 rounded-lg"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-600 shrink-0">
        <Star className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {selection.name}
        </p>
        <p className="text-xs text-gray-500">
          {selection.productsCount} produit
          {selection.productsCount > 1 ? 's' : ''} • {selection.ordersCount}{' '}
          commande
          {selection.ordersCount > 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex items-center gap-4 text-right shrink-0">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {formatCurrency(selection.totalRevenueHT)}
          </p>
          <p className="text-xs text-gray-500">CA HT</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-600">
            {formatCurrency(selection.totalCommissionsTTC)}
          </p>
          <p className="text-xs text-gray-500">Comm. TTC</p>
        </div>
      </div>

      <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
    </Link>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export default function AffiliatePerformancePage() {
  const params = useParams();
  const affiliateId = params.affiliateId as string;

  // State for filters
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod>('year');

  // Calculate date range
  const dateRange = useMemo(
    () => getDateRangeForYearAndPeriod(selectedYear, selectedPeriod),
    [selectedYear, selectedPeriod]
  );

  const dateRangeLabel = useMemo(
    () => formatDateRangeLabel(dateRange.startDate, dateRange.endDate),
    [dateRange]
  );

  const { data, isLoading, error } = usePerformanceAnalytics({
    dateRange,
    affiliateId,
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Back Button */}
            <Link href="/canaux-vente/linkme/analytics/performance">
              <Button variant="ghost" size="sm" className="gap-1 px-2">
                <ChevronLeft className="h-4 w-4" />
                Performance
              </Button>
            </Link>

            <div className="h-6 w-px bg-gray-200" />

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              {isLoading ? (
                <>
                  <Skeleton className="h-6 w-40 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </>
              ) : (
                <>
                  <h1 className="text-xl font-semibold">
                    {data?.affiliateName || 'Affilié'}
                  </h1>
                  <p className="text-sm text-gray-500">Performance détaillée</p>
                </>
              )}
            </div>
          </div>

          {/* Date Filters */}
          <AnalyticsDateFilter
            selectedYear={selectedYear}
            selectedPeriod={selectedPeriod}
            availableYears={AVAILABLE_YEARS}
            onYearChange={setSelectedYear}
            onPeriodChange={setSelectedPeriod}
            dateRangeLabel={dateRangeLabel}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            Erreur lors du chargement des données:{' '}
            {error instanceof Error ? error.message : 'Erreur inconnue'}
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          <KpiCard
            title="Panier moyen"
            value={formatCurrency(data?.averageBasket || 0)}
            icon={ShoppingBag}
            iconBgColor="bg-orange-100"
            iconColor="text-orange-600"
            isLoading={isLoading}
          />
          <KpiCard
            title="CA HT"
            value={formatCurrency(data?.totalRevenueHT || 0)}
            icon={DollarSign}
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
            isLoading={isLoading}
          />
          <KpiCard
            title="Commissions TTC"
            value={formatCurrency(data?.totalCommissionsTTC || 0)}
            icon={Wallet}
            iconBgColor="bg-emerald-100"
            iconColor="text-emerald-600"
            isLoading={isLoading}
          />
          <KpiCard
            title="Commandes"
            value={formatNumber(data?.totalOrders || 0)}
            icon={ShoppingCart}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
            isLoading={isLoading}
          />
        </div>

        {/* Two columns: Top Products + Selections */}
        <div className="grid grid-cols-2 gap-6">
          {/* Top Products */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-gray-500" />
                <div>
                  <CardTitle className="text-base">Top 10 Produits</CardTitle>
                  <p className="text-xs text-gray-500">
                    Produits les plus vendus par cet affilié
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-14" />
                  ))}
                </div>
              ) : data?.topProducts && data.topProducts.length > 0 ? (
                <div>
                  {data.topProducts.map((product, index) => (
                    <TopProductRow
                      key={product.id}
                      product={product}
                      rank={index + 1}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="h-10 w-10 text-gray-300 mb-3" />
                  <p className="text-gray-500">Aucun produit vendu</p>
                  <p className="text-sm text-gray-400">
                    Sur la période sélectionnée
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selections List */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-gray-500" />
                <div>
                  <CardTitle className="text-base">Sélections</CardTitle>
                  <p className="text-xs text-gray-500">
                    Cliquez pour voir les détails
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-14" />
                  ))}
                </div>
              ) : data?.selections && data.selections.length > 0 ? (
                <div>
                  {data.selections.map(selection => (
                    <SelectionRow
                      key={selection.id}
                      selection={selection}
                      affiliateId={affiliateId}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Star className="h-10 w-10 text-gray-300 mb-3" />
                  <p className="text-gray-500">Aucune sélection</p>
                  <p className="text-sm text-gray-400">
                    Aucune vente via sélection sur cette période
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 pt-2">
          <Link
            href="/canaux-vente/linkme/analytics"
            className="hover:text-gray-700"
          >
            Analytics
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link
            href="/canaux-vente/linkme/analytics/performance"
            className="hover:text-gray-700"
          >
            Performance
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-gray-900 font-medium">
            {data?.affiliateName || 'Affilié'}
          </span>
        </div>
      </div>
    </div>
  );
}
