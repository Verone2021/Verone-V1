export interface QuickPurchaseOrderModalProps {
  open: boolean;
  onClose: () => void;
  productId: string;
  shortageQuantity?: number;
  onSuccess?: () => void;
}

export interface ProductData {
  id: string;
  name: string;
  sku: string;
  supplier_id: string;
  cost_price: number;
  supplier_moq: number;
  eco_tax_default: number;
  primary_image_url?: string;
  supplier?: {
    id: string;
    legal_name: string;
  };
}

export interface DraftOrderInfo {
  exists: boolean;
  po_number?: string;
  order_id?: string;
}
