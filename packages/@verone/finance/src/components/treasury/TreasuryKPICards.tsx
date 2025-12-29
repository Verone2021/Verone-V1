'use client';

import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@verone/ui';
import { cn } from '@verone/utils';
import {
  TrendingUp,
  TrendingDown,
  Flame,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
} from 'lucide-react';

import type {
  TreasuryMetrics,
  TreasuryStats,
} from '../../hooks/use-treasury-stats';

interface TreasuryKPICardsProps {
  metrics: TreasuryMetrics | null;
  stats: TreasuryStats | null;
  isLoading: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatMonths = (months: number) => {
  if (months >= 999) return '∞';
  if (months >= 12)
    return `${Math.floor(months / 12)} an${Math.floor(months / 12) > 1 ? 's' : ''}`;
  return `${months.toFixed(1)} mois`;
};

export function TreasuryKPICards({
  metrics,
  stats,
  isLoading,
}: TreasuryKPICardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-1" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const runwayMonths = metrics?.runwayMonths ?? 0;
  const burnRate = metrics?.burnRate ?? 0;
  const cashFlowNet = metrics?.cashFlowNet ?? 0;
  const cashFlowVariation = metrics?.cashFlowVariation ?? 0;

  // AR/AP totals - total_invoiced_* contient déjà le montant impayé (from financial_documents)
  const arTotal = stats?.total_invoiced_ar ?? 0;
  const apTotal = stats?.total_invoiced_ap ?? 0;

  const kpis = [
    {
      title: 'Autonomie',
      value: formatMonths(runwayMonths),
      description:
        runwayMonths < 3
          ? 'Attention: moins de 3 mois'
          : 'Trésorerie sécurisée',
      icon: Clock,
      color:
        runwayMonths >= 6
          ? 'text-emerald-600'
          : runwayMonths >= 3
            ? 'text-amber-600'
            : 'text-destructive',
      bgColor:
        runwayMonths >= 6
          ? 'bg-emerald-50'
          : runwayMonths >= 3
            ? 'bg-amber-50'
            : 'bg-red-50',
    },
    {
      title: 'Dépenses Mensuelles',
      value: formatCurrency(burnRate),
      description: 'Moyenne sur 6 mois',
      icon: Flame,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Flux de Trésorerie',
      value: formatCurrency(cashFlowNet),
      description:
        cashFlowVariation !== 0 ? (
          <span
            className={cn(
              'flex items-center gap-1',
              cashFlowVariation >= 0 ? 'text-emerald-600' : 'text-destructive'
            )}
          >
            {cashFlowVariation >= 0 ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(cashFlowVariation).toFixed(1)}% vs mois précédent
          </span>
        ) : (
          'Ce mois'
        ),
      icon: cashFlowNet >= 0 ? TrendingUp : TrendingDown,
      color: cashFlowNet >= 0 ? 'text-emerald-600' : 'text-destructive',
      bgColor: cashFlowNet >= 0 ? 'bg-emerald-50' : 'bg-red-50',
    },
    {
      title: 'Créances / Dettes',
      value: (
        <div className="flex items-center gap-2 text-lg">
          <span className="text-emerald-600">+{formatCurrency(arTotal)}</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-destructive">-{formatCurrency(apTotal)}</span>
        </div>
      ),
      description: 'À recevoir / À payer',
      icon: Receipt,
      color: 'text-primary',
      bgColor: 'bg-primary/5',
      isComplex: true,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {kpi.title}
            </CardTitle>
            <div className={cn('p-2 rounded-full', kpi.bgColor)}>
              <kpi.icon className={cn('h-4 w-4', kpi.color)} />
            </div>
          </CardHeader>
          <CardContent>
            {kpi.isComplex ? (
              kpi.value
            ) : (
              <div className={cn('text-2xl font-bold', kpi.color)}>
                {kpi.value}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {kpi.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
