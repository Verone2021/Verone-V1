'use client';

import React from 'react';

import { useRouter } from 'next/navigation';

import { cn } from '@verone/ui';
import { ArrowUp, ArrowDown } from 'lucide-react';

import type { StaticKPIDefinition } from '../lib/static-kpis';

interface SimpleKPICardProps {
  kpiDef: StaticKPIDefinition;
  value: number | string | null;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function SimpleKPICard({
  kpiDef,
  value,
  trend,
  className,
}: SimpleKPICardProps) {
  const router = useRouter();
  const Icon = kpiDef.icon;

  // Format value based on type
  const formattedValue = React.useMemo(() => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'string') return value;

    switch (kpiDef.format) {
      case 'currency':
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      case 'percent':
        return `${value.toFixed(1)}%`;
      case 'number':
      default:
        return new Intl.NumberFormat('fr-FR').format(value);
    }
  }, [value, kpiDef.format]);

  // Get navigation path based on category
  const getNavigationPath = () => {
    switch (kpiDef.category) {
      case 'sales':
        return '/commandes/clients';
      case 'stock':
        return '/stocks';
      case 'finance':
        return '/finances';
      case 'linkme':
        return '/canaux-vente/linkme';
      default:
        return null;
    }
  };

  const handleClick = () => {
    const path = getNavigationPath();
    if (path) {
      router.push(path);
    }
  };

  return (
    <div
      className={cn(
        'relative bg-white rounded-xl border border-slate-200 p-4 transition-all duration-200',
        'cursor-pointer hover:shadow-md hover:-translate-y-0.5',
        className
      )}
      onClick={handleClick}
    >
      {/* Icon */}
      <div
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center mb-2',
          kpiDef.category === 'sales' && 'bg-blue-50 text-blue-600',
          kpiDef.category === 'stock' && 'bg-purple-50 text-purple-600',
          kpiDef.category === 'finance' && 'bg-green-50 text-green-600',
          kpiDef.category === 'linkme' && 'bg-orange-50 text-orange-600',
          kpiDef.category === 'general' && 'bg-slate-50 text-slate-600'
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      {/* Label */}
      <h3 className="text-sm font-medium text-slate-600 mb-1">
        {kpiDef.label}
      </h3>

      {/* Value */}
      <div className="flex items-end gap-2">
        <span className="text-xl font-bold text-slate-900 font-mono">
          {formattedValue}
        </span>

        {/* Trend */}
        {kpiDef.showTrend && trend && (
          <div
            className={cn(
              'flex items-center gap-0.5 text-sm font-medium mb-1',
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            )}
          >
            {trend.isPositive ? (
              <ArrowUp className="h-3.5 w-3.5" />
            ) : (
              <ArrowDown className="h-3.5 w-3.5" />
            )}
            <span>{Math.abs(trend.value).toFixed(1)}%</span>
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-slate-400 mt-1 truncate">
        {kpiDef.description}
      </p>
    </div>
  );
}
