/**
 * API Route: GET /api/qonto/status
 * Vérifie l'état de l'API Qonto et retourne les compteurs
 */

import { NextResponse } from 'next/server';

import { getQontoClient } from '@verone/integrations/qonto';

export async function GET() {
  try {
    const client = getQontoClient();

    // 1. Health check (récupère aussi les comptes bancaires)
    const health = await client.healthCheck();

    if (!health.healthy) {
      return NextResponse.json(
        {
          success: false,
          error: health.error,
          authMode: health.authMode,
        },
        { status: 401 }
      );
    }

    // 2. Récupérer les comptes bancaires
    const bankAccounts = await client.getBankAccounts();

    // 3. Récupérer les factures clients
    const { client_invoices, meta: invoicesMeta } =
      await client.getClientInvoices({
        perPage: 100,
      });

    // 4. Récupérer les transactions de TOUS les comptes
    const allTransactions: Awaited<
      ReturnType<typeof client.getTransactions>
    >['transactions'] = [];
    let totalTransactionsCount = 0;

    for (const account of bankAccounts) {
      const { transactions: accountTransactions, meta } =
        await client.getTransactions({
          bankAccountId: account.id,
          status: 'completed',
          perPage: 100,
        });
      allTransactions.push(...accountTransactions);
      totalTransactionsCount += meta.total_count;
    }

    const transactions = allTransactions;
    const transactionsMeta = { total_count: totalTransactionsCount };

    // 4. Résumé des factures par statut
    const invoicesByStatus = {
      draft: client_invoices.filter(i => i.status === 'draft').length,
      unpaid: client_invoices.filter(i => i.status === 'unpaid').length,
      paid: client_invoices.filter(i => i.status === 'paid').length,
      overdue: client_invoices.filter(i => i.status === 'overdue').length,
      cancelled: client_invoices.filter(i => i.status === 'cancelled').length,
    };

    return NextResponse.json({
      success: true,
      authMode: health.authMode,
      bankAccountsCount: health.bankAccountsCount,
      invoices: {
        total: invoicesMeta.total_count,
        byStatus: invoicesByStatus,
        sample: client_invoices.slice(0, 5).map(inv => ({
          id: inv.id,
          number: inv.invoice_number,
          status: inv.status,
          total_amount: inv.total_amount,
          issue_date: inv.issue_date,
          client_name: inv.client?.name,
        })),
      },
      transactions: {
        total: transactionsMeta.total_count,
        sample: transactions.slice(0, 5).map(t => ({
          id: t.transaction_id,
          label: t.label,
          amount: t.amount,
          currency: t.currency,
          side: t.side,
          settled_at: t.settled_at,
        })),
      },
    });
  } catch (error) {
    console.error('[Qonto Status] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
