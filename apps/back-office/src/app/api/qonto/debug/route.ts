/**
 * API Route: GET /api/qonto/debug
 * Debug endpoint pour voir exactement ce que retourne l'API Qonto
 *
 * ⚠️ SÉCURITÉ: Désactivé en production pour éviter fuite d'informations bancaires
 */

import { NextResponse } from 'next/server';

import { getQontoClient } from '@verone/integrations/qonto';

export async function GET() {
  // Bloquer en production - fuite d'informations sensibles (IBAN, soldes, etc.)
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Debug endpoint disabled in production' },
      { status: 404 }
    );
  }

  try {
    const client = getQontoClient();

    // 1. Récupérer TOUS les comptes bancaires
    const bankAccounts = await client.getBankAccounts();

    // 2. Pour CHAQUE compte, essayer de récupérer les transactions
    const transactionsByAccount: Array<Record<string, unknown>> = [];

    for (const account of bankAccounts) {
      try {
        // Test avec status completed
        const withStatus = await client.getTransactions({
          bankAccountId: account.id,
          status: 'completed',
          perPage: 10,
        });

        // Test SANS status
        const withoutStatus = await client.getTransactions({
          bankAccountId: account.id,
          perPage: 10,
        });

        transactionsByAccount.push({
          account: {
            id: account.id,
            slug: account.slug,
            name: account.name,
            iban: account.iban,
            balance: account.balance,
            currency: account.currency,
          },
          transactions: {
            withStatus: {
              total: withStatus.meta.total_count,
              count: withStatus.transactions.length,
              sample: withStatus.transactions.slice(0, 3).map(t => ({
                id: t.transaction_id,
                label: t.label,
                amount: t.amount,
                side: t.side,
                status: t.status,
                settled_at: t.settled_at,
              })),
            },
            withoutStatus: {
              total: withoutStatus.meta.total_count,
              count: withoutStatus.transactions.length,
              sample: withoutStatus.transactions.slice(0, 3).map(t => ({
                id: t.transaction_id,
                label: t.label,
                amount: t.amount,
                side: t.side,
                status: t.status,
                settled_at: t.settled_at,
              })),
            },
          },
        });
      } catch (accountError) {
        transactionsByAccount.push({
          account: {
            id: account.id,
            slug: account.slug,
            name: account.name,
          },
          error:
            accountError instanceof Error
              ? accountError.message
              : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      authMode: client.getAuthMode(),
      bankAccountsCount: bankAccounts.length,
      bankAccounts: bankAccounts.map(a => ({
        id: a.id,
        slug: a.slug,
        name: a.name,
        iban: a.iban,
        balance: a.balance,
        currency: a.currency,
      })),
      transactionsByAccount,
    });
  } catch (error) {
    console.error('[Qonto Debug] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
