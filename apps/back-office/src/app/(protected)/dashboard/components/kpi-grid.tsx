'use client';

import React from 'react';

import { cn } from '@verone/ui';

import { SimpleKPICard } from './simple-kpi-card';
import type { DashboardTab } from './dashboard-tabs';
import {
  getKPIsForTab,
  TREND_PATHS,
  type StaticKPIDefinition,
} from '../lib/static-kpis';

interface KPIGridProps {
  activeTab: DashboardTab;
  metrics: Record<string, unknown>;
  className?: string;
}

/**
 * Extrait une valeur d'un objet imbriqué via un chemin (ex: "orders.monthRevenue")
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, key: string) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/**
 * Extrait le trend réel depuis les métriques basé sur la catégorie du KPI
 */
function getTrendForKPI(
  metrics: Record<string, unknown>,
  category: string
): { value: number; isPositive: boolean } | undefined {
  const trendPath = TREND_PATHS[category];
  if (!trendPath) return undefined;

  const trendValue = getNestedValue(metrics, trendPath);
  if (typeof trendValue !== 'number' || trendValue === 0) return undefined;

  return {
    value: Math.abs(trendValue),
    isPositive: trendValue >= 0,
  };
}

export function KPIGrid({ activeTab, metrics, className }: KPIGridProps) {
  const kpis = getKPIsForTab(activeTab);

  return (
    <div
      className={cn(
        'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3',
        className
      )}
    >
      {kpis.map((kpiDef: StaticKPIDefinition) => {
        // Extraire la valeur depuis les métriques
        const rawValue = getNestedValue(metrics, kpiDef.dataKey);
        const value =
          typeof rawValue === 'number' || typeof rawValue === 'string'
            ? rawValue
            : null;

        // Extraire le trend réel depuis les métriques
        const trend = kpiDef.showTrend
          ? getTrendForKPI(metrics, kpiDef.category)
          : undefined;

        return (
          <SimpleKPICard
            key={kpiDef.id}
            kpiDef={kpiDef}
            value={value}
            trend={trend}
          />
        );
      })}
    </div>
  );
}
