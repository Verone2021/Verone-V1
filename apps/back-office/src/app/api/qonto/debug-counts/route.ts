/**
 * API Route: GET /api/qonto/debug-counts
 *
 * Compare Qonto transactions with database to verify backfill completeness.
 * Returns breakdown by year and side (debit/credit).
 *
 * ⚠️ SECURITY: Admin only, disabled in production by default
 */

import { NextResponse } from 'next/server';

import { getQontoClient } from '@verone/integrations/qonto';
import { createAdminClient } from '@verone/utils/supabase/server';

interface YearBreakdown {
  [year: string]: number;
}

interface CountResult {
  total: number;
  debits: number;
  credits: number;
  byYear: YearBreakdown;
}

export async function GET() {
  // Security: Only allow in development or with explicit flag
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.ALLOW_DEBUG_ENDPOINTS !== 'true'
  ) {
    return NextResponse.json(
      { error: 'Debug endpoint disabled in production' },
      { status: 404 }
    );
  }

  try {
    // 1. Get Qonto counts from all accounts
    const qontoClient = getQontoClient();
    const bankAccounts = await qontoClient.getBankAccounts();

    let qontoTotal = 0;
    const qontoDebits = 0;
    const qontoCredits = 0;
    const qontoByYear: YearBreakdown = {};

    // For each bank account, get transaction counts
    for (const account of bankAccounts) {
      // Get total count for this account
      const result = await qontoClient.getTransactions({
        bankAccountId: account.id,
        status: 'completed',
        perPage: 1, // We just want the count
      });

      // We can't get breakdown by year from Qonto API easily without fetching all
      // So we just get the total count from meta
      qontoTotal += result.meta.total_count;
    }

    // 2. Get database counts
    const supabase = createAdminClient();

    // Total transactions
    const { count: dbTotal } = await supabase
      .from('bank_transactions')
      .select('*', { count: 'exact', head: true });

    // Debits
    const { count: dbDebits } = await supabase
      .from('bank_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('side', 'debit');

    // Credits
    const { count: dbCredits } = await supabase
      .from('bank_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('side', 'credit');

    // By year (using settled_at or emitted_at)
    // Cast as any car la fonction RPC n'est pas encore dans les types générés
    const { data: yearData } = await (supabase.rpc as CallableFunction)(
      'get_transactions_by_year'
    );

    const dbByYear: YearBreakdown = {};
    if (yearData && Array.isArray(yearData)) {
      for (const row of yearData as Array<{ year: string; count: number }>) {
        dbByYear[row.year] = row.count;
      }
    }

    // Expenses count - cast as any car la table n'est pas encore dans les types générés
    const { count: expensesCreated } = await (
      supabase as { from: CallableFunction }
    )
      .from('expenses')
      .select('*', { count: 'exact', head: true });

    // Expenses by status
    let expensesByStatus: Array<{ status: string; count: number }> = [];
    try {
      const { data: expenseData } = await (
        supabase as { from: CallableFunction }
      )
        .from('expenses')
        .select('status');

      if (expenseData && Array.isArray(expenseData)) {
        const statusCounts: Record<string, number> = {};
        for (const e of expenseData as Array<{ status: string }>) {
          statusCounts[e.status] = (statusCounts[e.status] ?? 0) + 1;
        }
        expensesByStatus = Object.entries(statusCounts).map(
          ([status, count]) => ({
            status,
            count,
          })
        );
      }
    } catch {
      // Table might not exist yet
    }

    // 3. Build response
    const qontoResult: CountResult = {
      total: qontoTotal,
      debits: qontoDebits, // Not available without full fetch
      credits: qontoCredits, // Not available without full fetch
      byYear: qontoByYear,
    };

    const dbResult = {
      total: dbTotal ?? 0,
      debits: dbDebits ?? 0,
      credits: dbCredits ?? 0,
      expenses_created: expensesCreated ?? 0,
      expenses_by_status: expensesByStatus ?? [],
      byYear: dbByYear,
    };

    const match = qontoResult.total === dbResult.total;
    const diff = qontoResult.total - dbResult.total;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      qonto: qontoResult,
      database: dbResult,
      match,
      diff,
      message: match
        ? '✅ Database is in sync with Qonto'
        : `⚠️ Missing ${diff} transactions in database`,
    });
  } catch (error) {
    console.error('[Qonto Debug Counts] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
