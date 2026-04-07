// =====================================================================
// TYPES — Exported types (re-exported from index.tsx) + internal types
// =====================================================================

export interface OrderForLink {
  id: string;
  order_number: string;
  customer_name?: string | null;
  customer_name_alt?: string | null;
  total_ttc: number;
  paid_amount?: number;
  created_at: string;
  order_date?: string | null;
  shipped_at?: string | null;
  payment_status_v2?: string | null;
}

export interface ExistingLink {
  id: string;
  transaction_id: string;
  transaction_label: string;
  counterparty_name: string | null;
  transaction_date: string;
  allocated_amount: number;
  bank_provider: string | null;
}

export interface RapprochementContentProps {
  order: OrderForLink | null;
  onSuccess?: () => void;
  onLinksChanged?: (links: ExistingLink[]) => void;
  // 'avoir' = credit note (negative total_ttc): uses debit transactions like purchase_order
  // but links via p_sales_order_id (not p_purchase_order_id)
  orderType?: 'sales_order' | 'purchase_order' | 'avoir';
}

export interface CreditTransaction {
  id: string;
  transaction_id: string;
  label: string;
  amount: number;
  counterparty_name: string | null;
  emitted_at: string;
  settled_at: string | null;
  unified_status: string;
}

export interface TransactionSuggestion extends CreditTransaction {
  matchPriority: string;
  matchScore: number;
  matchReasons: string[];
  sortOrder: number;
}
