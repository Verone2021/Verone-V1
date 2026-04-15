/** Types for useBankTransactionStats hook */

export interface BankTransactionStats {
  totalCredit: number;
  totalDebit: number;
  netBalance: number;
  transactionCount: number;
  revenue: number;
  uncategorizedCredit: number;
  creditVariation: number;
  debitVariation: number;
  periodStart: string | null;
  periodEnd: string | null;
}

export interface MonthlyEvolution {
  month: string;
  monthLabel: string;
  credit: number;
  debit: number;
  balance: number;
  [key: string]: string | number;
}

export interface OrganisationBreakdown {
  organisationId: string | null;
  organisationName: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
  category: string | null;
  [key: string]: string | number | null;
}

export interface CategoryBreakdown {
  code: string;
  label: string;
  parentCode: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
  [key: string]: string | number;
}

export interface RecentTransaction {
  id: string;
  label: string;
  amount: number;
  side: 'credit' | 'debit';
  settledAt: string | null;
  counterpartyName: string | null;
  matchedOrganisation: string | null;
  category: string | null;
}

export interface BankTransactionStatsOptions {
  months?: number;
  startDate?: Date | null;
  endDate?: Date | null;
}
