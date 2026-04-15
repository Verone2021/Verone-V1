import type { PurchaseOrder, PurchaseOrderStatus } from '@verone/orders';
import type { Database } from '@verone/types';

// =====================================================================
// TYPES CANONIQUES — source de vérité unique pour cette page
// =====================================================================

/**
 * Type étendu pour les champs payment V2 et rapprochement.
 * Remplace les définitions locales dans page.tsx ET PurchaseOrderActionMenu.tsx.
 * La version ici ajoute `matched_transaction_amount` (requis par ActionMenu).
 */
export type PurchaseOrderExtended = PurchaseOrder & {
  payment_status_v2?:
    | 'paid'
    | 'pending'
    | 'partially_paid'
    | 'overpaid'
    | 'failed'
    | null;
  is_matched?: boolean | null;
  matched_transaction_label?: string | null;
  matched_transaction_amount?: number | null;
};

export type PurchaseOrderRow =
  Database['public']['Tables']['purchase_orders']['Row'];

export type SortColumn = 'date' | 'po_number' | 'amount' | null;
export type SortDirection = 'asc' | 'desc';

// =====================================================================
// CONSTANTES STATUT
// =====================================================================

export const statusLabels: Record<PurchaseOrderStatus, string> = {
  draft: 'Brouillon',
  validated: 'Validée',
  partially_received: 'Partiellement reçue',
  received: 'Reçue',
  cancelled: 'Annulée',
};

export const statusColors: Record<PurchaseOrderStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  validated: 'bg-blue-100 text-blue-800',
  partially_received: 'bg-amber-100 text-amber-800',
  received: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

// =====================================================================
// TYPES ÉTAT SHORTAGE
// =====================================================================

export type ShortageDetail = {
  itemId: string;
  productName: string;
  sku: string;
  quantityOrdered: number;
  minStock: number;
  stockReal: number;
  shortage: number;
  newQuantity: number;
};

export type CancelRemainderItem = {
  product_name: string;
  product_sku: string;
  quantity_remaining: number;
};
