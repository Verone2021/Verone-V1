/**
 * Page: Trésorerie Dashboard 360°
 * Route: /tresorerie
 * Description: Dashboard trésorerie complet avec Qonto + AR/AP unifiés
 *
 * Features:
 * - Soldes bancaires temps réel (Qonto)
 * - KPIs AR + AP
 * - Transactions récentes
 * - Prévisions 30/60/90 jours
 * - Alertes échéances
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { TreasuryKPIs } from '@/components/business/treasury-kpis'
import { useTreasuryStats } from '@/hooks/use-treasury-stats'
import {
  Banknote,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  AlertTriangle,
  Calendar,
  ArrowRight
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'

// =====================================================================
// TYPES
// =====================================================================

interface BankAccount {
  id: string
  name: string
  iban: string
  balance: number
  currency: string
  status: string
  authorized_balance: number
}

interface Transaction {
  transaction_id: string
  label: string
  amount: number
  currency: string
  side: 'credit' | 'debit'
  operation_type: string
  settled_at: string | null
  status: string
  counterparty?: {
    name: string
  }
}

// =====================================================================
// COMPOSANT: Bank Account Card
// =====================================================================

function BankAccountCard({ account }: { account: BankAccount }) {
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
                currency: account.currency
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
                  currency: account.currency
                })}
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// =====================================================================
// COMPOSANT: Transaction Row
// =====================================================================

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const isCredit = transaction.side === 'credit'

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
              currency: transaction.currency
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
  )
}

// =====================================================================
// COMPOSANT PRINCIPAL
// =====================================================================

export default function TresoreriePage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingBank, setLoadingBank] = useState(true)

  // Hook treasury stats (AR + AP)
  const {
    stats,
    forecasts,
    bankBalance,
    loading: loadingStats,
    refresh,
    refreshBankBalance
  } = useTreasuryStats()

  // Fetch Qonto data
  useEffect(() => {
    const fetchQontoData = async () => {
      try {
        setLoadingBank(true)

        // Fetch accounts
        const accountsRes = await fetch('/api/qonto/accounts')
        if (accountsRes.ok) {
          const accountsData = await accountsRes.json()
          setAccounts(accountsData.accounts || [])
        }

        // Fetch recent transactions
        const transactionsRes = await fetch('/api/qonto/transactions?limit=10')
        if (transactionsRes.ok) {
          const transactionsData = await transactionsRes.json()
          setTransactions(transactionsData.transactions || [])
        }
      } catch (error) {
        console.error('Error fetching Qonto data:', error)
      } finally {
        setLoadingBank(false)
      }
    }

    fetchQontoData()
  }, [])

  // Calculer total balance bancaire
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)

  // Gérer refresh
  const handleRefresh = () => {
    refresh()
    refreshBankBalance()
    window.location.reload() // Reload pour refetch Qonto
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trésorerie</h1>
          <p className="text-muted-foreground mt-1">
            Dashboard 360° - Qonto + AR/AP temps réel
          </p>
        </div>

        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* KPIs AR + AP */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Métriques Financières</h2>
        <TreasuryKPIs stats={stats} bankBalance={totalBalance} loading={loadingStats} />
      </div>

      {/* Prévisions */}
      {forecasts && forecasts.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Prévisions Trésorerie</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {forecasts.map((forecast) => (
              <Card key={forecast.period}>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-700">
                    Prévision {forecast.period === '30d' ? '30' : forecast.period === '60d' ? '60' : '90'} jours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">À encaisser (AR)</span>
                      <span className="text-sm font-medium text-green-600">
                        +{forecast.expected_inbound.toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: 'EUR',
                          minimumFractionDigits: 0
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">À décaisser (AP)</span>
                      <span className="text-sm font-medium text-red-600">
                        -{forecast.expected_outbound.toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: 'EUR',
                          minimumFractionDigits: 0
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-sm font-medium">Balance projetée</span>
                      <span className={`text-sm font-bold ${forecast.projected_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {forecast.projected_balance.toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: 'EUR',
                          minimumFractionDigits: 0
                        })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Alertes (si balance projetée négative) */}
      {forecasts && forecasts.some(f => f.projected_balance < 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-orange-900">Alertes Trésorerie</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {forecasts
                .filter(f => f.projected_balance < 0)
                .map((forecast) => (
                  <li key={forecast.period} className="flex items-center gap-2 text-sm text-orange-800">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Balance négative prévue dans{' '}
                      {forecast.period === '30d' ? '30' : forecast.period === '60d' ? '60' : '90'} jours :{' '}
                      <strong>
                        {forecast.projected_balance.toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: 'EUR'
                        })}
                      </strong>
                    </span>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Comptes bancaires Qonto */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Comptes Bancaires (Qonto)</h2>
        </div>

        {loadingBank ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : accounts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <BankAccountCard key={account.id} account={account} />
            ))}
          </div>
        ) : (
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
              <CardTitle>Dernières Transactions</CardTitle>
              <CardDescription>
                Transactions récentes Qonto
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/finance/rapprochement">
                  Rapprochement
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingBank ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-0">
              {transactions.map((transaction) => (
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" asChild>
          <Link href="/finance/factures-fournisseurs">
            <CardHeader>
              <CardTitle className="text-sm">Factures Fournisseurs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">
                {stats?.unpaid_count_ap || 0}
              </p>
              <p className="text-xs text-gray-500">À payer</p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" asChild>
          <Link href="/factures">
            <CardHeader>
              <CardTitle className="text-sm">Factures Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {stats?.unpaid_count_ar || 0}
              </p>
              <p className="text-xs text-gray-500">À encaisser</p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" asChild>
          <Link href="/finance/depenses">
            <CardHeader>
              <CardTitle className="text-sm">Dépenses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">
                {forecasts?.[0]?.expected_outbound.toLocaleString('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                  minimumFractionDigits: 0
                }) || '0 €'}
              </p>
              <p className="text-xs text-gray-500">Prévu 30j</p>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  )
}
