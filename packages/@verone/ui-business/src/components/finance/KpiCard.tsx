'use client';

import * as React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { cn } from '@verone/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

import { Money } from './Money';

/**
 * Props pour le composant KpiCard
 */
export interface KpiCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Titre du KPI */
  title: string;
  /** Valeur principale */
  value: number | string;
  /** Type de valeur (money, number, percent) */
  valueType?: 'money' | 'number' | 'percent';
  /** Devise si type money */
  currency?: string;
  /** Valeur de comparaison (période précédente) */
  previousValue?: number;
  /** Label pour la comparaison */
  comparisonLabel?: string;
  /** Icône à afficher */
  icon?: React.ReactNode;
  /** Description additionnelle */
  description?: string;
  /** Tendance forcée (override le calcul auto) */
  trend?: 'up' | 'down' | 'neutral';
  /** Couleur de la card */
  variant?: 'default' | 'success' | 'warning' | 'danger';
  /** Afficher en mode compact */
  compact?: boolean;
  /** En chargement */
  loading?: boolean;
}

/**
 * Calcule la variation entre deux valeurs
 */
function calculateChange(
  current: number,
  previous: number
): { percent: number; trend: 'up' | 'down' | 'neutral' } {
  if (previous === 0) {
    return {
      percent: current > 0 ? 100 : 0,
      trend: current > 0 ? 'up' : 'neutral',
    };
  }
  const change = ((current - previous) / previous) * 100;
  return {
    percent: Math.abs(change),
    trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
  };
}

const variantClasses = {
  default: '',
  success: 'border-green-200 dark:border-green-800',
  warning: 'border-yellow-200 dark:border-yellow-800',
  danger: 'border-red-200 dark:border-red-800',
};

const trendColors = {
  up: 'text-green-600 dark:text-green-400',
  down: 'text-red-600 dark:text-red-400',
  neutral: 'text-muted-foreground',
};

/**
 * Composant KpiCard - Carte KPI avec valeur, tendance et comparaison
 *
 * @example
 * <KpiCard
 *   title="Chiffre d'affaires"
 *   value={125000}
 *   valueType="money"
 *   previousValue={110000}
 *   comparisonLabel="vs mois dernier"
 * />
 */
export function KpiCard({
  title,
  value,
  valueType = 'number',
  currency = 'EUR',
  previousValue,
  comparisonLabel = 'vs période précédente',
  icon,
  description,
  trend: forcedTrend,
  variant = 'default',
  compact = false,
  loading = false,
  className,
  ...props
}: KpiCardProps) {
  // Calculer la variation si on a une valeur précédente
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  const change =
    previousValue !== undefined
      ? calculateChange(numericValue, previousValue)
      : null;

  // Utiliser la tendance forcée ou calculée
  const actualTrend = forcedTrend || change?.trend || 'neutral';

  // Icône de tendance
  const TrendIcon =
    actualTrend === 'up'
      ? TrendingUp
      : actualTrend === 'down'
        ? TrendingDown
        : Minus;

  // Rendu de la valeur selon le type
  const renderValue = () => {
    if (loading) {
      return <div className="h-8 w-24 bg-muted animate-pulse rounded" />;
    }

    switch (valueType) {
      case 'money':
        return (
          <Money
            amount={numericValue}
            currency={currency}
            size={compact ? 'lg' : 'xl'}
            bold
          />
        );
      case 'percent':
        return (
          <span
            className={cn(
              'font-bold tabular-nums',
              compact ? 'text-lg' : 'text-2xl'
            )}
          >
            {numericValue.toFixed(1)}%
          </span>
        );
      default:
        return (
          <span
            className={cn(
              'font-bold tabular-nums',
              compact ? 'text-lg' : 'text-2xl'
            )}
          >
            {numericValue.toLocaleString('fr-FR')}
          </span>
        );
    }
  };

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center justify-between p-3 rounded-lg border bg-card',
          variantClasses[variant],
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <span className="text-sm text-muted-foreground">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {renderValue()}
          {change && (
            <span
              className={cn(
                'text-xs flex items-center',
                trendColors[actualTrend]
              )}
            >
              <TrendIcon className="h-3 w-3" />
              {change.percent.toFixed(1)}%
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={cn(variantClasses[variant], className)} {...props}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">{renderValue()}</div>

        {/* Comparaison avec période précédente */}
        {change && !loading && (
          <p
            className={cn(
              'text-xs mt-1 flex items-center gap-1',
              trendColors[actualTrend]
            )}
          >
            <TrendIcon className="h-3 w-3" />
            <span className="font-medium">{change.percent.toFixed(1)}%</span>
            <span className="text-muted-foreground">{comparisonLabel}</span>
          </p>
        )}

        {/* Description */}
        {description && !loading && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Grid de KPI cards
 */
export function KpiGrid({
  children,
  columns = 4,
  className,
}: {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const colClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', colClasses[columns], className)}>
      {children}
    </div>
  );
}
