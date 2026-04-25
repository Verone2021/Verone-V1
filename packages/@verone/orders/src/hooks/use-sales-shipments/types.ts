export interface ShipmentRecipientContact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
}

export interface SalesOrderForShipment {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  expected_delivery_date: string | null;
  shipped_at: string | null;
  shipped_by: string | null;
  total_ttc?: number; // Total TTC pour assurance

  // Customer (polymorphic)
  customer_id: string;
  customer_type: string; // 'organization' | 'individual'
  customer_name?: string; // Chargé dynamiquement selon customer_type
  customer_email?: string; // Email client (pour Packlink)

  // Shipping address (pré-remplir formulaire)
  shipping_address?: Record<string, unknown>;

  // Relations jointes (polymorphiques)
  organisations?: {
    id: string;
    legal_name: string;
    trade_name: string | null;
    email?: string;
    phone?: string;
    address_line1?: string;
    address_line2?: string;
    postal_code?: string;
    city?: string;
    region?: string;
    enseigne_id?: string | null;
  };

  // Contacts FK joints (pour pre-remplir l'etape Destinataire Packlink).
  // Ces 3 references sont les 3 roles que le user peut piocher dans la liste
  // radio. Si tous null, on tombe directement en saisie manuelle.
  responsable_contact?: ShipmentRecipientContact | null;
  billing_contact?: ShipmentRecipientContact | null;
  delivery_contact?: ShipmentRecipientContact | null;

  // Items enrichis pour expédition
  sales_order_items: Array<{
    id: string;
    product_id: string;
    quantity: number;
    quantity_shipped: number | null;
    unit_price_ht: number;
    products: {
      id: string;
      name: string;
      sku: string;
      stock_quantity: number;
      stock_real: number;
      stock_forecasted_out: number;
      product_images?: Array<{
        public_url: string;
        is_primary: boolean;
      }>;
    };
  }>;
}
