/**
 * Composant: TreasuryKPIs
 * Description: Cartes KPIs trésorerie avec métriques AR + AP
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertCircle,
  DollarSign
} from 'lucide-react'
import type { TreasuryStats } from '@/shared/modules/finance/hooks'

// =====================================================================
// TYPES
// =====================================================================

interface TreasuryKPIsProps {
  stats: TreasuryStats | null
  bankBalance?: number | null
  loading?: boolean
}

// =====================================================================
// HELPER: Format Currency
// =====================================================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// =====================================================================
// COMPOSANT
// =====================================================================

export function TreasuryKPIs({ stats, bankBalance, loading }: TreasuryKPIsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    )
  }

  if (!stats) {
    return null
  }

  // Calculer métriques dérivées
  const arPendingAmount = stats.total_invoiced_ar - stats.total_paid_ar
  const apPendingAmount = stats.total_invoiced_ap - stats.total_paid_ap

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Solde Bancaire (si disponible via Qonto) */}
      {bankBalance !== null && bankBalance !== undefined && (
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">
              Solde Bancaire
            </CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {formatCurrency(bankBalance)}
            </div>
            <p className="text-xs text-blue-700 mt-1">
              Temps réel (Qonto)
            </p>
          </CardContent>
        </Card>
      )}

      {/* Balance Nette (Net Balance) */}
      <Card className={
        stats.net_balance >= 0
          ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
          : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
      }>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className={`text-sm font-medium ${stats.net_balance >= 0 ? 'text-green-900' : 'text-red-900'}`}>
            Balance Nette
          </CardTitle>
          {stats.net_balance >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.net_balance >= 0 ? 'text-green-900' : 'text-red-900'}`}>
            {formatCurrency(stats.net_balance)}
          </div>
          <p className={`text-xs mt-1 ${stats.net_balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            AR - AP (période)
          </p>
        </CardContent>
      </Card>

      {/* Flux Net (Cash Flow) */}
      <Card className={
        stats.net_cash_flow >= 0
          ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200'
          : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'
      }>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className={`text-sm font-medium ${stats.net_cash_flow >= 0 ? 'text-emerald-900' : 'text-orange-900'}`}>
            Flux Trésorerie
          </CardTitle>
          <DollarSign className={`h-4 w-4 ${stats.net_cash_flow >= 0 ? 'text-emerald-600' : 'text-orange-600'}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.net_cash_flow >= 0 ? 'text-emerald-900' : 'text-orange-900'}`}>
            {formatCurrency(stats.net_cash_flow)}
          </div>
          <p className={`text-xs mt-1 ${stats.net_cash_flow >= 0 ? 'text-emerald-700' : 'text-orange-700'}`}>
            Encaissements - Décaissements
          </p>
        </CardContent>
      </Card>

      {/* --- AR (Accounts Receivable - Clients) --- */}

      {/* AR - Total Facturé */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">
            Facturé Clients (AR)
          </CardTitle>
          <ArrowUpCircle className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(stats.total_invoiced_ar)}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Total factures clients
          </p>
        </CardContent>
      </Card>

      {/* AR - Encaissé */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">
            Encaissé (AR)
          </CardTitle>
          <ArrowUpCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(stats.total_paid_ar)}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Paiements reçus clients
          </p>
        </CardContent>
      </Card>

      {/* AR - À Encaisser */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">
            À Encaisser (AR)
          </CardTitle>
          <AlertCircle className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {formatCurrency(arPendingAmount)}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {stats.unpaid_count_ar} facture(s) en attente
          </p>
        </CardContent>
      </Card>

      {/* --- AP (Accounts Payable - Fournisseurs + Dépenses) --- */}

      {/* AP - Total À Payer */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">
            Facturé Fournisseurs (AP)
          </CardTitle>
          <ArrowDownCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(stats.total_invoiced_ap)}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Total factures fournisseurs + dépenses
          </p>
        </CardContent>
      </Card>

      {/* AP - Payé */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">
            Décaissé (AP)
          </CardTitle>
          <ArrowDownCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(stats.total_paid_ap)}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Paiements effectués
          </p>
        </CardContent>
      </Card>

      {/* AP - Restant À Payer */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">
            À Payer (AP)
          </CardTitle>
          <AlertCircle className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {formatCurrency(apPendingAmount)}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {stats.unpaid_count_ap} document(s) en attente
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
