'use client';

import { Package, TrendingUp, ShoppingBag, Wallet } from 'lucide-react';

import { KPICard } from '../../../components/dashboard/KPICard';

interface CommandesKPIsProps {
  monthlyKPIs:
    | {
        allTime: { ordersCount: number; caTTC: number };
      }
    | null
    | undefined;
  commissionStats: { total: { amountTTC: number } } | null | undefined;
  kpisLoading: boolean;
  commissionStatsLoading: boolean;
  canViewCommissions: boolean;
}

export function CommandesKPIs({
  monthlyKPIs,
  commissionStats,
  kpisLoading,
  commissionStatsLoading,
  canViewCommissions,
}: CommandesKPIsProps) {
  const panierMoyen = monthlyKPIs?.allTime.ordersCount
    ? (
        monthlyKPIs.allTime.caTTC / monthlyKPIs.allTime.ordersCount
      ).toLocaleString('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
    : 0;

  return (
    <div
      data-tour="orders-kpis"
      className="grid grid-cols-2 md:grid-cols-4 gap-4"
    >
      <KPICard
        title="Commandes"
        icon={ShoppingBag}
        variant="turquoise"
        compact
        mainValue={monthlyKPIs?.allTime.ordersCount ?? 0}
        isLoading={kpisLoading}
      />
      <KPICard
        title="CA TTC"
        icon={TrendingUp}
        variant="marine"
        compact
        mainValue={`${(monthlyKPIs?.allTime.caTTC ?? 0).toLocaleString(
          'fr-FR',
          {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }
        )} €`}
        isLoading={kpisLoading}
      />
      <KPICard
        title="Panier Moyen"
        icon={Package}
        variant="turquoise"
        compact
        mainValue={`${panierMoyen} €`}
        isLoading={kpisLoading}
      />
      {canViewCommissions && (
        <KPICard
          title="Commissions TTC"
          icon={Wallet}
          variant="marine"
          compact
          mainValue={`${(commissionStats?.total.amountTTC ?? 0).toLocaleString(
            'fr-FR',
            {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }
          )} €`}
          isLoading={commissionStatsLoading}
        />
      )}
    </div>
  );
}
