/**
 * CommissionsOverview
 * Aperçu de la répartition des commissions par statut
 *
 * Affiche un donut chart + légende avec montants HT/TTC
 */

'use client';

import { Card, DonutChart } from '@tremor/react';
import { Wallet, Clock, CheckCircle2, BadgeCheck } from 'lucide-react';

import type { CommissionsByStatus } from '../../types/analytics';
import { formatCurrency } from '../../types/analytics';

interface CommissionsOverviewProps {
  data: CommissionsByStatus | undefined;
  isLoading?: boolean;
}

export function CommissionsOverview({
  data,
  isLoading,
}: CommissionsOverviewProps) {
  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-40 mb-3" />
          <div className="h-36 bg-gray-200 rounded-full w-36 mx-auto" />
        </div>
      </Card>
    );
  }

  const chartData = [
    {
      name: 'Payées',
      value: data?.paid.amountTTC || 0,
      color: 'emerald',
    },
    {
      name: 'Validées',
      value: data?.validated.amountTTC || 0,
      color: 'blue',
    },
    {
      name: 'En attente',
      value: data?.pending.amountTTC || 0,
      color: 'orange',
    },
  ];

  const totalTTC = data?.total.amountTTC || 0;

  // Calculer les pourcentages
  const getPercentage = (value: number) => {
    if (totalTTC === 0) return 0;
    return ((value / totalTTC) * 100).toFixed(1);
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">
          Répartition des commissions
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Wallet className="h-3.5 w-3.5" />
          <span>Total: {formatCurrency(totalTTC)} TTC</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* Donut Chart */}
        <div className="flex-shrink-0">
          <DonutChart
            data={chartData}
            category="value"
            index="name"
            colors={['emerald', 'blue', 'orange']}
            valueFormatter={value => formatCurrency(value)}
            className="h-36 w-36"
            showAnimation
            showLabel
            label={`${formatCurrency(totalTTC)}`}
          />
        </div>

        {/* Légende détaillée */}
        <div className="flex-1 space-y-2.5 w-full">
          {/* Payées */}
          <div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-100 rounded">
                <BadgeCheck className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Payées</p>
                <p className="text-xs text-gray-500">
                  {data?.paid.count || 0} commissions
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-emerald-600 text-sm">
                {formatCurrency(data?.paid.amountTTC || 0)}
              </p>
              <p className="text-[10px] text-gray-500">
                {getPercentage(data?.paid.amountTTC || 0)}%
              </p>
            </div>
          </div>

          {/* Validées */}
          <div className="flex items-center justify-between p-2.5 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Validées</p>
                <p className="text-xs text-gray-500">
                  {data?.validated.count || 0} commissions
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-blue-600 text-sm">
                {formatCurrency(data?.validated.amountTTC || 0)}
              </p>
              <p className="text-[10px] text-gray-500">
                {getPercentage(data?.validated.amountTTC || 0)}%
              </p>
            </div>
          </div>

          {/* En attente */}
          <div className="flex items-center justify-between p-2.5 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-orange-100 rounded">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">En attente</p>
                <p className="text-xs text-gray-500">
                  {data?.pending.count || 0} commissions
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-orange-600 text-sm">
                {formatCurrency(data?.pending.amountTTC || 0)}
              </p>
              <p className="text-[10px] text-gray-500">
                {getPercentage(data?.pending.amountTTC || 0)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Note HT */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-[10px] text-gray-400 text-center">
          Total HT: {formatCurrency(data?.total.amountHT || 0)} | TVA incluse
          dans les montants affichés
        </p>
      </div>
    </Card>
  );
}

export default CommissionsOverview;
