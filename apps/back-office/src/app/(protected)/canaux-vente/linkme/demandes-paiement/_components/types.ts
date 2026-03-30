import { Clock, FileText, CheckCircle2, XCircle } from 'lucide-react';

export type PaymentRequestStatus =
  | 'pending'
  | 'invoice_received'
  | 'paid'
  | 'cancelled';

export interface PaymentRequestAdmin {
  id: string;
  requestNumber: string;
  affiliateId: string;
  affiliateName: string;
  affiliateEmail: string;
  totalAmountHT: number;
  totalAmountTTC: number;
  status: PaymentRequestStatus;
  invoiceFileUrl: string | null;
  invoiceFileName: string | null;
  invoiceReceivedAt: string | null;
  paidAt: string | null;
  paymentReference: string | null;
  createdAt: string;
}

export interface PaymentRequestRaw {
  id: string;
  request_number: string;
  affiliate_id: string;
  total_amount_ht: number;
  total_amount_ttc: number;
  status: string;
  invoice_file_url: string | null;
  invoice_file_name: string | null;
  invoice_received_at: string | null;
  paid_at: string | null;
  payment_reference: string | null;
  created_at: string;
  linkme_affiliates: {
    display_name: string;
    email: string | null;
  } | null;
}

export const STATUS_LABELS: Record<PaymentRequestStatus, string> = {
  pending: 'En attente de facture',
  invoice_received: 'Facture reçue',
  paid: 'Payée',
  cancelled: 'Annulée',
};

export const STATUS_CONFIG: Record<
  PaymentRequestStatus,
  { icon: typeof Clock; color: string; bg: string }
> = {
  pending: { icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100' },
  invoice_received: {
    icon: FileText,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
  },
  paid: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  cancelled: { icon: XCircle, color: 'text-gray-500', bg: 'bg-gray-100' },
};
