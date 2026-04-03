export interface ExistingLink {
  id: string;
  link_type: 'document' | 'sales_order' | 'purchase_order';
  allocated_amount: number;
  document_number: string | null;
  order_number: string | null;
  po_number: string | null;
  partner_name: string | null;
}

export interface RapprochementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: string | undefined;
  /** transaction_id Qonto (pour auto-attachment justificatif) */
  transactionQontoId?: string | null;
  label: string;
  amount: number;
  counterpartyName?: string | null;
  organisationName?: string | null;
  organisationId?: string | null;
  onSuccess?: () => void;
}

export interface FinancialDocument {
  id: string;
  document_type: string;
  document_number: string;
  total_ttc: number;
  amount_paid: number;
  partner_name?: string;
  document_date: string;
}

export interface SalesOrder {
  id: string;
  order_number: string;
  total_ht: number;
  total_ttc: number;
  customer_name?: string;
  organisation_id?: string;
  created_at: string;
  status: string;
  payment_status_v2?: string;
  amount_paid: number;
  remaining: number;
  matchScore?: number;
  matchReasons?: string[];
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  total_ht: number;
  total_ttc: number;
  supplier_name?: string;
  supplier_id?: string;
  created_at: string;
  status: string;
  matchScore?: number;
  matchReasons?: string[];
}

export interface LinkSuccess {
  type: 'document' | 'sales_order' | 'purchase_order';
  label: string;
  amount: number;
}
