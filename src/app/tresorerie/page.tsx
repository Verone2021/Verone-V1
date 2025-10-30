/**
 * Page: Trésorerie Dashboard 360°
 * Route: /tresorerie
 * Description: Dashboard trésorerie complet avec Qonto + AR/AP unifiés
 * STATUS: DÉSACTIVÉ Phase 1 - Placeholder uniquement
 *
 * Features (Phase 2):
 * - Soldes bancaires temps réel (Qonto)
 * - KPIs AR + AP
 * - Transactions récentes
 * - Prévisions 30/60/90 jours
 * - Alertes échéances
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Lock } from 'lucide-react'
import { featureFlags } from '@/lib/feature-flags'
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
          <Badge variant={account.status === 'active' ? 'secondary' : 'secondary'}>
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
              ? 'secondary'
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
  // FEATURE FLAG: Finance module disabled for Phase 1
  if (!featureFlags.financeEnabled) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Lock className="h-6 w-6 text-orange-600" />
              <div>
                <CardTitle className="text-orange-900">Module Trésorerie - Phase 2</CardTitle>
                <CardDescription className="text-orange-700">
                  Ce module sera disponible après le déploiement Phase 1
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-orange-900">Fonctionnalités Phase 2</p>
                  <ul className="text-sm text-orange-700 list-disc list-inside mt-1">
                    <li>Intégration Qonto (comptes bancaires temps réel)</li>
                    <li>Prévisions trésorerie 30/60/90 jours</li>
                    <li>KPIs AR (Accounts Receivable) + AP (Accounts Payable)</li>
                    <li>Alertes échéances automatiques</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // CODE ORIGINAL DISPONIBLE DANS L'HISTORIQUE GIT - RÉACTIVATION PHASE 2
  return null;
}
