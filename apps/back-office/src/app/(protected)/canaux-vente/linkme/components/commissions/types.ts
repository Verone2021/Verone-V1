import { Clock, CheckCircle, CreditCard, XCircle } from 'lucide-react';

export interface Commission {
  id: string;
  affiliate_id: string;
  selection_id: string | null;
  order_id: string | null;
  order_item_id: string | null;
  order_amount_ht: number;
  affiliate_commission: number;
  linkme_commission: number;
  margin_rate_applied: number;
  linkme_rate_applied: number;
  status: string | null;
  validated_at: string | null;
  paid_at: string | null;
  payment_reference: string | null;
  payment_method: string | null;
  created_at: string | null;
  affiliate?: {
    display_name: string;
  } | null;
}

export interface CommissionWithAffiliate extends Commission {
  affiliate: {
    display_name: string;
  } | null;
}

export interface AffiliateOption {
  id: string;
  display_name: string;
}

export const statusConfig = {
  pending: {
    label: 'En attente',
    variant: 'outline' as const,
    icon: Clock,
    color: 'text-orange-600',
  },
  validated: {
    label: 'Validée',
    variant: 'default' as const,
    icon: CheckCircle,
    color: 'text-blue-600',
  },
  paid: {
    label: 'Payée',
    variant: 'default' as const,
    icon: CreditCard,
    color: 'text-green-600',
  },
  cancelled: {
    label: 'Annulée',
    variant: 'destructive' as const,
    icon: XCircle,
    color: 'text-red-600',
  },
};
