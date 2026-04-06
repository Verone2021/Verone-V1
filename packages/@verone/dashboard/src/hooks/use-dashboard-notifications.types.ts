// Public types
export type NotificationType = 'stock' | 'order' | 'system' | 'activity';
export type NotificationSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface DashboardNotification {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  timestamp: Date;
  actionUrl?: string;
  actionLabel?: string;
  commanderUrl?: string; // URL pour creer une commande fournisseur directement
  isRead?: boolean;
  read_at?: Date; // Timestamp marquage lu
}

export interface UseDashboardNotificationsResult {
  notifications: DashboardNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
}

// ============================================================================
// Internal query result types (matching Supabase select shapes)
// ============================================================================

export interface LowStockProduct {
  id: string;
  name: string | null;
  sku: string | null;
  stock_real: number | null;
  stock_quantity: number | null;
  min_stock: number | null;
  supplier_id: string | null;
  supplier: {
    id: string;
    legal_name: string | null;
    trade_name: string | null;
  } | null;
  subcategories: { id: string; name: string | null } | null;
}

export interface OrgRelation {
  id: string;
  legal_name: string | null;
  trade_name: string | null;
  city: string | null;
  country: string | null;
}

export interface IndividualRelation {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

export interface ProductRelation {
  id?: string;
  name: string | null;
}

export interface UrgentSalesOrder {
  id: string;
  order_number: string | null;
  created_at: string;
  total_ttc: number | null;
  customer_type: string | null;
  customer_id: string | null;
  customer_org: OrgRelation | null;
  customer_ind: IndividualRelation | null;
  sales_order_items: Array<{
    id: string;
    product_id: string | null;
    products: ProductRelation | null;
  }>;
}

export interface UrgentPurchaseOrder {
  id: string;
  po_number: string | null;
  created_at: string;
  total_ht: number | null;
  supplier_id: string | null;
  supplier: OrgRelation | null;
  purchase_order_items: Array<{
    id: string;
    product_id: string | null;
    products: ProductRelation | null;
  }>;
}

export interface ErrorLog {
  id: string;
  action: string;
  severity: string;
  created_at: string;
  metadata: unknown;
  user_id: string | null;
  user_profile: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    role: string | null;
  } | null;
}

export interface RecentSalesOrder {
  id: string;
  order_number: string | null;
  created_at: string;
  customer_type: string | null;
  customer_org: {
    id: string;
    legal_name: string | null;
    trade_name: string | null;
  } | null;
  customer_ind: IndividualRelation | null;
  sales_order_items: Array<{ id: string; products: ProductRelation | null }>;
}

export interface RecentPurchaseOrder {
  id: string;
  po_number: string | null;
  created_at: string;
  supplier: {
    id: string;
    legal_name: string | null;
    trade_name: string | null;
  } | null;
  purchase_order_items: Array<{ id: string; products: ProductRelation | null }>;
}

export interface OrgRow {
  id: string;
  legal_name: string | null;
  trade_name: string | null;
  city: string | null;
  country: string | null;
  created_at: string;
}

export interface IndividualCustomerRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  city: string | null;
  country: string | null;
  created_at: string;
}

export interface SampleOrder {
  id: string;
  order_number: string | null;
  created_at: string;
  status?: string;
  supplier: {
    id: string;
    legal_name: string | null;
    trade_name: string | null;
  } | null;
  sample_order_items: Array<{
    id: string;
    product_id?: string | null;
    products: ProductRelation | null;
  }>;
}
