import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  ExpenseBreakdown,
  TreasuryEvolution,
  TreasuryForecast,
  TreasuryMetrics,
  TreasuryStats,
} from './use-treasury-stats.types';

export interface TreasuryTxRow {
  emitted_at: string;
  amount: number;
  side: 'credit' | 'debit';
}

type MonthlyData = Record<string, { inbound: number; outbound: number }>;

export function groupTransactionsByMonth(
  transactionsData: TreasuryTxRow[] | null
): MonthlyData {
  const monthlyData: MonthlyData = {};

  transactionsData?.forEach(tx => {
    const month = tx.emitted_at.substring(0, 7); // YYYY-MM
    if (!monthlyData[month]) {
      monthlyData[month] = { inbound: 0, outbound: 0 };
    }
    if (tx.side === 'credit') {
      monthlyData[month].inbound += Math.abs(tx.amount);
    } else {
      monthlyData[month].outbound += Math.abs(tx.amount);
    }
  });

  return monthlyData;
}

export function buildEvolutionArray(
  monthlyData: MonthlyData
): TreasuryEvolution[] {
  let cumulativeBalance = 0;
  return Object.entries(monthlyData)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, data]) => {
      cumulativeBalance += data.inbound - data.outbound;
      return {
        date,
        inbound: data.inbound,
        outbound: data.outbound,
        balance: cumulativeBalance,
      };
    });
}

export function calculateMetrics(monthlyData: MonthlyData): {
  avgBurnRate: number;
  cashFlowNet: number;
  variation: number;
  lastSixMonths: string[];
  avgInbound: number;
} {
  const currentMonth = new Date().toISOString().substring(0, 7);
  const currentMonthData = monthlyData[currentMonth] ?? {
    inbound: 0,
    outbound: 0,
  };

  const sortedMonths = Object.keys(monthlyData).sort().reverse();
  const lastSixMonths = sortedMonths.slice(0, 6);
  const totalOutboundSixMonths = lastSixMonths.reduce(
    (sum, m) => sum + (monthlyData[m]?.outbound ?? 0),
    0
  );
  const avgBurnRate =
    totalOutboundSixMonths / Math.max(lastSixMonths.length, 1);
  const avgInbound =
    lastSixMonths.reduce((sum, m) => sum + (monthlyData[m]?.inbound ?? 0), 0) /
    Math.max(lastSixMonths.length, 1);

  const cashFlowNet = currentMonthData.inbound - currentMonthData.outbound;

  const prevMonth = sortedMonths[1];
  const prevMonthData = prevMonth
    ? monthlyData[prevMonth]
    : { inbound: 0, outbound: 0 };
  const prevCashFlow = prevMonthData.inbound - prevMonthData.outbound;
  const variation =
    prevCashFlow !== 0
      ? ((cashFlowNet - prevCashFlow) / Math.abs(prevCashFlow)) * 100
      : 0;

  return { avgBurnRate, cashFlowNet, variation, lastSixMonths, avgInbound };
}

export function calculateTotals(transactionsData: TreasuryTxRow[] | null): {
  totalInbound: number;
  totalOutbound: number;
} {
  const totalInbound =
    transactionsData
      ?.filter(tx => tx.side === 'credit')
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0) ?? 0;
  const totalOutbound =
    transactionsData
      ?.filter(tx => tx.side === 'debit')
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0) ?? 0;
  return { totalInbound, totalOutbound };
}

export function buildForecasts(
  avgBurnRate: number,
  avgInbound: number,
  currentBalance: number
): TreasuryForecast[] {
  return [30, 60, 90].map(days => {
    const monthsAhead = days / 30;
    const projectedOutbound = avgBurnRate * monthsAhead;
    const projectedInbound = avgInbound * monthsAhead;
    return {
      period: `${days}d` as '30d' | '60d' | '90d',
      expected_inbound: projectedInbound,
      expected_outbound: projectedOutbound,
      projected_balance: currentBalance + projectedInbound - projectedOutbound,
    };
  });
}

