import type { ExistingLink } from '@verone/finance/components';
import type { ManualPaymentType, OrderPayment } from '@verone/orders/hooks';
import type { LinkedDocument, OrderContact } from '../SendOrderDocumentsModal';
import type { ILinkedInvoice, ILinkedQuote } from './OrderInvoicingCard';
import type { ShipmentHistoryItem } from './OrderShipmentHistoryCard';

export interface RapprochementOrderShape {
  id: string;
  order_number: string;
  customer_name: string;
  customer_name_alt: string | null;
  total_ttc: number;
  paid_amount: number;
  created_at: string;
  order_date: string | null;
  shipped_at: string | null;
  payment_status_v2: string | null | undefined;
}

export interface OrderDetailDataState {
  // Modal visibility
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
  showInvoiceModal: boolean;
  setShowInvoiceModal: (v: boolean) => void;
  showQuoteModal: boolean;
  setShowQuoteModal: (v: boolean) => void;
  showSendDocsModal: boolean;
  setShowSendDocsModal: (v: boolean) => void;
  showAddProductModal: boolean;
  setShowAddProductModal: (v: boolean) => void;
  showPaymentDialog: boolean;
  setShowPaymentDialog: (v: boolean) => void;
  showOrgModal: boolean;
  setShowOrgModal: (v: boolean) => void;
  // Payment state
  paymentSubmitting: boolean;
  setPaymentSubmitting: (v: boolean) => void;
  orderPayments: OrderPayment[];
  setOrderPayments: (v: OrderPayment[]) => void;
  existingLinks: ExistingLink[];
  setExistingLinks: (v: ExistingLink[]) => void;
  deletingPaymentId: string | null;
  setDeletingPaymentId: (v: string | null) => void;
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
  // Invoice / quote
  linkedInvoices: ILinkedInvoice[];
  setLinkedInvoices: (v: ILinkedInvoice[]) => void;
  loadingLinkedInvoices: boolean;
  linkedQuotes: ILinkedQuote[];
  setLinkedQuotes: (v: ILinkedQuote[]) => void;
  loadingLinkedQuotes: boolean;
  // Documents / contacts
  linkedDocuments: LinkedDocument[];
  orderContacts: OrderContact[];
  // Shipment history
  shipmentHistory: ShipmentHistoryItem[];
  // Fees
  shippingCostHt: number;
  setShippingCostHt: (v: number) => void;
  handlingCostHt: number;
  setHandlingCostHt: (v: number) => void;
  insuranceCostHt: number;
  setInsuranceCostHt: (v: number) => void;
  feesVatRate: number;
  setFeesVatRate: (v: number) => void;
  feesSaving: boolean;
  setFeesSaving: (v: boolean) => void;
  // Memoized
  rapprochementOrder: RapprochementOrderShape | null;
}
