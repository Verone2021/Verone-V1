'use client';

import {
  Wallet,
  Package,
  ShoppingCart,
  Star,
  CheckCircle,
  Clock,
  Banknote,
} from 'lucide-react';

import { CommissionKPICard } from '../../../components/dashboard';
import { formatCurrency } from '../../../types/analytics';

import { DashboardCollaborateurKPICard } from './DashboardCollaborateurKPICard';

function formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value);
}

type CommissionsByStatus =
  | {
      total?: { amountTTC: number; count: number };
      validated?: { amountTTC: number; count: number };
      requested?: { amountTTC: number; count: number };
      pending?: { amountTTC: number; count: number };
    }
  | null
  | undefined;

type OrderStats =
  | {
      ordersCount?: number;
      totalHT?: number;
      productsOrdered?: number;
      catalogProductsCount?: number;
    }
  | null
  | undefined;

type DashboardKPISectionProps = {
  canViewCommissions: boolean;
  commissionsByStatus: CommissionsByStatus;
  orderStats: OrderStats;
  isLoading: boolean;
};

/**
 * Section KPIs du dashboard — commissions (admin) OU ventes (collaborateur)
 */
export function DashboardKPISection({
  canViewCommissions,
  commissionsByStatus,
  orderStats,
  isLoading,
}: DashboardKPISectionProps): JSX.Element {
  if (canViewCommissions) {
    return (
      <section
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6"
        data-tour="kpi-cards"
      >
        <CommissionKPICard
          label="Total"
          amount={commissionsByStatus?.total?.amountTTC ?? 0}
          count={commissionsByStatus?.total?.count ?? 0}
          variant="turquoise"
          icon={Wallet}
          isLoading={isLoading}
        />
        <CommissionKPICard
          label="Payables"
          amount={commissionsByStatus?.validated?.amountTTC ?? 0}
          count={commissionsByStatus?.validated?.count ?? 0}
          variant="green"
          icon={CheckCircle}
          isLoading={isLoading}
        />
        <CommissionKPICard
          label="En cours"
          amount={commissionsByStatus?.requested?.amountTTC ?? 0}
          count={commissionsByStatus?.requested?.count ?? 0}
          variant="blue"
          icon={Banknote}
          isLoading={isLoading}
        />
        <CommissionKPICard
          label="En attente"
          amount={commissionsByStatus?.pending?.amountTTC ?? 0}
          count={commissionsByStatus?.pending?.count ?? 0}
          variant="orange"
          icon={Clock}
          isLoading={isLoading}
        />
      </section>
    );
  }

  return (
    <section
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6"
      data-tour="kpi-cards"
    >
      <DashboardCollaborateurKPICard
        label="Commandes"
        value={formatNumber(orderStats?.ordersCount ?? 0)}
        subtitle="commandes passées"
        icon={ShoppingCart}
        variant="turquoise"
        isLoading={isLoading}
      />
      <DashboardCollaborateurKPICard
        label="CA HT"
        value={formatCurrency(orderStats?.totalHT ?? 0)}
        subtitle="chiffre d'affaires"
        icon={Wallet}
        variant="green"
        isLoading={isLoading}
      />
      <DashboardCollaborateurKPICard
        label="Produits"
        value={formatNumber(orderStats?.productsOrdered ?? 0)}
        subtitle="produits commandés"
        icon={Package}
        variant="blue"
        isLoading={isLoading}
      />
      <DashboardCollaborateurKPICard
        label="Catalogue"
        value={formatNumber(orderStats?.catalogProductsCount ?? 0)}
        subtitle="produits en catalogue"
        icon={Star}
        variant="orange"
        isLoading={isLoading}
      />
    </section>
  );
}
