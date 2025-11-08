'use client';

import React from 'react';

import { TrendingUp, Activity, Clock, BarChart3 } from 'lucide-react';

import { StockKPICard } from '@/components/ui-v2/stock/stock-kpi-card';
import type { MovementsStats } from '@/shared/modules/stock/hooks';

interface MovementsStatsCardsProps {
  stats: MovementsStats | null;
  loading: boolean;
}

export function MovementsStatsCards({
  stats,
  loading,
}: MovementsStatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StockKPICard
        title="Total Mouvements"
        value={formatNumber(stats.totalMovements)}
        subtitle="mouvements effectués"
        icon={Activity}
        variant="default"
      />

      <StockKPICard
        title="Aujourd'hui"
        value={formatNumber(stats.movementsToday)}
        subtitle="mouvements ce jour"
        icon={Clock}
        variant="info"
      />

      <StockKPICard
        title="Cette Semaine"
        value={formatNumber(stats.movementsThisWeek)}
        subtitle="mouvements 7 derniers jours"
        icon={TrendingUp}
        variant="success"
      />

      <StockKPICard
        title="Ce Mois"
        value={formatNumber(stats.movementsThisMonth)}
        subtitle="mouvements 30 derniers jours"
        icon={BarChart3}
        variant="default"
      />
    </div>
  );
}
