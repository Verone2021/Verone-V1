'use client';

/**
 * KpiCard - Carte KPI individuelle
 * Design: Minimaliste, inspiré Qonto/Stripe
 */

import { cn } from '@verone/ui';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

export type KpiFormat = 'currency' | 'percent' | 'months' | 'number';
export type KpiTrend = 'up' | 'down' | 'neutral';

interface KpiCardProps {
  title: string;
  value: number;
  format: KpiFormat;
  icon: React.ReactNode;
  trend?: KpiTrend;
  trendValue?: number;
  subtitle?: string;
  isLoading?: boolean;
  variant?: 'default' | 'positive' | 'negative';
}

function formatValue(value: number, format: KpiFormat): string {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(value);
    case 'percent':
      return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
    case 'months':
      return `${value.toFixed(1)} mois`;
    case 'number':
      return new Intl.NumberFormat('fr-FR').format(value);
    default:
      return String(value);
  }
}

export function KpiCard({
  title,
  value,
  format,
  icon,
  trend,
  trendValue,
  subtitle,
  isLoading,
  variant = 'default',
}: KpiCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="mt-3 h-8 w-28 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-3 w-20 animate-pulse rounded bg-slate-100" />
      </div>
    );
  }

  const formattedValue = formatValue(value, format);

  const valueColorClass =
    variant === 'positive'
      ? 'text-green-600'
      : variant === 'negative'
        ? 'text-red-600'
        : 'text-slate-900';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-center gap-2 text-slate-500">
        <span className="flex-shrink-0">{icon}</span>
        <span className="truncate text-sm font-medium">{title}</span>
      </div>

      {/* Value */}
      <div className={cn('mt-3 text-2xl font-bold', valueColorClass)}>
        {formattedValue}
      </div>

      {/* Trend or Subtitle */}
      {trend && trendValue !== undefined ? (
        <div
          className={cn(
            'mt-2 flex items-center gap-1 text-sm',
            trend === 'up'
              ? 'text-green-600'
              : trend === 'down'
                ? 'text-red-600'
                : 'text-slate-500'
          )}
        >
          {trend === 'up' ? (
            <ArrowUpRight size={14} />
          ) : trend === 'down' ? (
            <ArrowDownRight size={14} />
          ) : (
            <Minus size={14} />
          )}
          <span>
            {trendValue > 0 ? '+' : ''}
            {trendValue.toFixed(1)}% vs mois dernier
          </span>
        </div>
      ) : subtitle ? (
        <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
      ) : null}
    </div>
  );
}
