/**
 * Commissions Status Card
 *
 * Card affichant la répartition des commissions par statut
 * + Liste des top commissions en attente
 */

'use client';

import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Skeleton } from '@verone/ui';
import { Progress } from '@verone/ui';
import { Clock, CheckCircle, Wallet, ArrowRight } from 'lucide-react';

import type {
  CommissionsByStatus,
  PendingCommission,
} from '../hooks/use-linkme-analytics';

interface CommissionsStatusCardProps {
  statusData: CommissionsByStatus;
  pendingCommissions: PendingCommission[];
  isLoading?: boolean;
}

export function CommissionsStatusCard({
  statusData,
  pendingCommissions,
  isLoading = false,
}: CommissionsStatusCardProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const total =
    statusData.pending + statusData.validated + statusData.paid || 1;
  const pendingPercent = (statusData.pending / total) * 100;
  const validatedPercent = (statusData.validated / total) * 100;
  const paidPercent = (statusData.paid / total) * 100;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Répartition par statut */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Répartition commissions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* En attente */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-gray-600">En attente</span>
              </div>
              <span className="font-medium text-orange-600">
                {formatCurrency(statusData.pending)}
              </span>
            </div>
            <Progress value={pendingPercent} className="h-2 bg-gray-100" />
          </div>

          {/* Validées */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                <span className="text-gray-600">Validées</span>
              </div>
              <span className="font-medium text-blue-600">
                {formatCurrency(statusData.validated)}
              </span>
            </div>
            <Progress value={validatedPercent} className="h-2 bg-gray-100" />
          </div>

          {/* Payées */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-green-500" />
                <span className="text-gray-600">Payées</span>
              </div>
              <span className="font-medium text-green-600">
                {formatCurrency(statusData.paid)}
              </span>
            </div>
            <Progress value={paidPercent} className="h-2 bg-gray-100" />
          </div>

          {/* Total */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Total</span>
              <span className="text-lg font-bold">{formatCurrency(total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top commissions à verser */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              À verser prochainement
            </CardTitle>
            <Link
              href="/canaux-vente/linkme/commissions"
              className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1"
            >
              Tout voir
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {pendingCommissions.length === 0 ? (
            <div className="text-center py-6 text-sm text-gray-500">
              Aucune commission en attente
            </div>
          ) : (
            <div className="space-y-3">
              {pendingCommissions.map(commission => (
                <div
                  key={commission.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {commission.affiliateName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {commission.orderNumber} • {commission.date}
                    </p>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-sm font-semibold text-green-600">
                      {formatCurrency(commission.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
