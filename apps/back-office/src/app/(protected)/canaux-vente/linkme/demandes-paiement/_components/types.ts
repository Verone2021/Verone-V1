import { Banknote, CheckCircle2, Clock, FileText, XCircle } from 'lucide-react';

// Re-export depuis le module consolidé pour compatibilité des composants locaux.
// Les composants qui importaient depuis ./types continuent de fonctionner.
export type {
  PaymentRequestAdmin,
  PaymentRequestStatus,
} from '../../hooks/use-payment-requests-admin';

import type { PaymentRequestStatus } from '../../hooks/use-payment-requests-admin';

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
  partially_paid: 'Partiellement payée',
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
  partially_paid: {
    icon: Banknote,
    color: 'text-amber-600',
    bg: 'bg-amber-100',
  },
  paid: {
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
  },
  cancelled: { icon: XCircle, color: 'text-gray-500', bg: 'bg-gray-100' },
};
