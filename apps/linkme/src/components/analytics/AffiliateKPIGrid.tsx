/**
 * AffiliateKPIGrid
 * Grille des KPIs principaux pour l'affilié
 *
 * 6 KPIs avec sparklines et tendances :
 * - Commandes totales
 * - CA HT
 * - Commissions TTC gagnées
 * - Commissions en attente
 * - Panier moyen
 * - Taux de conversion
 */

'use client';

import { Card, SparkAreaChart, BadgeDelta } from '@tremor/react';
import {
  ShoppingCart,
  DollarSign,
  Wallet,
  Clock,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';

import type {
  AffiliateAnalyticsData,
  RevenueDataPoint,
} from '../../types/analytics';
import {
  formatCurrency,
  formatPercentage,
  formatCompactNumber,
} from '../../types/analytics';

interface AffiliateKPIGridProps {
  data: AffiliateAnalyticsData | null | undefined;
  isLoading: boolean;
}

interface KPICardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  iconColor: string;
  iconBgColor: string;
  sparklineData?: { value: number }[];
  trend?: number;
  subtitle?: string;
  isLoading?: boolean;
}

function KPICard({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBgColor,
  sparklineData,
  trend,
  subtitle,
  isLoading,
}: KPICardProps) {
  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse">
          <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
          <div className="h-6 bg-gray-200 rounded w-24 mb-1.5" />
          <div className="h-2.5 bg-gray-200 rounded w-16" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
          )}
          {trend !== undefined && (
            <div className="mt-1">
              <BadgeDelta
                deltaType={trend >= 0 ? 'increase' : 'decrease'}
                size="sm"
              >
                {trend >= 0 ? '+' : ''}
                {trend.toFixed(1)}%
              </BadgeDelta>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className={`p-2 rounded-lg ${iconBgColor}`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
          {sparklineData && sparklineData.length > 1 && (
            <SparkAreaChart
              data={sparklineData}
              categories={['value']}
              index="date"
              colors={['cyan']}
              className="h-8 w-16"
              curveType="monotone"
            />
          )}
        </div>
      </div>
    </Card>
  );
}

export function AffiliateKPIGrid({ data, isLoading }: AffiliateKPIGridProps) {
  // Préparer les données sparkline depuis revenueByPeriod
  const sparklineData =
    data?.revenueByPeriod?.map((d: RevenueDataPoint) => ({
      date: d.label,
      value: d.revenue,
    })) ?? [];

  const ordersSparkline =
    data?.revenueByPeriod?.map((d: RevenueDataPoint) => ({
      date: d.label,
      value: d.orders,
    })) ?? [];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* Commandes totales */}
      <KPICard
        title="Commandes"
        value={data?.totalOrders?.toString() ?? '0'}
        icon={ShoppingCart}
        iconColor="text-blue-600"
        iconBgColor="bg-blue-100"
        sparklineData={ordersSparkline}
        isLoading={isLoading}
      />

      {/* CA Total HT */}
      <KPICard
        title="Chiffre d'affaires"
        value={formatCurrency(data?.totalRevenueHT ?? 0)}
        icon={DollarSign}
        iconColor="text-emerald-600"
        iconBgColor="bg-emerald-100"
        sparklineData={sparklineData}
        subtitle="HT"
        isLoading={isLoading}
      />

      {/* Commissions gagnées TTC */}
      <KPICard
        title="Commissions gagnées"
        value={formatCurrency(data?.totalCommissionsTTC ?? 0)}
        icon={Wallet}
        iconColor="text-green-600"
        iconBgColor="bg-green-100"
        subtitle="TTC"
        isLoading={isLoading}
      />

      {/* Commissions en attente */}
      <KPICard
        title="En attente"
        value={formatCurrency(data?.pendingCommissionsTTC ?? 0)}
        icon={Clock}
        iconColor="text-orange-600"
        iconBgColor="bg-orange-100"
        subtitle="À verser"
        isLoading={isLoading}
      />

      {/* Panier moyen */}
      <KPICard
        title="Panier moyen"
        value={formatCurrency(data?.averageBasket ?? 0)}
        icon={ShoppingBag}
        iconColor="text-purple-600"
        iconBgColor="bg-purple-100"
        isLoading={isLoading}
      />

      {/* Taux de conversion */}
      <KPICard
        title="Taux conversion"
        value={formatPercentage(data?.conversionRate ?? 0)}
        icon={TrendingUp}
        iconColor="text-cyan-600"
        iconBgColor="bg-cyan-100"
        subtitle={`${formatCompactNumber(data?.totalViews ?? 0)} vues`}
        isLoading={isLoading}
      />
    </div>
  );
}

export default AffiliateKPIGrid;
