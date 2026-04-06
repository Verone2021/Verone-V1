import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  DashboardNotification,
  ErrorLog,
  LowStockProduct,
  NotificationSeverity,
  UrgentPurchaseOrder,
  UrgentSalesOrder,
} from './use-dashboard-notifications.types';

export async function fetchLowStockNotifs(
  supabase: SupabaseClient
): Promise<DashboardNotification[]> {
  const { data: lowStockProducts } = await supabase
    .from('products')
    .select(
      `
      id, name, sku, stock_real, stock_quantity, min_stock, supplier_id,
      supplier:organisations!supplier_id(id, legal_name, trade_name),
      subcategories!subcategory_id(id, name)
    `
    )
    .or('stock_real.lt.10,stock_quantity.lt.10')
    .limit(5);

  if (!lowStockProducts || lowStockProducts.length === 0) return [];

  return (lowStockProducts as unknown as LowStockProduct[]).map(product => {
    const stock = product.stock_real ?? product.stock_quantity ?? 0;
    const category = product.subcategories?.name ?? 'Sans categorie';
    const supplierName =
      product.supplier?.trade_name ?? product.supplier?.legal_name ?? null;
    const message = `${product.name} (${category}) - ${stock} unites${supplierName ? ` - ${supplierName}` : ''}`;

    return {
      id: `stock-${product.id}`,
      type: 'stock' as const,
      severity: (stock < 5 ? 'critical' : 'warning') as NotificationSeverity,
      title: 'Stock bas',
      message,
      timestamp: new Date(),
      actionUrl: `/produits/catalogue/${product.id}`,
      actionLabel: 'Voir le produit',
      commanderUrl: product.supplier_id
        ? `/commandes/fournisseurs/create?product_id=${product.id}&supplier_id=${product.supplier_id}`
        : undefined,
    };
  });
}

export async function fetchUrgentOrderNotifs(
  supabase: SupabaseClient,
  threeDaysAgo: Date
): Promise<DashboardNotification[]> {
  const [urgentSalesOrders, urgentPurchaseOrders] = await Promise.all([
    supabase
      .from('sales_orders')
      .select(
        `
        id, order_number, created_at, total_ttc, customer_type, customer_id,
        customer_org:organisations!customer_id(id, legal_name, trade_name, city, country),
        customer_ind:individual_customers!individual_customer_id(id, first_name, last_name),
        sales_order_items(id, product_id, products(id, name))
      `
      )
      .eq('status', 'draft')
      .lt('created_at', threeDaysAgo.toISOString())
      .limit(3),
    supabase
      .from('purchase_orders')
      .select(
        `
        id, po_number, created_at, total_ht, supplier_id,
        supplier:organisations!supplier_id(id, legal_name, trade_name, city, country),
        purchase_order_items(id, product_id, products(id, name))
      `
      )
      .eq('status', 'draft')
      .lt('created_at', threeDaysAgo.toISOString())
      .limit(3),
  ]);

  const results: DashboardNotification[] = [];

  if (urgentSalesOrders.data && urgentSalesOrders.data.length > 0) {
    (urgentSalesOrders.data as unknown as UrgentSalesOrder[]).forEach(order => {
      const daysWaiting = Math.floor(
        (Date.now() - new Date(order.created_at).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const customerName =
        order.customer_type === 'organization'
          ? (order.customer_org?.trade_name ??
            order.customer_org?.legal_name ??
            'Client')
          : order.customer_ind
            ? `${order.customer_ind.first_name} ${order.customer_ind.last_name}`
            : 'Client';
      const location =
        order.customer_type === 'organization' &&
        order.customer_org?.city &&
        order.customer_org?.country
          ? ` (${order.customer_org.city}, ${order.customer_org.country})`
          : '';
      const mainProduct = order.sales_order_items?.[0]?.products?.name ?? null;
      const message = `${order.order_number ?? 'Sans reference'} - ${customerName}${location}${mainProduct ? ` - ${mainProduct}` : ''} - ${daysWaiting}j d'attente`;

      results.push({
        id: `sales-order-${order.id}`,
        type: 'order',
        severity: daysWaiting > 7 ? 'critical' : 'warning',
        title: 'Commande vente en attente',
        message,
        timestamp: new Date(order.created_at),
        actionUrl: `/commandes/clients?id=${order.id}`,
        actionLabel: 'Voir la commande',
      });
    });
  }

  if (urgentPurchaseOrders.data && urgentPurchaseOrders.data.length > 0) {
    (urgentPurchaseOrders.data as unknown as UrgentPurchaseOrder[]).forEach(
      order => {
        const daysWaiting = Math.floor(
          (Date.now() - new Date(order.created_at).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        const supplierName =
          order.supplier?.trade_name ??
          order.supplier?.legal_name ??
          'Fournisseur';
        const location =
          order.supplier?.city && order.supplier?.country
            ? ` (${order.supplier.city}, ${order.supplier.country})`
            : '';
        const mainProduct =
          order.purchase_order_items?.[0]?.products?.name ?? null;
        const message = `${order.po_number ?? 'Sans reference'} - ${supplierName}${location}${mainProduct ? ` - ${mainProduct}` : ''} - ${daysWaiting}j d'attente`;

        results.push({
          id: `purchase-order-${order.id}`,
          type: 'order',
          severity: daysWaiting > 7 ? 'critical' : 'warning',
          title: 'Commande achat en attente',
          message,
          timestamp: new Date(order.created_at),
          actionUrl: `/commandes/fournisseurs?id=${order.id}`,
          actionLabel: 'Voir la commande',
        });
      }
    );
  }

  return results;
}

export async function fetchErrorLogNotifs(
  supabase: SupabaseClient,
  oneDayAgo: Date
): Promise<DashboardNotification[]> {
  const { data: errorLogs } = await supabase
    .from('user_activity_logs')
    .select(
      `
      id, action, severity, created_at, metadata, user_id,
      user_profile:user_profiles!user_id(id, first_name, last_name, role)
    `
    )
    .in('severity', ['error', 'critical'])
    .gte('created_at', oneDayAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(3);

  if (!errorLogs || errorLogs.length === 0) return [];

  return (errorLogs as unknown as ErrorLog[]).map(log => {
    const userName =
      log.user_profile?.first_name && log.user_profile?.last_name
        ? `${log.user_profile.first_name} ${log.user_profile.last_name}`
        : null;
    const actionFormatted = log.action.replace(/_/g, ' ');
    const message = userName
      ? `${actionFormatted} - Par: ${userName} (${log.user_profile?.role ?? 'User'})`
      : actionFormatted;

    return {
      id: `error-${log.id}`,
      type: 'system' as const,
      severity: log.severity as 'error' | 'critical',
      title: 'Erreur systeme',
      message,
      timestamp: new Date(log.created_at),
      actionUrl: `/admin/activite-utilisateurs?log=${log.id}`,
      actionLabel: 'Voir les details',
    };
  });
}
