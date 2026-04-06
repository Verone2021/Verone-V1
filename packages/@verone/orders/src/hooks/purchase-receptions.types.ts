export interface PurchaseOrderForReception {
  id: string;
  po_number: string;
  status: string;
  created_at: string;
  expected_delivery_date: string | null;
  received_at: string | null;
  received_by: string | null;

  // Supplier
  organisations: {
    id: string;
    legal_name: string;
    trade_name: string | null;
  } | null;

  // Items enrichis pour réception
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
      stock_quantity: number;
      stock_forecasted_in: number;
      product_images?: Array<{
        public_url: string;
        is_primary: boolean;
      }>;
    };
  }>;
}
