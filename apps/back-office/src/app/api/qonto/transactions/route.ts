/**
 * API Route: GET /api/qonto/transactions
 * Liste les transactions Qonto avec filtres
 *
 * Query params:
 * - side: 'credit' | 'debit' (credit = entrées)
 * - minAmount: montant minimum en centimes
 * - maxAmount: montant maximum en centimes
 * - perPage: nombre par page (default 50)
 * - page: numéro de page (default 1)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { QontoClient } from '@verone/integrations/qonto';

function getQontoClient(): QontoClient {
  return new QontoClient({
    authMode: (process.env.QONTO_AUTH_MODE as 'oauth' | 'api_key') || 'oauth',
    organizationId: process.env.QONTO_ORGANIZATION_ID,
    apiKey: process.env.QONTO_API_KEY,
    accessToken: process.env.QONTO_ACCESS_TOKEN,
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const side = searchParams.get('side') as 'credit' | 'debit' | null;
    const minAmountStr = searchParams.get('minAmount');
    const maxAmountStr = searchParams.get('maxAmount');
    const perPageStr = searchParams.get('perPage');
    const pageStr = searchParams.get('page');

    const client = getQontoClient();

    // Fetch transactions
    const result = await client.getTransactions({
      side: side || undefined,
      perPage: perPageStr ? parseInt(perPageStr, 10) : 50,
      currentPage: pageStr ? parseInt(pageStr, 10) : 1,
    });

    let transactions = result.transactions;

    // Filter by amount range if specified
    if (minAmountStr || maxAmountStr) {
      const minAmount = minAmountStr ? parseInt(minAmountStr, 10) : 0;
      const maxAmount = maxAmountStr
        ? parseInt(maxAmountStr, 10)
        : Number.MAX_SAFE_INTEGER;

      transactions = transactions.filter(t => {
        const amount = Math.abs(t.amount_cents);
        return amount >= minAmount && amount <= maxAmount;
      });
    }

    return NextResponse.json({
      success: true,
      transactions,
      meta: result.meta,
    });
  } catch (error) {
    console.error('[API Qonto Transactions] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
