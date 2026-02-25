'use client';

/**
 * StatsCommissionsTab — Onglet Commissions de la page Statistiques
 *
 * Affiche :
 * - 4 KPIs : Total TTC, Payables, En attente, Payées
 * - Donut chart répartition par statut (via CommissionsOverview)
 *
 * @module StatsCommissionsTab
 * @since 2026-02-25
 */

import { Card } from '@tremor/react';
import { Coins, CheckCircle2, Clock, BadgeCheck } from 'lucide-react';

import { CommissionsOverview } from '@/components/analytics';
import type { AffiliateAnalyticsData } from '@/types/analytics';
import { formatCurrency } from '@/types/analytics';

interface StatsCommissionsTabProps {
  data: AffiliateAnalyticsData | null | undefined;
  isLoading: boolean;
}

export function StatsCommissionsTab({
  data,
  isLoading,
}: StatsCommissionsTabProps) {
  const commissions = data?.commissionsByStatus;

  return (
    <div className="space-y-6">
      {/* 4 KPIs Commissions */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-l-4 border-[#5DBEBB]">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-[#5DBEBB]/10 rounded-lg">
              <Coins className="h-4 w-4 text-[#5DBEBB]" />
            </div>
            <span className="text-sm text-gray-600 font-medium">Total TTC</span>
          </div>
          {isLoading ? (
            <div className="animate-pulse h-8 bg-gray-200 rounded w-32" />
          ) : (
            <>
              <p className="text-2xl font-bold text-[#5DBEBB]">
                {formatCurrency(commissions?.total.amountTTC ?? 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {commissions?.total.count ?? 0} commissions
              </p>
            </>
          )}
        </Card>

        <Card className="p-5 border-l-4 border-blue-500">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
            </div>
            <span className="text-sm text-gray-600 font-medium">Payables</span>
          </div>
          {isLoading ? (
            <div className="animate-pulse h-8 bg-gray-200 rounded w-24" />
          ) : (
            <>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(commissions?.validated.amountTTC ?? 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {commissions?.validated.count ?? 0} validées
              </p>
            </>
          )}
        </Card>

        <Card className="p-5 border-l-4 border-orange-500">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-orange-100 rounded-lg">
              <Clock className="h-4 w-4 text-orange-600" />
            </div>
            <span className="text-sm text-gray-600 font-medium">
              En attente
            </span>
          </div>
          {isLoading ? (
            <div className="animate-pulse h-8 bg-gray-200 rounded w-24" />
          ) : (
            <>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(commissions?.pending.amountTTC ?? 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {commissions?.pending.count ?? 0} en attente
              </p>
            </>
          )}
        </Card>

        <Card className="p-5 border-l-4 border-emerald-500">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-emerald-100 rounded-lg">
              <BadgeCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <span className="text-sm text-gray-600 font-medium">Payées</span>
          </div>
          {isLoading ? (
            <div className="animate-pulse h-8 bg-gray-200 rounded w-24" />
          ) : (
            <>
              <p className="text-2xl font-bold text-emerald-600">
                {formatCurrency(commissions?.paid.amountTTC ?? 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {commissions?.paid.count ?? 0} payées
              </p>
            </>
          )}
        </Card>
      </section>

      {/* Donut chart répartition */}
      <CommissionsOverview data={commissions} isLoading={isLoading} />
    </div>
  );
}
