import type React from 'react';

import type { OrderItem } from '@verone/orders/hooks';

export interface OrderHeader {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  expected_delivery_date: string | null;
  total_ht?: number;
  total_ttc: number;
  customer_id?: string | null;
  customer_name?: string;
  customer_trade_name?: string | null;
  customer_email?: string | null;
  customer_type?: 'organization' | 'individual';
  supplier_name?: string;
  billing_address?: Record<string, unknown> | string | null;
  shipping_address?: Record<string, unknown> | string | null;
  delivery_address?: string | null;
  payment_terms?: string | null;
  payment_status_v2?: string | null;
  tax_rate?: number;
  currency?: string;
  eco_tax_vat_rate?: number | null;
  shipping_cost_ht?: number | null;
  handling_cost_ht?: number | null;
  insurance_cost_ht?: number | null;
  fees_vat_rate?: number | null;
  creator_name?: string;
  creator_email?: string;
  channel_name?: string;
}

export interface UniversalOrderDetailsModalProps {
  orderId: string | null;
  orderType: 'sales' | 'purchase' | null;
  open: boolean;
  onClose: () => void;
  initialEditMode?: boolean;
  onUpdate?: () => void;
  renderActions?: (order: {
    id: string;
    order_number: string;
    status: string;
    total_ht: number;
    total_ttc: number;
    tax_rate: number;
    currency: string;
    payment_terms: string;
    payment_status: string;
    customer_name: string;
    customer_email: string | null;
    customer_type: 'organization' | 'individual';
    shipping_cost_ht: number;
    handling_cost_ht: number;
    insurance_cost_ht: number;
    fees_vat_rate: number;
    items: OrderItem[];
  }) => React.ReactNode;
}

export const statusLabels: Record<string, string> = {
  draft: 'Brouillon',
  validated: 'Validée',
  sent: 'Envoyée',
  received: 'Reçue',
  partially_received: 'Partiellement reçue',
  cancelled: 'Annulée',
  partially_shipped: 'Partiellement expédiée',
  shipped: 'Expédiée',
};

export const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  validated: 'bg-blue-100 text-blue-800',
  sent: 'bg-purple-100 text-purple-800',
  received: 'bg-green-100 text-green-800',
  partially_received: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
  partially_shipped: 'bg-yellow-100 text-yellow-800',
  shipped: 'bg-green-100 text-green-800',
};
