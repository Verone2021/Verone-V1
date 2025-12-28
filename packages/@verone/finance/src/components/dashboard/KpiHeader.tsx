'use client';

/**
 * KpiHeader - Ligne de 5 KPIs critiques
 * Design: Grid responsive avec KpiCards
 */

import {
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  Clock,
  TrendingUp,
} from 'lucide-react';

import { KpiCard } from './KpiCard';
import type {
  TreasuryForecast,
  TreasuryStats,
} from '../../hooks/use-treasury-stats';

interface KpiHeaderProps {
  stats: TreasuryStats | null;
  bankBalance: number | null;
  forecasts: TreasuryForecast[];
  isLoading?: boolean;
}

export function KpiHeader({
  stats,
  bankBalance,
  forecasts,
  isLoading,
}: KpiHeaderProps) {
  // Calculer la variation mensuelle (approximation)
  const monthlyVariation = stats
    ? ((stats.net_cash_flow / (stats.total_paid_ar || 1)) * 100).toFixed(1)
    : 0;

  // Calculer le runway (mois restants basé sur les sorties moyennes)
  const avgMonthlyOutbound = stats ? stats.total_paid_ap / 12 : 0;
  const runway =
    bankBalance && avgMonthlyOutbound > 0
      ? bankBalance / avgMonthlyOutbound
      : 0;

  // Forecast 30 jours
  const forecast30 = forecasts.find(f => f.period === '30d');

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
      {/* Solde Bancaire */}
      <KpiCard
        title="Solde bancaire"
        value={bankBalance || 0}
        format="currency"
        icon={<Banknote size={18} className="text-blue-500" />}
        isLoading={isLoading}
        subtitle="Qonto"
      />

      {/* Entrées du mois */}
      <KpiCard
        title="Entrées"
        value={stats?.total_paid_ar || 0}
        format="currency"
        icon={<ArrowUpCircle size={18} className="text-green-500" />}
        variant="positive"
        isLoading={isLoading}
        subtitle="Ce mois"
      />

      {/* Sorties du mois */}
      <KpiCard
        title="Sorties"
        value={stats?.total_paid_ap || 0}
        format="currency"
        icon={<ArrowDownCircle size={18} className="text-red-500" />}
        variant="negative"
        isLoading={isLoading}
        subtitle="Ce mois"
      />

      {/* Variation */}
      <KpiCard
        title="Cash Flow Net"
        value={stats?.net_cash_flow || 0}
        format="currency"
        icon={<TrendingUp size={18} className="text-violet-500" />}
        trend={
          (stats?.net_cash_flow || 0) > 0
            ? 'up'
            : (stats?.net_cash_flow || 0) < 0
              ? 'down'
              : 'neutral'
        }
        trendValue={Number(monthlyVariation)}
        isLoading={isLoading}
      />

      {/* Runway */}
      <KpiCard
        title="Runway"
        value={runway}
        format="months"
        icon={<Clock size={18} className="text-amber-500" />}
        isLoading={isLoading}
        subtitle={
          forecast30
            ? `Prévision 30j: ${forecast30.projected_balance > 0 ? '+' : ''}${(forecast30.projected_balance / 1000).toFixed(0)}k€`
            : undefined
        }
      />
    </div>
  );
}
