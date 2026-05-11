'use client';

import {
  BarChart2,
  Eye,
  MousePointerClick,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react';

import { cn } from '@verone/utils';

import { useProductPerformance } from '../../hooks/use-product-performance';

interface ProductPerformanceSectionProps {
  productId: string;
  className?: string;
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n);
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

interface KpiCardProps {
  label: string;
  value: string;
  Icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

function KpiCard({ label, value, Icon, iconBg, iconColor }: KpiCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-gray-100 bg-gray-50 p-3">
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-md',
          iconBg
        )}
      >
        <Icon className={cn('h-4 w-4', iconColor)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] uppercase tracking-wide text-gray-500">
          {label}
        </p>
        <p className="truncate text-sm font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export function ProductPerformanceSection({
  productId,
  className,
}: ProductPerformanceSectionProps) {
  const {
    total_impressions,
    total_clicks,
    total_conversions,
    total_revenue_ht,
    meta,
    google,
    last_synced_at,
    hasData,
    loading,
    error,
  } = useProductPerformance(productId);

  if (loading) {
    return (
      <div
        className={cn(
          'rounded-lg border border-gray-200 bg-white p-4 shadow-sm',
          className
        )}
      >
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
            <BarChart2 className="h-4 w-4 text-blue-500" />
          </div>
          <h3 className="font-medium text-gray-900">Performance marketing</h3>
        </div>
        <p className="text-sm text-gray-400">Chargement…</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white p-4 shadow-sm',
        className
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
            <BarChart2 className="h-4 w-4 text-blue-500" />
          </div>
          <h3 className="font-medium text-gray-900">Performance marketing</h3>
        </div>
        {last_synced_at && (
          <span className="text-[11px] text-gray-500">
            Mis à jour le {formatDate(last_synced_at)}
          </span>
        )}
      </div>

      {!hasData ? (
        <div className="rounded-md bg-gray-50 p-4 text-center">
          <p className="text-sm text-gray-500">
            Pas encore de données de performance.
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Les statistiques apparaîtront ici une fois le produit publié sur
            Meta ou Google Merchant.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <KpiCard
              label="Vues (impressions)"
              value={formatNumber(total_impressions)}
              Icon={Eye}
              iconBg="bg-blue-50"
              iconColor="text-blue-500"
            />
            <KpiCard
              label="Clics"
              value={formatNumber(total_clicks)}
              Icon={MousePointerClick}
              iconBg="bg-violet-50"
              iconColor="text-violet-500"
            />
            <KpiCard
              label="Conversions"
              value={formatNumber(total_conversions)}
              Icon={ShoppingCart}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
            />
            <KpiCard
              label="Revenu HT"
              value={formatCurrency(total_revenue_ht)}
              Icon={TrendingUp}
              iconBg="bg-orange-50"
              iconColor="text-orange-500"
            />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-gray-600 md:grid-cols-2">
            {meta && (
              <div className="rounded-md bg-blue-50/50 px-3 py-2">
                <span className="font-medium text-blue-800">Meta : </span>
                {formatNumber(meta.impressions)} vues ·{' '}
                {formatNumber(meta.clicks)} clics ·{' '}
                {formatNumber(meta.conversions)} conv ·{' '}
                {formatCurrency(meta.revenue_ht)}
              </div>
            )}
            {google && (
              <div className="rounded-md bg-emerald-50/50 px-3 py-2">
                <span className="font-medium text-emerald-800">Google : </span>
                {formatNumber(google.impressions)} vues ·{' '}
                {formatNumber(google.clicks)} clics ·{' '}
                {formatNumber(google.conversions)} conv ·{' '}
                {formatCurrency(google.revenue_ht)}
              </div>
            )}
          </div>
        </>
      )}

      {error && <p className="mt-2 text-xs text-red-600">Erreur : {error}</p>}
    </div>
  );
}
