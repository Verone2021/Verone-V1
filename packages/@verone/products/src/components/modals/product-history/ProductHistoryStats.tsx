'use client';

import { Package, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

import type { HistoryStats } from './types';

interface ProductHistoryStatsProps {
  stats: HistoryStats;
}

export function ProductHistoryStats({ stats }: ProductHistoryStatsProps) {
  return (
    <div className="grid grid-cols-4 gap-3 p-4 bg-gray-50 border-b border-gray-200">
      <div className="flex flex-col">
        <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
          <BarChart3 className="h-3 w-3" />
          Total Mouvements
        </div>
        <div className="text-2xl font-bold text-black">{stats.total}</div>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
          <TrendingUp className="h-3 w-3" />
          Entrées
        </div>
        <div className="text-2xl font-bold text-black">+{stats.totalIn}</div>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
          <TrendingDown className="h-3 w-3" />
          Sorties
        </div>
        <div className="text-2xl font-bold text-gray-700">
          -{stats.totalOut}
        </div>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
          <Package className="h-3 w-3" />
          Variation Nette
        </div>
        <div
          className={`text-2xl font-bold ${stats.netChange >= 0 ? 'text-black' : 'text-red-600'}`}
        >
          {stats.netChange >= 0 ? '+' : ''}
          {stats.netChange}
        </div>
      </div>
    </div>
  );
}
