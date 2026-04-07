export interface TreasuryStats {
  // AR (Accounts Receivable - Clients)
  total_invoiced_ar: number;
  total_paid_ar: number;
  unpaid_count_ar: number;
  overdue_ar: number;

  // AP (Accounts Payable - Fournisseurs + Dépenses)
  total_invoiced_ap: number;
  total_paid_ap: number;
  unpaid_count_ap: number;
  overdue_ap: number;

  // Balance
  net_balance: number;
  net_cash_flow: number;
}

export interface TreasuryEvolution {
  date: string;
  inbound: number; // AR encaissé
  outbound: number; // AP décaissé
  balance: number; // Net
}

export interface ExpenseBreakdown {
  category_name: string;
  category_code: string;
  total_amount: number;
  count: number;
  percentage: number;
}

export interface TreasuryForecast {
  period: '30d' | '60d' | '90d';
  expected_inbound: number;
  expected_outbound: number;
  projected_balance: number;
}

// Types pour les comptes bancaires Qonto
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

export interface BankBalanceData {
  success: boolean;
  accounts: BankAccountBalance[];
  totalBalance: number;
  totalAuthorizedBalance: number;
  currency: string;
  lastUpdated: string;
  error?: string;
}

// Métriques calculées
export interface TreasuryMetrics {
  burnRate: number; // Dépenses moyennes mensuelles
  runwayMonths: number; // Mois avant épuisement
  cashFlowNet: number; // Entrées - Sorties du mois
  cashFlowVariation: number; // % variation vs mois précédent
}
