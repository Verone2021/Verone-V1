/**
 * Qonto Bank Accounts Balance API
 * Retourne les soldes de tous les comptes bancaires Qonto
 *
 * GET /api/qonto/balance
 *
 * Retourne:
 * - accounts: Liste des comptes avec leurs soldes
 * - totalBalance: Solde total agrégé
 * - lastUpdated: Date de dernière mise à jour
 */

import { NextResponse } from 'next/server';

import { QontoClient, QontoError } from '@verone/integrations/qonto';
import type { QontoBankAccount } from '@verone/integrations/qonto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export interface BankAccountBalance {
  id: string;
  name: string;
  iban: string;
  ibanMasked: string;
  balance: number;
  authorizedBalance: number;
  currency: string;
  status: 'active' | 'closed';
  updatedAt: string;
}

interface BalanceResponse {
  success: boolean;
  accounts: BankAccountBalance[];
  totalBalance: number;
  totalAuthorizedBalance: number;
  currency: string;
  lastUpdated: string;
  error?: string;
}

/**
 * Masque un IBAN pour l'affichage (ex: FR76 XXXX ... 1234)
 */
function maskIban(iban: string): string {
  if (!iban || iban.length < 8) return iban;
  const prefix = iban.slice(0, 4);
  const suffix = iban.slice(-4);
  return `${prefix} XXXX XXXX ${suffix}`;
}

export async function GET(): Promise<NextResponse<BalanceResponse>> {
  const lastUpdated = new Date().toISOString();

  try {
    // QontoClient résout automatiquement le mode d'auth via resolveAuthMode()
    const client = new QontoClient();
    const bankAccounts: QontoBankAccount[] = await client.getBankAccounts();

    // Filtrer uniquement les comptes actifs
    const activeAccounts = bankAccounts.filter(
      account => account.status === 'active'
    );

    // Transformer en format simplifié (forcer les nombres car Qonto peut retourner des strings)
    const accounts: BankAccountBalance[] = activeAccounts.map(account => ({
      id: account.id,
      name: account.name ?? 'Compte Principal',
      iban: account.iban,
      ibanMasked: maskIban(account.iban),
      balance: Number(account.balance) || 0,
      authorizedBalance: Number(account.authorized_balance) || 0,
      currency: account.currency,
      status: account.status,
      updatedAt: account.updated_at,
    }));

    // Calculer les totaux (en supposant même devise)
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const totalAuthorizedBalance = accounts.reduce(
      (sum, acc) => sum + acc.authorizedBalance,
      0
    );

    // Devise principale (première du tableau ou EUR par défaut)
    const currency = accounts.length > 0 ? accounts[0].currency : 'EUR';

    return NextResponse.json({
      success: true,
      accounts,
      totalBalance,
      totalAuthorizedBalance,
      currency,
      lastUpdated,
    });
  } catch (error) {
    let errorMessage = 'Erreur inconnue';
    let statusCode = 500;

    if (error instanceof QontoError) {
      errorMessage = `${error.code}: ${error.message}`;

      // Config manquante/invalide = 503 Service Unavailable (pas 500)
      if (
        error.code === 'AUTH_CONFIG_MISSING' ||
        error.code === 'AUTH_CONFIG_CONFLICT' ||
        error.code === 'AUTH_CONFIG_ERROR'
      ) {
        statusCode = 503;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    console.error('[API /qonto/balance] Error:', errorMessage);

    return NextResponse.json(
      {
        success: false,
        accounts: [],
        totalBalance: 0,
        totalAuthorizedBalance: 0,
        currency: 'EUR',
        lastUpdated,
        error: errorMessage,
      },
      { status: statusCode }
    );
  }
}
