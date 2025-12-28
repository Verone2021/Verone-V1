/**
 * Page Mes Commissions - LinkMe
 *
 * Affiche les commissions de l'affilié avec :
 * - 4 KPI Cards (Total, Payées, Validées, En attente)
 * - Graphique évolution CA + Donut répartition
 * - Tableau détaillé avec filtres par statut
 * - Sélection multiple pour demande de versement
 *
 * @module CommissionsPage
 * @since 2025-12-10
 * @updated 2025-12-11 - Ajout demande de versement
 */

'use client';

import { useState, useMemo } from 'react';

import Link from 'next/link';

import {
  Wallet,
  BadgeCheck,
  CheckCircle2,
  Clock,
  Calendar,
  FileText,
} from 'lucide-react';

import { CommissionsOverview } from '../../../components/analytics/CommissionsOverview';
import {
  CommissionKPICard,
  CommissionsTable,
  CommissionsChart,
  PaymentRequestModal,
} from '../../../components/commissions';
import { useAffiliateAnalytics } from '../../../lib/hooks/use-affiliate-analytics';
import { useAffiliateCommissions } from '../../../lib/hooks/use-affiliate-commissions';
import type { AnalyticsPeriod, CommissionItem } from '../../../types/analytics';
import { PERIOD_LABELS } from '../../../types/analytics';

export default function CommissionsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('month');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCommissionIds, setSelectedCommissionIds] = useState<string[]>(
    []
  );

  // Données analytics (KPIs, graphique, statuts)
  const { data: analyticsData, isLoading: analyticsLoading } =
    useAffiliateAnalytics(period);

  // Liste des commissions (tableau)
  const {
    data: commissions,
    isLoading: commissionsLoading,
    refetch,
  } = useAffiliateCommissions();

  const isLoading = analyticsLoading || commissionsLoading;

  // Commissions sélectionnées (pour la modal)
  const selectedCommissions = useMemo(() => {
    if (!commissions) return [];
    return commissions.filter(c => selectedCommissionIds.includes(c.id));
  }, [commissions, selectedCommissionIds]);

  // Handler demande de versement
  const handleRequestPayment = (ids: string[]) => {
    setSelectedCommissionIds(ids);
    setIsModalOpen(true);
  };

  // Handler succès de création
  const handleSuccess = () => {
    setSelectedCommissionIds([]);
    refetch(); // Rafraîchir les commissions
  };

  return (
    <div className="space-y-5 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mes Commissions</h1>
          <p className="text-gray-500 text-sm">
            Suivez vos gains et l&apos;évolution de vos commissions
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Lien vers les demandes */}
          <Link
            href="/commissions/demandes"
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <FileText className="h-4 w-4" />
            Mes demandes
          </Link>

          {/* Filtre période */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <select
              value={period}
              onChange={e => setPeriod(e.target.value as AnalyticsPeriod)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              {(
                Object.entries(PERIOD_LABELS) as [AnalyticsPeriod, string][]
              ).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards - Valeurs ALL TIME (source de verite) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <CommissionKPICard
          title="Total TTC"
          amount={analyticsData?.totalCommissionsTTCAllTime || 0}
          count={analyticsData?.commissionsByStatus?.total.count}
          subtitle="Toutes periodes"
          icon={Wallet}
          iconColor="text-purple-600"
          bgGradient="from-purple-50 to-white"
          isLoading={isLoading}
        />
        <CommissionKPICard
          title="Payées"
          amount={analyticsData?.paidCommissionsTTC || 0}
          count={analyticsData?.commissionsByStatus?.paid.count}
          subtitle="Versées sur compte"
          icon={BadgeCheck}
          iconColor="text-emerald-600"
          bgGradient="from-emerald-50 to-white"
          isLoading={isLoading}
        />
        <CommissionKPICard
          title="Validées"
          amount={analyticsData?.validatedCommissionsTTC || 0}
          count={analyticsData?.commissionsByStatus?.validated.count}
          subtitle="Prêtes au versement"
          icon={CheckCircle2}
          iconColor="text-blue-600"
          bgGradient="from-blue-50 to-white"
          isLoading={isLoading}
        />
        <CommissionKPICard
          title="En attente"
          amount={analyticsData?.pendingCommissionsTTC || 0}
          count={analyticsData?.commissionsByStatus?.pending.count}
          subtitle="En cours de validation"
          icon={Clock}
          iconColor="text-orange-600"
          bgGradient="from-orange-50 to-white"
          isLoading={isLoading}
        />
      </div>

      {/* Graphiques : Évolution + Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart évolution - 2/3 */}
        <div className="lg:col-span-2">
          <CommissionsChart
            data={analyticsData?.revenueByPeriod || []}
            isLoading={isLoading}
          />
        </div>

        {/* Donut répartition - 1/3 */}
        <div className="lg:col-span-1">
          <CommissionsOverview
            data={analyticsData?.commissionsByStatus}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Tableau des commissions avec sélection */}
      <CommissionsTable
        commissions={commissions || []}
        isLoading={commissionsLoading}
        onRequestPayment={handleRequestPayment}
      />

      {/* Modal demande de versement */}
      <PaymentRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedCommissions={selectedCommissions}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