export function buildExpenseBreakdown(
  expensesCategoryData: Array<{ category: string | null; amount: number }>
): ExpenseBreakdown[] {
  const categoryData: Record<string, { total: number; count: number }> = {};
  let totalExpenses = 0;

  expensesCategoryData.forEach(exp => {
    const cat = exp.category ?? 'other';
    if (!categoryData[cat]) {
      categoryData[cat] = { total: 0, count: 0 };
    }
    categoryData[cat].total += Math.abs(exp.amount);
    categoryData[cat].count += 1;
    totalExpenses += Math.abs(exp.amount);
  });

  return Object.entries(categoryData)
    .map(([name, data]) => ({
      category_name: name,
      category_code: name,
      total_amount: data.total,
      count: data.count,
      percentage: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.total_amount - a.total_amount);
}

export async function fetchArAp(supabase: SupabaseClient): Promise<{
  arTotal: number;
  arCount: number;
  apTotal: number;
  apCount: number;
}> {
  let arTotal = 0;
  let arCount = 0;
  let apTotal = 0;
  let apCount = 0;

  try {
    const { data: arData } = await supabase
      .from('financial_documents')
      .select('total_ttc, amount_paid')
      .eq('document_direction', 'inbound')
      .not('status', 'in', '(paid,cancelled)');

    if (arData) {
      (
        arData as Array<{
          total_ttc: number | null;
          amount_paid: number | null;
        }>
      ).forEach(doc => {
        const unpaid = (doc.total_ttc ?? 0) - (doc.amount_paid ?? 0);
        if (unpaid > 0) {
          arTotal += unpaid;
          arCount++;
        }
      });
    }

    const { data: apData } = await supabase
      .from('financial_documents')
      .select('total_ttc, amount_paid')
      .eq('document_direction', 'outbound')
      .not('status', 'in', '(paid,cancelled)');

    if (apData) {
      (
        apData as Array<{
          total_ttc: number | null;
          amount_paid: number | null;
        }>
      ).forEach(doc => {
        const unpaid = (doc.total_ttc ?? 0) - (doc.amount_paid ?? 0);
        if (unpaid > 0) {
          apTotal += unpaid;
          apCount++;
        }
      });
    }
  } catch (err) {
    console.warn('Error fetching AR/AP from financial_documents:', err);
  }

  return { arTotal, arCount, apTotal, apCount };
}

export interface ComputedTransactionStats {
  evolution: TreasuryEvolution[];
  stats: TreasuryStats;
  metrics: TreasuryMetrics;
  forecasts: TreasuryForecast[];
  expenseBreakdown: ExpenseBreakdown[];
}

export async function computeTransactionStats(
  supabase: SupabaseClient,
  currentBalance: number,
  defaultStartDate: string,
  defaultEndDate: string
): Promise<ComputedTransactionStats> {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const startDateForEvolution = twelveMonthsAgo.toISOString().split('T')[0];

  const { data: transactionsData, error: transactionsError } = await supabase
    .from('bank_transactions')
    .select('emitted_at, amount, side')
    .gte('emitted_at', startDateForEvolution)
    .order('emitted_at', { ascending: true });

  if (transactionsError) {
    console.warn('Error fetching bank_transactions:', transactionsError);
  }

  const txRows = transactionsData as TreasuryTxRow[] | null;
  const monthlyData = groupTransactionsByMonth(txRows);
  const evolution = buildEvolutionArray(monthlyData);

  const { avgBurnRate, cashFlowNet, variation, avgInbound } =
    calculateMetrics(monthlyData);
  const { totalInbound, totalOutbound } = calculateTotals(txRows);
  const { arTotal, arCount, apTotal, apCount } = await fetchArAp(supabase);

  const stats: TreasuryStats = {
    total_invoiced_ar: arTotal,
    total_paid_ar: totalInbound,
    unpaid_count_ar: arCount,
    overdue_ar: 0,
    total_invoiced_ap: apTotal,
    total_paid_ap: totalOutbound,
    unpaid_count_ap: apCount,
    overdue_ap: 0,
    net_balance: totalInbound - totalOutbound,
    net_cash_flow: cashFlowNet,
  };

  const metrics: TreasuryMetrics = {
    burnRate: avgBurnRate,
    runwayMonths: avgBurnRate > 0 ? currentBalance / avgBurnRate : 999,
    cashFlowNet,
    cashFlowVariation: variation,
  };

  const forecasts = buildForecasts(avgBurnRate, avgInbound, currentBalance);

  let expenseBreakdown: ExpenseBreakdown[] = [];
  const { data: expensesCategoryData, error: expensesCatError } = await supabase
    .from('v_expenses_with_details')
    .select('category, amount')
    .eq('side', 'debit')
    .gte('emitted_at', defaultStartDate)
    .lte('emitted_at', defaultEndDate);

  if (!expensesCatError && expensesCategoryData) {
    expenseBreakdown = buildExpenseBreakdown(
      expensesCategoryData as Array<{ category: string | null; amount: number }>
    );
  }

  return { evolution, stats, metrics, forecasts, expenseBreakdown };
}
