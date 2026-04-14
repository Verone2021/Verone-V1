'use client';

import { Card, CardContent } from '@verone/ui';
import { FileText, Landmark, Percent, Wallet } from 'lucide-react';

import { formatCurrency } from './finance-dashboard-utils';

interface IFinanceDashboardTreasuryProps {
  totalBalance: number;
  bankLoading: boolean;
  montantAR: number;
  facturesEnAttente: number;
}

export function FinanceDashboardTreasury({
  totalBalance,
  bankLoading,
  montantAR,
  facturesEnAttente,
}: IFinanceDashboardTreasuryProps): React.ReactNode {
  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Tresorerie</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Landmark className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">Solde bancaire</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {bankLoading ? (
                <span className="text-gray-400">...</span>
              ) : (
                formatCurrency(totalBalance)
              )}
            </p>
            <p className="text-xs text-gray-400 mt-1">Qonto</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">Factures en attente</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(montantAR)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {facturesEnAttente} facture
              {facturesEnAttente > 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">Solde TVA</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">-</p>
            <p className="text-xs text-gray-400 mt-1">
              Voir Documents &gt; TVA
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">IS a payer</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">-</p>
            <p className="text-xs text-gray-400 mt-1">
              Estim. expert-comptable
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
