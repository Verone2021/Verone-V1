'use client';

/**
 * Page Analytics LinkMe - Vue d'ensemble
 *
 * Refonte 2025-12-17:
 * - Filtre "Tout" pour voir toutes les données
 * - Filtre par année + mois (multi-sélection)
 * - Bouton Actualiser
 * - KPIs non tronqués
 *
 * @module LinkMeAnalyticsPage
 * @since 2025-12-17
 */

import { useState, useMemo, useCallback } from 'react';

import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Skeleton } from '@verone/ui';
import { Button } from '@verone/ui';
import {
  BarChart3,
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  ShoppingBag,
  Wallet,
  ArrowRight,
  Clock,
  CheckCircle,
  Banknote,
} from 'lucide-react';

import { LinkMeRevenueChart } from '../components/charts/LinkMeRevenueChart';
import { TopAffiliatesChart } from '../components/charts/TopAffiliatesChart';
import {
  AnalyticsDateFilter,
  getDateRangeForFilters,
  ALL_YEARS_VALUE,
  type AnalyticsFilters,
} from '../components/AnalyticsDateFilter';
import { useLinkMeAnalytics } from '../hooks/use-linkme-analytics';

// ============================================================================
// Config
// ============================================================================

// Années disponibles (depuis première commande LinkMe: février 2024)
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
// KPI Card Component (Compact)
// ============================================================================

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconBgColor: string;
  iconColor: string;
  isLoading?: boolean;
  valueColor?: string;
}

function KpiCard({
  title,
  value,
  icon: Icon,
  iconBgColor,
  iconColor,
  isLoading,
  valueColor = 'text-gray-900',
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
                <Skeleton className="h-6 w-20 mb-1" />
                <Skeleton className="h-4 w-16" />
              </>
            ) : (
              <>
                <p className={`text-xl font-bold ${valueColor}`}>{value}</p>
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
// Commission Status Card (Compact)
// ============================================================================

interface CommissionStatusProps {
  pendingHT: number;
  validatedHT: number;
  paidHT: number;
  isLoading: boolean;
}

function CommissionStatusCard({
  pendingHT,
  validatedHT,
  paidHT,
  isLoading,
}: CommissionStatusProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Wallet className="h-4 w-4 text-gray-500" />
          Commissions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {/* En attente */}
          <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
            <Clock className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              {isLoading ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                <p className="text-lg font-bold text-amber-700">
                  {formatCurrency(pendingHT)}
                </p>
              )}
              <p className="text-xs text-amber-600">En attente</p>
            </div>
          </div>

          {/* Validées */}
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <CheckCircle className="h-5 w-5 text-blue-600 shrink-0" />
            <div>
              {isLoading ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                <p className="text-lg font-bold text-blue-700">
                  {formatCurrency(validatedHT)}
                </p>
              )}
              <p className="text-xs text-blue-600">Validées</p>
            </div>
          </div>

          {/* Payées */}
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <Banknote className="h-5 w-5 text-green-600 shrink-0" />
            <div>
              {isLoading ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                <p className="text-lg font-bold text-green-700">
                  {formatCurrency(paidHT)}
                </p>
              )}
              <p className="text-xs text-green-600">Payées</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export default function LinkMeAnalyticsPage() {
  // State for filters - default to "Tout" (year = 0)
  const [filters, setFilters] = useState<AnalyticsFilters>({
    year: ALL_YEARS_VALUE,
    months: [],
  });

  // Calculate date range from filters
  const dateRange = useMemo(() => getDateRangeForFilters(filters), [filters]);

  // Handler for filter changes
  const handleFiltersChange = useCallback((newFilters: AnalyticsFilters) => {
    setFilters(newFilters);
  }, []);

  // Fetch data with new filter system
  const { data, isLoading, error, refetch } = useLinkMeAnalytics('year', {
    year: filters.year,
    startDate: dateRange.startDate ?? undefined,
    endDate: dateRange.endDate ?? undefined,
  });

  // Handler for refresh button
  const handleRefresh = useCallback(() => {
    void refetch().catch(error => {
      console.error('[LinkMeAnalytics] refetch failed:', error);
    });
  }, [refetch]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Analytics</h1>
              <p className="text-sm text-gray-500">Vue d'ensemble LinkMe</p>
            </div>
          </div>

          {/* Performance Link */}
          <Link href="/canaux-vente/linkme/analytics/performance">
            <Button variant="outline" size="sm" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Performance détaillée
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>

        {/* Filters Row - Below header */}
        <div className="mt-4">
          <AnalyticsDateFilter
            filters={filters}
            availableYears={AVAILABLE_YEARS}
            onFiltersChange={handleFiltersChange}
            onRefresh={handleRefresh}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto space-y-6">
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            Erreur lors du chargement des données: {error}
          </div>
        )}

        {/* KPIs Row */}
        <div className="grid grid-cols-4 gap-4">
          <KpiCard
            title="Affiliés actifs"
            value={formatNumber(data?.activeAffiliates || 0)}
            icon={Users}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
            isLoading={isLoading}
          />
          <KpiCard
            title="Commandes"
            value={formatNumber(data?.totalOrders || 0)}
            icon={ShoppingCart}
            iconBgColor="bg-purple-100"
            iconColor="text-purple-600"
            isLoading={isLoading}
          />
          <KpiCard
            title="CA HT"
            value={formatCurrency(data?.totalRevenue || 0)}
            icon={DollarSign}
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
            isLoading={isLoading}
          />
          <KpiCard
            title="Panier moyen"
            value={formatCurrency(data?.averageBasket || 0)}
            icon={ShoppingBag}
            iconBgColor="bg-orange-100"
            iconColor="text-orange-600"
            isLoading={isLoading}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                Évolution du CA
              </CardTitle>
              <p className="text-xs text-gray-500">
                Chiffre d'affaires sur la période
              </p>
            </CardHeader>
            <CardContent>
              <LinkMeRevenueChart
                data={data?.revenueByPeriod || []}
                period="year"
                isLoading={isLoading}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                Top Affiliés
              </CardTitle>
              <p className="text-xs text-gray-500">
                Classement par chiffre d'affaires
              </p>
            </CardHeader>
            <CardContent>
              <TopAffiliatesChart
                data={data?.topAffiliates || []}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </div>

        {/* Commissions Status */}
        <CommissionStatusCard
          pendingHT={data?.commissionsByStatus?.pendingHT || 0}
          validatedHT={data?.commissionsByStatus?.validatedHT || 0}
          paidHT={data?.commissionsByStatus?.paidHT || 0}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
