'use client';

import React from 'react';

import { TrendingUp, Activity, Clock, BarChart3 } from 'lucide-react';

// FIXME: StockKPICard component can't be imported from apps/back-office in package
// import { StockKPICard } from '@/components/ui-v2/stock/stock-kpi-card';

import type { MovementsStats } from '../../hooks';

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
      {/* FIXME: StockKPICard component can't be imported from apps/back-office */}
      <div className="p-4 border rounded">
        <p className="font-medium">Total Mouvements</p>
        <p className="text-2xl">{formatNumber(stats.totalMovements)}</p>
        <p className="text-sm text-gray-500">mouvements effectués</p>
      </div>

      <div className="p-4 border rounded">
        <p className="font-medium">Aujourd'hui</p>
        <p className="text-2xl">{formatNumber(stats.movementsToday)}</p>
        <p className="text-sm text-gray-500">mouvements ce jour</p>
      </div>

      <div className="p-4 border rounded">
        <p className="font-medium">Cette Semaine</p>
        <p className="text-2xl">{formatNumber(stats.movementsThisWeek)}</p>
        <p className="text-sm text-gray-500">mouvements 7 derniers jours</p>
      </div>

      <div className="p-4 border rounded">
        <p className="font-medium">Ce Mois</p>
        <p className="text-2xl">{formatNumber(stats.movementsThisMonth)}</p>
        <p className="text-sm text-gray-500">mouvements 30 derniers jours</p>
      </div>
    </div>
  );
}
