/**
 * Page Mes Commissions - LinkMe
 *
 * Refonte 2026-01 avec :
 * - 3 KPI Cards (Total TTC, Payables, En attente)
 * - Banner simplifié "Comment ça marche" avec bouton modal
 * - Layout 2 colonnes (Table 60% | Demandes 40%)
 *
 * @module CommissionsPage
 * @since 2025-12-10
 * @updated 2026-01-10 - Suppression accordéons, ajout modal sélection
 */

'use client';

import { useState, useMemo, useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { Loader2, Wallet, CheckCircle2, Clock, Calendar } from 'lucide-react';

import {
  CommissionKPICard,
  CommissionsTable,
  CommissionSelectionModal,
  PaymentRequestModal,
  HowToGetPaidBanner,
} from '../../../components/commissions';
import { PageTourTrigger } from '../../../components/onboarding/PageTourTrigger';
import { useAffiliateAnalytics } from '../../../lib/hooks/use-affiliate-analytics';
import { useAffiliateCommissions } from '../../../lib/hooks/use-affiliate-commissions';
import { useAffiliatePaymentRequests } from '../../../lib/hooks/use-payment-requests';
import { usePermissions } from '../../../hooks/use-permissions';
import type { AnalyticsPeriod } from '../../../types/analytics';
import { PERIOD_LABELS } from '../../../types/analytics';

export default function CommissionsPage(): JSX.Element {
  const router = useRouter();
  const { canViewCommissions, isLoading: permissionsLoading } =
    usePermissions();

  // Guard: redirect si pas de permission (évite flash de contenu)
  useEffect(() => {
    if (!permissionsLoading && !canViewCommissions) {
      router.replace('/dashboard');
    }
  }, [permissionsLoading, canViewCommissions, router]);

  // Défaut 'all' pour afficher toutes les commissions par défaut
  const [period, setPeriod] = useState<AnalyticsPeriod>('all');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [selectedCommissionIds, setSelectedCommissionIds] = useState<string[]>(
    []
  );

  // Données analytics (KPIs)
  const { data: analyticsData, isLoading: analyticsLoading } =
    useAffiliateAnalytics(period);

  // Liste des commissions (tableau) - FILTRÉE PAR PÉRIODE
  const {
    data: commissions,
    isLoading: commissionsLoading,
    refetch,
  } = useAffiliateCommissions({ period });

  // Demandes de versement (pour le count dans le tab)
  const { data: paymentRequests } = useAffiliatePaymentRequests();
  const activeRequestsCount = (paymentRequests ?? []).filter(
    r => r.status === 'pending' || r.status === 'invoice_received'
  ).length;

  const isLoading = analyticsLoading || commissionsLoading;

  // Commissions sélectionnées (pour la modal de paiement)
  const selectedCommissions = useMemo(() => {
    if (!commissions) return [];
    return commissions.filter(c => selectedCommissionIds.includes(c.id));
  }, [commissions, selectedCommissionIds]);

  // Early return : masquer TOUT le contenu si pas de permission (APRÈS tous les hooks)
  if (permissionsLoading || !canViewCommissions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  // Handler demande de versement depuis la table
  const handleRequestPayment = (ids: string[]): void => {
    setSelectedCommissionIds(ids);
    setIsPaymentModalOpen(true);
  };

  // Handler confirmation depuis le modal de sélection
  const handleSelectionConfirm = (ids: string[]): void => {
    setSelectedCommissionIds(ids);
    setIsSelectionModalOpen(false);
    setIsPaymentModalOpen(true);
  };

  // Handler succès de création
  const handleSuccess = (): void => {
    setSelectedCommissionIds([]);
    void refetch();
  };

  return (
    <div className="space-y-4 p-4">
      <PageTourTrigger tourId="tour_commissions" />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mes Commissions</h1>
          <p className="text-gray-500 text-sm">
            Suivez vos commissions et demandez vos versements
          </p>
        </div>

        {/* Filtre période */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <select
            value={period}
            onChange={e => setPeriod(e.target.value as AnalyticsPeriod)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-linkme-turquoise focus:border-linkme-turquoise outline-none"
          >
            {(Object.entries(PERIOD_LABELS) as [AnalyticsPeriod, string][]).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      {/* 3 KPI Cards */}
      <div
        data-tour="commissions-kpis"
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
      >
        <CommissionKPICard
          title="Total TTC"
          amount={analyticsData?.commissionsByStatus?.total.amountTTC ?? 0}
          count={analyticsData?.commissionsByStatus?.total.count}
          subtitle={
            period === 'all' ? 'Toutes périodes' : PERIOD_LABELS[period]
          }
          icon={Wallet}
          iconColor="text-linkme-royal"
          bgGradient="from-linkme-royal/10 to-white"
          isLoading={isLoading}
        />
        <CommissionKPICard
          title="Payables"
          amount={analyticsData?.validatedCommissionsTTC ?? 0}
          count={analyticsData?.commissionsByStatus?.validated.count}
          subtitle="Prêtes pour versement"
          icon={CheckCircle2}
          iconColor="text-linkme-turquoise"
          bgGradient="from-linkme-turquoise/10 to-white"
          isLoading={isLoading}
          tooltip="Commande livrée, vous pouvez demander le versement de cette commission."
        />
        <CommissionKPICard
          title="En attente"
          amount={analyticsData?.pendingCommissionsTTC ?? 0}
          count={analyticsData?.commissionsByStatus?.pending.count}
          subtitle="Commandes non payées"
          icon={Clock}
          iconColor="text-orange-500"
          bgGradient="from-orange-50 to-white"
          isLoading={isLoading}
          tooltip="Commande en cours de traitement ou pas encore livrée. La commission sera payable après livraison."
        />
      </div>

      {/* Banner simplifié "Comment ça marche" avec bouton modal */}
      <div data-tour="commissions-request">
        <HowToGetPaidBanner
          onOpenSelectionModal={() => setIsSelectionModalOpen(true)}
          payableCount={
            analyticsData?.commissionsByStatus?.validated.count ?? 0
          }
          payableAmount={analyticsData?.validatedCommissionsTTC ?? 0}
        />
      </div>

      {/* Table des commissions (full-width) */}
      <div data-tour="commissions-list">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900">
            Commissions {period !== 'all' && `(${PERIOD_LABELS[period]})`}
          </h2>
          <span className="text-sm text-gray-500">
            {commissions?.length ?? 0} resultat
            {(commissions?.length ?? 0) > 1 ? 's' : ''}
          </span>
        </div>
        <CommissionsTable
          commissions={commissions ?? []}
          isLoading={commissionsLoading}
          onRequestPayment={handleRequestPayment}
          paymentRequestsCount={activeRequestsCount}
        />
      </div>

      {/* Modal sélection des commissions (depuis banner) */}
      <CommissionSelectionModal
        isOpen={isSelectionModalOpen}
        onClose={() => setIsSelectionModalOpen(false)}
        onConfirm={handleSelectionConfirm}
      />

      {/* Modal demande de versement */}
      <PaymentRequestModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        selectedCommissions={selectedCommissions}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
