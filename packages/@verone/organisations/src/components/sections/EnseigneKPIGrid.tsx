'use client';

/**
 * EnseigneKPIGrid - Grille de KPIs pour page détail enseigne
 *
 * Affiche :
 * - Nombre d'organisations
 * - CA Total
 * - CA Moyen
 * - Nombre de villes
 *
 * @module EnseigneKPIGrid
 */

import { StockKPICard } from '@verone/ui';
import { cn } from '@verone/utils';
import { Building2, TrendingUp, BarChart3, MapPin } from 'lucide-react';

import type { EnseigneStats } from '../../hooks/use-enseigne-stats';

interface EnseigneKPIGridProps {
  stats: EnseigneStats | null;
  loading?: boolean;
  className?: string;
}

/**
 * Formater un montant en euros
 */
function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1).replace('.', ',')} M€`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace('.', ',')} k€`;
  }
  return `${value.toLocaleString('fr-FR')} €`;
}

/**
 * Skeleton de KPI pour loading
 */
function KPISkeleton() {
  return (
    <div className="h-20 bg-white rounded-lg border animate-pulse">
      <div className="h-full p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="w-24 h-3 bg-gray-200 rounded" />
          <div className="w-16 h-6 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

/**
 * Grille de 4 KPIs pour enseigne
 * Pattern inspiré de StockKPICard
 */
export function EnseigneKPIGrid({
  stats,
  loading = false,
  className,
}: EnseigneKPIGridProps) {
  if (loading) {
    return (
      <div className={cn('grid grid-cols-4 gap-4', className)}>
        <KPISkeleton />
        <KPISkeleton />
        <KPISkeleton />
        <KPISkeleton />
      </div>
    );
  }

  const totalOrganisations = stats?.totalOrganisations ?? 0;
  const totalRevenue = stats?.totalRevenue ?? 0;
  const averageRevenue = stats?.averageRevenue ?? 0;
  const citiesCount = stats?.citiesCount ?? 0;

  return (
    <div className={cn('grid grid-cols-4 gap-4', className)}>
      {/* Organisations */}
      <StockKPICard
        title="Organisations"
        value={totalOrganisations}
        icon={Building2}
        variant="default"
        subtitle={`${totalOrganisations > 1 ? 'membres' : 'membre'}`}
      />

      {/* CA Total */}
      <StockKPICard
        title="CA Total"
        value={formatCurrency(totalRevenue)}
        icon={TrendingUp}
        variant="success"
        subtitle="Commandes validées"
      />

      {/* CA Moyen */}
      <StockKPICard
        title="CA Moyen"
        value={formatCurrency(averageRevenue)}
        icon={BarChart3}
        variant="default"
        subtitle="Par organisation"
      />

      {/* Villes */}
      <StockKPICard
        title="Villes"
        value={citiesCount}
        icon={MapPin}
        variant="default"
        subtitle="Implantations"
      />
    </div>
  );
}
