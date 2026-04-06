import type { Database } from '@verone/types';

export type PurchaseOrder =
  Database['public']['Tables']['purchase_orders']['Row'];

// Interface pour items locaux (mode création)
// Note: utilise `products` (pluriel) pour compatibilité avec EditableOrderItemRow
export interface LocalOrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price_ht: number;
  discount_percentage: number;
  eco_tax: number;
  notes?: string;
  products?: {
    id: string;
    name: string;
    sku: string;
    primary_image_url?: string;
    product_images?: Array<{ public_url: string; is_primary: boolean }>;
  };
}

export interface PurchaseOrderFormModalProps {
  order?: PurchaseOrder; // Si fourni, mode ÉDITION
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  prefilledProduct?: {
    supplier_id?: string;
    requires_sample?: boolean;
    name?: string;
    product_id?: string;
  };
  prefilledSupplier?: string;
}
