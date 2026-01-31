'use client';

/**
 * Page Performance par Sélection LinkMe
 *
 * Refonte 2025-12-17:
 * - Bouton retour vers Affilié
 * - Filtres Année + Période cohérents
 * - KPIs compacts
 *
 * @module SelectionPerformancePage
 * @since 2025-12-17
 */

import { useState, useMemo } from 'react';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Badge } from '@verone/ui';
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
} from 'lucide-react';

import { ProductThumbnail } from '@verone/products';

import {
  AnalyticsDateFilter,
  getDateRangeForYearAndPeriod,
  formatDateRangeLabel,
  type AnalyticsPeriod,
} from '../../../../components/AnalyticsDateFilter';
import {
  usePerformanceAnalytics,
  type TopProduct,
} from '../../../../hooks/use-performance-analytics';

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
// Product Row Component (Full width for selection page)
// ============================================================================

interface ProductRowProps {
  product: TopProduct;
  rank: number;
}

function ProductRow({ product, rank }: ProductRowProps) {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-gray-100 last:border-0">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600 shrink-0">
        {rank}
      </div>

      <ProductThumbnail
        src={product.imageUrl}
        alt={product.name}
        size="md"
        className="rounded-lg"
      />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{product.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">SKU: {product.sku}</p>
      </div>

      <div className="flex items-center gap-6 text-right shrink-0">
        <div className="min-w-[80px]">
          <p className="text-lg font-bold text-gray-900">
            {formatNumber(product.quantitySold)}
          </p>
          <p className="text-xs text-gray-500">unités vendues</p>
        </div>
        <div className="min-w-[100px]">
          <p className="text-lg font-bold text-emerald-600">
            {formatCurrency(product.totalRevenueHT)}
          </p>
          <p className="text-xs text-gray-500">CA HT</p>
        </div>
        <div className="min-w-[60px]">
          <p className="text-sm font-medium text-gray-600">
            {product.ordersCount} cmd
          </p>
          <p className="text-xs text-gray-400">commandes</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export default function SelectionPerformancePage() {
  const params = useParams();
  const affiliateId = params.affiliateId as string;
  const selectionId = params.selectionId as string;

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
    selectionId,
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Back Button */}
            <Link
              href={`/canaux-vente/linkme/analytics/performance/${affiliateId}`}
            >
              <Button variant="ghost" size="sm" className="gap-1 px-2">
                <ChevronLeft className="h-4 w-4" />
                {data?.affiliateName || 'Affilié'}
              </Button>
            </Link>

            <div className="h-6 w-px bg-gray-200" />

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <Star className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              {isLoading ? (
                <>
                  <Skeleton className="h-6 w-48 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </>
              ) : (
                <>
                  <h1 className="text-xl font-semibold">
                    {data?.selectionName || 'Sélection'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {data?.affiliateName || 'Affilié'}
                  </p>
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
            value={formatCurrency(data?.averageBasket ?? 0)}
            icon={ShoppingBag}
            iconBgColor="bg-orange-100"
            iconColor="text-orange-600"
            isLoading={isLoading}
          />
          <KpiCard
            title="CA HT"
            value={formatCurrency(data?.totalRevenueHT ?? 0)}
            icon={DollarSign}
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
            isLoading={isLoading}
          />
          <KpiCard
            title="Commissions TTC"
            value={formatCurrency(data?.totalCommissionsTTC ?? 0)}
            icon={Wallet}
            iconBgColor="bg-emerald-100"
            iconColor="text-emerald-600"
            isLoading={isLoading}
          />
          <KpiCard
            title="Commandes"
            value={formatNumber(data?.totalOrders ?? 0)}
            icon={ShoppingCart}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
            isLoading={isLoading}
          />
        </div>

        {/* Products List (Full width at this level) */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-gray-500" />
                <div>
                  <CardTitle className="text-base">
                    Produits de la sélection
                  </CardTitle>
                  <p className="text-xs text-gray-500">
                    Performance des produits vendus via cette sélection
                  </p>
                </div>
              </div>
              {data?.topProducts && data.topProducts.length > 0 && (
                <Badge variant="outline" className="text-gray-500">
                  {data.topProducts.length} produit
                  {data.topProducts.length > 1 ? 's' : ''} vendus
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : data?.topProducts && data.topProducts.length > 0 ? (
              <div>
                {data.topProducts.map((product, index) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    rank={index + 1}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Package className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">Aucun produit vendu</p>
                <p className="text-sm text-gray-400 mt-1">
                  Cette sélection n'a pas généré de ventes sur la période
                  sélectionnée
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Breadcrumb Navigation */}
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
          <Link
            href={`/canaux-vente/linkme/analytics/performance/${affiliateId}`}
            className="hover:text-gray-700"
          >
            {data?.affiliateName || 'Affilié'}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-gray-900 font-medium">
            {data?.selectionName || 'Sélection'}
          </span>
        </div>
      </div>
    </div>
  );
}
