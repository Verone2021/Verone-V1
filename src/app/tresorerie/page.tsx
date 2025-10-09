// =====================================================================
// Trésorerie Page
// Date: 2025-10-11
// Description: Dashboard trésorerie temps réel (Qonto)
// =====================================================================

import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Banknote, TrendingUp, TrendingDown, RefreshCw, Download } from 'lucide-react';
import { getQontoClient } from '@/lib/qonto';
import type { QontoBankAccount, QontoTransaction } from '@/lib/qonto/types';

export const dynamic = 'force-dynamic';

// =====================================================================
// DATA FETCHING
// =====================================================================

async function getTreasuryData() {
  const qontoClient = getQontoClient();

  const [accounts, { transactions, meta }] = await Promise.all([
    qontoClient.getBankAccounts(),
    qontoClient.getTransactions({
      perPage: 20,
      sortBy: 'settled_at',
    }),
  ]);

  // Filtrer comptes actifs uniquement
  const activeAccounts = accounts.filter((acc) => acc.status === 'active');

  // Calculer solde total
  const totalBalance = activeAccounts.reduce((sum, acc) => sum + acc.balance, 0);

  return {
    accounts: activeAccounts,
    totalBalance,
    recentTransactions: transactions,
    totalTransactionsCount: meta.total_count,
  };
}

// =====================================================================
// COMPONENTS
// =====================================================================

function BankAccountCard({ account }: { account: QontoBankAccount }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{account.name || 'Compte principal'}</CardTitle>
          <Badge variant={account.status === 'active' ? 'default' : 'secondary'}>
            {account.status === 'active' ? 'Actif' : 'Fermé'}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          IBAN: {account.iban.replace(/(.{4})(?=.)/g, '$1 ')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-2xl font-bold">
              {account.balance.toLocaleString('fr-FR', {
                style: 'currency',
                currency: account.currency,
              })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Solde disponible</p>
          </div>
          {account.balance > 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-gray-400" />
          )}
        </div>

        {account.authorized_balance !== account.balance && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Solde autorisé:{' '}
              <span className="font-medium text-foreground">
                {account.authorized_balance.toLocaleString('fr-FR', {
                  style: 'currency',
                  currency: account.currency,
                })}
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TransactionRow({ transaction }: { transaction: QontoTransaction }) {
  const isCredit = transaction.side === 'credit';

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex-1">
        <p className="text-sm font-medium">{transaction.label}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-xs">
            {transaction.operation_type}
          </Badge>
          {transaction.counterparty?.name && (
            <span className="text-xs text-muted-foreground">{transaction.counterparty.name}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p
            className={`text-sm font-semibold ${
              isCredit ? 'text-green-600' : 'text-gray-600'
            }`}
          >
            {isCredit ? '+' : '-'}
            {Math.abs(transaction.amount).toLocaleString('fr-FR', {
              style: 'currency',
              currency: transaction.currency,
            })}
          </p>
          <p className="text-xs text-muted-foreground">
            {transaction.settled_at
              ? new Date(transaction.settled_at).toLocaleDateString('fr-FR')
              : 'En attente'}
          </p>
        </div>

        <Badge
          variant={
            transaction.status === 'completed'
              ? 'default'
              : transaction.status === 'pending'
              ? 'secondary'
              : 'destructive'
          }
        >
          {transaction.status === 'completed'
            ? 'Réglée'
            : transaction.status === 'pending'
            ? 'En attente'
            : 'Rejetée'}
        </Badge>
      </div>
    </div>
  );
}

async function TreasuryContent() {
  const { accounts, totalBalance, recentTransactions, totalTransactionsCount } =
    await getTreasuryData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Trésorerie</h1>
        <p className="text-muted-foreground mt-1">
          Suivi temps réel de vos comptes bancaires Qonto
        </p>
      </div>

      {/* KPI Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Trésorerie totale
              </CardTitle>
              <p className="text-4xl font-bold mt-2">
                {totalBalance.toLocaleString('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                })}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {accounts.length} compte{accounts.length > 1 ? 's' : ''} actif
                {accounts.length > 1 ? 's' : ''}
              </p>
            </div>
            <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center">
              <Banknote className="h-8 w-8 text-white" />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Comptes bancaires */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Comptes bancaires</h2>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border hover:bg-accent">
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <BankAccountCard key={account.id} account={account} />
          ))}
        </div>

        {accounts.length === 0 && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Aucun compte bancaire actif trouvé</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dernières transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Dernières transactions</CardTitle>
              <CardDescription>
                {totalTransactionsCount} transaction{totalTransactionsCount > 1 ? 's' : ''} au total
              </CardDescription>
            </div>
            <button className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border hover:bg-accent">
              <Download className="h-4 w-4" />
              Exporter
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {recentTransactions.length > 0 ? (
            <div className="space-y-0">
              {recentTransactions.map((transaction) => (
                <TransactionRow key={transaction.transaction_id} transaction={transaction} />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Aucune transaction récente</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// =====================================================================
// LOADING STATE
// =====================================================================

function TreasurySkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-96 mt-2" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-48 mt-2" />
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =====================================================================
// PAGE
// =====================================================================

export default function TresoreriePage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <Suspense fallback={<TreasurySkeleton />}>
        <TreasuryContent />
      </Suspense>
    </div>
  );
}
