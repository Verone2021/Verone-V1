import type { ExistingLink } from '@verone/finance/components';

import type {
  PurchaseOrder,
  ManualPaymentType,
  OrderPayment,
} from '@verone/orders/hooks';

// ✅ Type Safety: Interface ProductImage stricte (IDENTIQUE à OrderDetailModal)
export interface ProductImage {
  id?: string;
  public_url: string;
  is_primary: boolean;
  display_order?: number;
}

/** Extended PO fields that may exist in DB but not in the base interface */
export interface PurchaseOrderExtended extends PurchaseOrder {
  shipping_cost_ht?: number;
  customs_cost_ht?: number;
  insurance_cost_ht?: number;
}

export interface PurchaseOrderDetailModalProps {
  order: PurchaseOrder | null;
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void;
  initialPaymentOpen?: boolean;
}

export interface SupplierInvoice {
  id: string;
  document_number: string;
  status: string;
  total_ttc: number;
  amount_paid: number;
  document_date: string;
  due_date: string | null;
}

export interface LinkedTransaction {
  id: string;
  allocated_amount: number;
  bank_transactions: {
    label: string;
    amount: number;
    settled_at: string | null;
    emitted_at: string;
  } | null;
}

// ✅ Status Labels Achats (ALIGNÉS avec workflow purchase orders)
export const orderStatusLabels: Record<string, string> = {
  draft: 'Brouillon',
  sent: 'Envoyée',
  confirmed: 'Confirmée',
  partially_received: 'Partiellement reçue',
  received: 'Reçue',
  cancelled: 'Annulée',
};

export const orderStatusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-purple-100 text-purple-800',
  partially_received: 'bg-yellow-100 text-yellow-800',
  received: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

// ✅ Payment Terms Labels (ENUM mapping - aligné avec CommercialEditSection)
export const paymentTermsLabels: Record<string, string> = {
  PREPAID: 'Prépaiement obligatoire',
  NET_30: '30 jours net',
  NET_60: '60 jours net',
  NET_90: '90 jours net',
};

export const paymentTypeLabels: Record<string, string> = {
  cash: 'Espèces',
  check: 'Chèque',
  transfer_other: 'Virement bancaire',
  card: 'Carte bancaire',
  compensation: 'Compensation',
};

export type ReceptionHistoryItem = {
  received_at: string;
  items?: Array<{
    product_name: string;
    product_sku: string;
    quantity_received: number;
  }>;
};

export type CancellationItem = {
  id: string;
  performed_at: string;
  notes: string | null;
  quantity_cancelled: number;
  product_name: string;
  product_sku: string;
};

export type RapprochementOrderShape = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_name_alt: string | null | undefined;
  total_ttc: number;
  paid_amount: number;
  created_at: string;
  order_date: string | null;
  shipped_at: null;
  payment_status_v2: string | null | undefined;
};

export interface PODetailState {
  // Modals
  showReceivingModal: boolean;
  setShowReceivingModal: (v: boolean) => void;
  showOrgModal: boolean;
  setShowOrgModal: (v: boolean) => void;

  // Payment dialog
  showPaymentDialog: boolean;
  setShowPaymentDialog: (v: boolean) => void;
  paymentSubmitting: boolean;
  setPaymentSubmitting: (v: boolean) => void;
  manualPaymentType: ManualPaymentType;
  setManualPaymentType: (v: ManualPaymentType) => void;
  manualPaymentAmount: string;
  setManualPaymentAmount: (v: string) => void;
  manualPaymentDate: string;
  setManualPaymentDate: (v: string) => void;
  manualPaymentRef: string;
  setManualPaymentRef: (v: string) => void;
  manualPaymentNote: string;
  setManualPaymentNote: (v: string) => void;

  // Payments
  orderPayments: OrderPayment[];
  setOrderPayments: (v: OrderPayment[]) => void;
  existingLinks: ExistingLink[];
  setExistingLinks: (v: ExistingLink[]) => void;
  deletingPaymentId: string | null;
  setDeletingPaymentId: (v: string | null) => void;
  showDeletePaymentConfirmation: boolean;
  setShowDeletePaymentConfirmation: (v: boolean) => void;
  paymentToDelete: string | null;
  setPaymentToDelete: (v: string | null) => void;

  // History
  receptionHistory: ReceptionHistoryItem[];
  cancellations: CancellationItem[];

  // Finance
  invoices: SupplierInvoice[];
  linkedTransactions: LinkedTransaction[];
  isLoadingFinance: boolean;

  // Computed
  totalEcoTax: number;
  rapprochementOrder: RapprochementOrderShape | null;
  manualTotal: number;
  linksTotal: number;
  totalPaid: number;
  orderTotalTtc: number;
  unifiedRemaining: number;
  isFullyPaid: boolean;

  // Helpers
  formatDate: (date: string | null) => string;
  getSupplierName: () => string;
  canMarkAsPaid: boolean;
  canReceive: boolean;
  paymentTerms: string | null | undefined;
  refreshPayments: () => void;
  handleDeletePayment: (paymentId: string) => void;
  handleDeletePaymentConfirmed: () => void;
  openPaymentDialog: () => void;

  // Hook actions
  markAsManuallyPaid: (
    orderId: string,
    paymentType: ManualPaymentType,
    amount: number,
    options?: { reference?: string; note?: string; date?: Date }
  ) => Promise<void>;
}
