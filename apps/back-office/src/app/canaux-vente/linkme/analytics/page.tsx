'use client';

import { useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Badge } from '@verone/ui';
import { Tabs, TabsList, TabsTrigger } from '@verone/ui';
import { Skeleton } from '@verone/ui';
import {
  BarChart3,
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  ShoppingBag,
  Wallet,
} from 'lucide-react';

import { LinkMeRevenueChart } from '../components/charts/LinkMeRevenueChart';
import { TopAffiliatesChart } from '../components/charts/TopAffiliatesChart';
import { CommissionsStatusCard } from '../components/CommissionsStatusCard';
import { SelectionsPerformanceTable } from '../components/SelectionsPerformanceTable';
import {
  useLinkMeAnalytics,
  type AnalyticsPeriod,
} from '../hooks/use-linkme-analytics';

// ============================================
// TYPES & CONFIG
// ============================================

const PERIOD_CONFIG: Record<AnalyticsPeriod, { label: string; short: string }> =
  {
    week: { label: 'Semaine', short: '7j' },
    month: { label: 'Mois', short: '30j' },
    quarter: { label: 'Trimestre', short: '90j' },
    year: { label: 'Année', short: '365j' },
  };

// ============================================
// KPI CARD COMPONENT
// ============================================

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
      <CardContent className="pt-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBgColor}`}
          >
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <div className="min-w-0 flex-1">
            {isLoading ? (
              <>
                <Skeleton className="h-7 w-20 mb-1" />
                <Skeleton className="h-4 w-24" />
              </>
            ) : (
              <>
                <p className={`text-2xl font-bold truncate ${valueColor}`}>
                  {value}
                </p>
                <p className="text-sm text-gray-500">{title}</p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function LinkMeAnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('month');
  const { data, isLoading, error } = useLinkMeAnalytics(period);

  // Format helpers
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const formatNumber = (num: number) =>
    new Intl.NumberFormat('fr-FR').format(num);

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
              <p className="text-sm text-gray-500">
                Vue d'ensemble des performances LinkMe
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Period Tabs */}
            <Tabs
              value={period}
              onValueChange={v => setPeriod(v as AnalyticsPeriod)}
            >
              <TabsList className="bg-gray-100">
                {Object.entries(PERIOD_CONFIG).map(([key, config]) => (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className="text-xs data-[state=active]:bg-white"
                  >
                    {config.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <Badge
              variant="outline"
              className="bg-green-50 text-green-700 border-green-200"
            >
              Données en temps réel
            </Badge>
          </div>
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

        {/* KPIs principaux */}
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
            title="Commandes totales"
            value={formatNumber(data?.totalOrders || 0)}
            icon={ShoppingCart}
            iconBgColor="bg-purple-100"
            iconColor="text-purple-600"
            isLoading={isLoading}
          />
          <KpiCard
            title="Chiffre d'affaires"
            value={formatCurrency(data?.totalRevenue || 0)}
            icon={DollarSign}
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
            isLoading={isLoading}
          />
          <KpiCard
            title="Taux de conversion"
            value={`${(data?.conversionRate || 0).toFixed(1)}%`}
            icon={TrendingUp}
            iconBgColor="bg-yellow-100"
            iconColor="text-yellow-600"
            isLoading={isLoading}
          />
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                Évolution du chiffre d'affaires
              </CardTitle>
              <p className="text-xs text-gray-500">
                CA sur les {PERIOD_CONFIG[period].short} derniers
              </p>
            </CardHeader>
            <CardContent>
              <LinkMeRevenueChart
                data={data?.revenueByPeriod || []}
                period={period}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                Top 10 Affiliés
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

        {/* Performance Sélections */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Performance des sélections
            </CardTitle>
            <p className="text-xs text-gray-500">Métriques par mini-boutique</p>
          </CardHeader>
          <CardContent>
            <SelectionsPerformanceTable
              data={data?.selectionsPerformance || []}
              isLoading={isLoading}
              maxRows={5}
            />
          </CardContent>
        </Card>

        {/* Commissions */}
        <CommissionsStatusCard
          statusData={
            data?.commissionsByStatus || {
              pendingHT: 0,
              validatedHT: 0,
              paidHT: 0,
              pendingTTC: 0,
              validatedTTC: 0,
              paidTTC: 0,
            }
          }
          pendingCommissions={data?.topPendingCommissions || []}
          isLoading={isLoading}
        />

        {/* Stats secondaires */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100">
                  <Package className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold">
                      {formatNumber(data?.totalSelections || 0)}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">Sélections actives</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100">
                  <ShoppingBag className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <p className="text-2xl font-bold">
                      {formatCurrency(data?.averageBasket || 0)}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">Panier moyen</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
                  <Wallet className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(data?.totalPaidCommissionsHT || 0)} HT
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatCurrency(data?.totalPaidCommissionsTTC || 0)} TTC
                      </p>
                    </>
                  )}
                  <p className="text-sm text-gray-500">Commissions versées</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
