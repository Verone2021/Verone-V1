export interface DashboardMetrics {
  hero: {
    ordersPending: number;
    stockAlerts: number;
    revenue30Days: number;
    consultations: number;
  };
  sales: {
    ordersLinkme: number;
    commissions: number;
    revenueByChannel: Array<{
      channel: string;
      orders: number;
      revenueTtc: number;
      revenueHt: number;
    }>;
    topProducts: Array<{
      id: string;
      name: string;
      sku: string;
      imageUrl: string | null;
      orders: number;
      quantity: number;
      revenueHt: number;
      marginPct: number | null;
      orderDate: string;
    }>;
    avgMarginPct: number | null;
  };
  stock: {
    products: { total: number; new_month: number };
    outOfStock: number;
    totalUnits: number;
    stockValue: number;
    movements30d: number;
    alerts: Array<{
      product_id: string;
      product_name: string;
      severity: string;
      min_stock: number;
      stock_real: number;
    }>;
  };
  finance: { revenue30Days: number };
  activity: {
    recentOrders: Array<{
      id: string;
      order_number: string;
      created_at: string;
      total_ttc: number;
      customer_type: string;
      status: string;
    }>;
  };
  kpis: {
    alertsStock: number;
    ordersPending: number;
    ordersLinkme: number;
    products: { total: number; new_month: number };
    consultations: number;
    customers: number;
    organisations: { total: number; new_month: number };
    commissions: number;
    outOfStock: number;
  };
  widgets: {
    stockAlerts: Array<{
      product_id: string;
      product_name: string;
      severity: string;
      min_stock: number;
      stock_real: number;
    }>;
    recentOrders: Array<{
      id: string;
      order_number: string;
      created_at: string;
      total_ttc: number;
      customer_type: string;
      status: string;
    }>;
  };
}
