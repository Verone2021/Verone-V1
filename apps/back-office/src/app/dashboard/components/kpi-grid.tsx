'use client';

import React from 'react';

import { cn } from '@verone/ui';
import { Button } from '@verone/ui';
import { Plus } from 'lucide-react';

import { ConfigurableKPICard } from './configurable-kpi-card';
import type { DashboardWidget } from '../hooks/use-dashboard-preferences';
import { KPI_CATALOG, type KPIPeriod } from '../lib/kpi-catalog';

interface KPIGridProps {
  widgets: DashboardWidget[];
  metrics: Record<string, unknown>;
  isConfigMode?: boolean;
  onPeriodChange?: (kpiId: string, period: KPIPeriod) => void;
  onRemoveWidget?: (kpiId: string) => void;
  onAddWidget?: () => void;
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
 * Mapping des catégories de KPI vers les chemins de trend dans metrics
 */
const TREND_PATHS: Record<string, string> = {
  sales: 'orders.trend',
  stock: 'stocks.trend',
  finance: 'treasury.trend',
  linkme: 'linkme.trend',
  general: 'products.trend',
};

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

export function KPIGrid({
  widgets,
  metrics,
  isConfigMode = false,
  onPeriodChange,
  onRemoveWidget,
  onAddWidget,
  className,
}: KPIGridProps) {
  // Limiter à 6 KPIs max
  const displayedWidgets = widgets.slice(0, 6);
  const canAddMore = widgets.length < 6;

  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
        className
      )}
    >
      {displayedWidgets.map(widget => {
        const kpiDef = KPI_CATALOG[widget.kpi_id];

        if (!kpiDef) {
          console.warn(`KPI not found in catalog: ${widget.kpi_id}`);
          return null;
        }

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
          <ConfigurableKPICard
            key={widget.kpi_id}
            kpiDef={kpiDef}
            value={value}
            trend={trend}
            period={widget.period}
            isConfigMode={isConfigMode}
            onPeriodChange={
              onPeriodChange
                ? period => onPeriodChange(widget.kpi_id, period)
                : undefined
            }
            onRemove={
              onRemoveWidget ? () => onRemoveWidget(widget.kpi_id) : undefined
            }
          />
        );
      })}

      {/* Bouton Ajouter (visible si moins de 6 KPIs et en mode config ou hover) */}
      {canAddMore && onAddWidget && (
        <Button
          variant="outline"
          className={cn(
            'h-full min-h-[110px] border-dashed border-2 border-slate-200',
            'flex flex-col items-center justify-center gap-2',
            'text-slate-400 hover:text-slate-600 hover:border-slate-300',
            'transition-all duration-200'
          )}
          onClick={onAddWidget}
        >
          <Plus className="h-5 w-5" />
          <span className="text-xs font-medium">Ajouter un KPI</span>
        </Button>
      )}
    </div>
  );
}
