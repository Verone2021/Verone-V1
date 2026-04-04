// ============================================================================
// TYPES LOCAUX — Page Réceptions Marchandises
// ============================================================================

/**
 * Purchase Order avec items enrichis + supplier name mappé
 * Retourné par loadPurchaseOrdersReadyForReception()
 */
export interface PurchaseOrderWithSupplier {
  id: string;
  po_number: string;
  status: string;
  created_at: string;
  expected_delivery_date: string | null;
  received_at: string | null;
  supplier_name: string;
  organisations: {
    id: string;
    legal_name: string;
    trade_name: string | null;
  } | null;
  purchase_order_items: Array<{
    id: string;
    product_id: string;
    quantity: number;
    quantity_received: number | null;
    unit_price_ht: number;
    products: {
      id: string;
      name: string;
      sku: string;
      stock_real: number | null;
      product_images?: Array<{
        public_url: string;
        is_primary: boolean;
      }>;
    };
  }>;
}

/**
 * Historique annulation (reliquat annulé)
 * Retourné par loadCancellationHistory()
 */
export interface CancellationHistoryItem {
  id: string;
  performed_at: string;
  notes: string | null;
  quantity_cancelled: number;
  product_name: string;
  product_sku: string;
}

/**
 * Réception affilié mappée avec noms display
 * Retourné par loadAffiliateProductReceptions()
 */
export interface AffiliateReceptionMapped {
  id: string;
  reference_type: string;
  product_id: string;
  quantity_expected: number;
  quantity_received: number | null;
  status: string;
  notes: string | null;
  received_at: string | null;
  received_by: string | null;
  created_at: string;
  affiliate_id: string | null;
  affiliate_name: string;
  enseigne_name: string;
  product_name: string;
  product_sku: string;
  product_image_url: string | null;
}

/**
 * Filtres pour queries PO
 */
export interface ReceptionFilters {
  status?: string;
  search?: string;
  urgent_only?: boolean;
  overdue_only?: boolean;
}
