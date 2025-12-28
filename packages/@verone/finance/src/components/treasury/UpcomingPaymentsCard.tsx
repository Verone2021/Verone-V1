'use client';

import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@verone/ui';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

import type { TreasuryStats } from '../../hooks/use-treasury-stats';

interface UpcomingPaymentsCardProps {
  stats: TreasuryStats | null;
  isLoading: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export function UpcomingPaymentsCard({
  stats,
  isLoading,
}: UpcomingPaymentsCardProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map(i => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-6 w-24" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Montants AR/AP - total_invoiced_* contient déjà le montant impayé (from financial_documents)
  const arTotal = stats?.total_invoiced_ar ?? 0;
  const arOverdue = stats?.overdue_ar ?? 0;
  const arCount = stats?.unpaid_count_ar ?? 0;

  const apTotal = stats?.total_invoiced_ap ?? 0;
  const apOverdue = stats?.overdue_ap ?? 0;
  const apCount = stats?.unpaid_count_ap ?? 0;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Entrées à venir (AR) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Entrées à venir</CardTitle>
          <div className="p-2 rounded-full bg-emerald-50">
            <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600">
            {formatCurrency(arTotal)}
          </div>
          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
            <p>
              {arCount} facture{arCount > 1 ? 's' : ''} en attente
            </p>
            {arOverdue > 0 && (
              <p className="text-amber-600">
                Dont {formatCurrency(arOverdue)} en retard
              </p>
            )}
          </div>
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Créances clients non encaissées
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sorties à venir (AP) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sorties à venir</CardTitle>
          <div className="p-2 rounded-full bg-red-50">
            <ArrowUpRight className="h-4 w-4 text-destructive" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {formatCurrency(apTotal)}
          </div>
          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
            <p>
              {apCount} facture{apCount > 1 ? 's' : ''} à payer
            </p>
            {apOverdue > 0 && (
              <p className="text-destructive">
                Dont {formatCurrency(apOverdue)} en retard
              </p>
            )}
          </div>
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Dettes fournisseurs impayées
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
