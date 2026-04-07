import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  DashboardNotification,
  IndividualCustomerRow,
  OrgRow,
  RecentPurchaseOrder,
  RecentSalesOrder,
  SampleOrder,
} from './use-dashboard-notifications.types';

export async function fetchActivityNotifs(
  supabase: SupabaseClient,
  twoHoursAgo: Date
): Promise<DashboardNotification[]> {
  const [recentSalesOrders, recentPurchaseOrders] = await Promise.all([
    supabase
      .from('sales_orders')
      .select(
        `
        id, order_number, created_at, customer_type,
        customer_org:organisations!customer_id(id, legal_name, trade_name),
        customer_ind:individual_customers!individual_customer_id(id, first_name, last_name),
        sales_order_items(id, products(name))
      `
      )
      .gte('created_at', twoHoursAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(2),
    supabase
      .from('purchase_orders')
      .select(
        `
        id, po_number, created_at,
        supplier:organisations!supplier_id(id, legal_name, trade_name),
        purchase_order_items(id, products(name))
      `
      )
      .gte('created_at', twoHoursAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(2),
  ]);

  const results: DashboardNotification[] = [];

  if (recentSalesOrders.data && recentSalesOrders.data.length > 0) {
    (recentSalesOrders.data as unknown as RecentSalesOrder[]).forEach(order => {
      const customerName =
        order.customer_type === 'organization'
          ? (order.customer_org?.trade_name ??
            order.customer_org?.legal_name ??
            'Client')
          : order.customer_ind
            ? `${order.customer_ind.first_name} ${order.customer_ind.last_name}`
            : 'Client';
      const mainProduct = order.sales_order_items?.[0]?.products?.name ?? null;
      const message = `${order.order_number ?? 'Sans reference'} - ${customerName}${mainProduct ? ` (${mainProduct})` : ''}`;

      results.push({
        id: `activity-sales-${order.id}`,
        type: 'activity',
        severity: 'info',
        title: 'Nouvelle commande vente',
        message,
        timestamp: new Date(order.created_at),
        actionUrl: `/commandes/clients?id=${order.id}`,
        actionLabel: 'Voir la commande',
      });
    });
  }

  if (recentPurchaseOrders.data && recentPurchaseOrders.data.length > 0) {
    (recentPurchaseOrders.data as unknown as RecentPurchaseOrder[]).forEach(
      order => {
        const supplierName =
          order.supplier?.trade_name ??
          order.supplier?.legal_name ??
          'Fournisseur';
        const mainProduct =
          order.purchase_order_items?.[0]?.products?.name ?? null;
        const message = `${order.po_number ?? 'Sans reference'} - ${supplierName}${mainProduct ? ` (${mainProduct})` : ''}`;

        results.push({
          id: `activity-purchase-${order.id}`,
          type: 'activity',
          severity: 'info',
          title: 'Nouvelle commande achat',
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

export async function fetchOrgNotifs(
  supabase: SupabaseClient,
  oneDayAgo: Date
): Promise<DashboardNotification[]> {
  const [newCustomerOrgs, newIndividualCustomers, newSuppliers] =
    await Promise.all([
      supabase
        .from('organisations')
        .select('id, legal_name, trade_name, city, country, created_at')
        .eq('type', 'customer')
        .gte('created_at', oneDayAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(2),
      supabase
        .from('individual_customers')
        .select('id, first_name, last_name, city, country, created_at')
        .gte('created_at', oneDayAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(2),
      supabase
        .from('organisations')
        .select('id, legal_name, trade_name, city, country, created_at')
        .eq('type', 'supplier')
        .gte('created_at', oneDayAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(2),
    ]);

  const results: DashboardNotification[] = [];

  if (newCustomerOrgs.data && newCustomerOrgs.data.length > 0) {
    (newCustomerOrgs.data as unknown as OrgRow[]).forEach(org => {
      const name = org.trade_name ?? org.legal_name;
      const location =
        org.city && org.country ? ` - ${org.city}, ${org.country}` : '';

      results.push({
        id: `new-customer-org-${org.id}`,
        type: 'activity',
        severity: 'info',
        title: 'Nouveau client B2B',
        message: `${name}${location}`,
        timestamp: new Date(org.created_at),
        actionUrl: `/contacts-organisations/customers/${org.id}`,
        actionLabel: 'Voir le client',
      });
    });
  }

  if (newIndividualCustomers.data && newIndividualCustomers.data.length > 0) {
    (newIndividualCustomers.data as unknown as IndividualCustomerRow[]).forEach(
      customer => {
        const name = `${customer.first_name} ${customer.last_name}`;
        const location =
          customer.city && customer.country
            ? ` - ${customer.city}, ${customer.country}`
            : '';

        results.push({
          id: `new-customer-ind-${customer.id}`,
          type: 'activity',
          severity: 'info',
          title: 'Nouveau client particulier',
          message: `${name}${location}`,
          timestamp: new Date(customer.created_at),
          actionUrl: `/contacts-organisations/customers/${customer.id}`,
          actionLabel: 'Voir le client',
        });
      }
    );
  }

  if (newSuppliers.data && newSuppliers.data.length > 0) {
    (newSuppliers.data as unknown as OrgRow[]).forEach(supplier => {
      const name = supplier.trade_name ?? supplier.legal_name;
      const location =
        supplier.city && supplier.country
          ? ` - ${supplier.city}, ${supplier.country}`
          : '';

      results.push({
        id: `new-supplier-${supplier.id}`,
        type: 'activity',
        severity: 'info',
        title: 'Nouveau fournisseur',
        message: `${name}${location}`,
        timestamp: new Date(supplier.created_at),
        actionUrl: `/contacts-organisations/suppliers/${supplier.id}`,
        actionLabel: 'Voir le fournisseur',
      });
    });
  }

  return results;
}

export async function fetchSampleNotifs(
  supabase: SupabaseClient,
  sevenDaysAgo: Date,
  twoHoursAgo: Date
): Promise<DashboardNotification[]> {
  const [urgentSamples, deliveredSamples] = await Promise.all([
    supabase
      .from('sample_orders')
      .select(
        `
        id, order_number, created_at, status,
        supplier:organisations!supplier_id(id, legal_name, trade_name),
        sample_order_items(id, product_id, products(id, name))
      `
      )
      .in('status', ['draft', 'submitted'])
      .lt('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true })
      .limit(3),
    supabase
      .from('sample_orders')
      .select(
        `
        id, order_number, created_at,
        supplier:organisations!supplier_id(id, legal_name, trade_name),
        sample_order_items(id, products(name))
      `
      )
      .eq('status', 'delivered')
      .gte('created_at', twoHoursAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(2),
  ]);

  const results: DashboardNotification[] = [];

  if (urgentSamples.data && urgentSamples.data.length > 0) {
    (urgentSamples.data as unknown as SampleOrder[]).forEach(sample => {
      const daysWaiting = Math.floor(
        (Date.now() - new Date(sample.created_at).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const supplierName =
        sample.supplier?.trade_name ??
        sample.supplier?.legal_name ??
        'Fournisseur';
      const mainProduct =
        sample.sample_order_items?.[0]?.products?.name ?? null;

      results.push({
        id: `sample-urgent-${sample.id}`,
        type: 'order',
        severity: daysWaiting > 14 ? 'critical' : 'warning',
        title: 'Echantillon en attente',
        message: `${sample.order_number} - ${supplierName}${mainProduct ? ` (${mainProduct})` : ''} - ${daysWaiting}j d'attente`,
        timestamp: new Date(sample.created_at),
        actionUrl: `/produits/sourcing?sample_id=${sample.id}`,
        actionLabel: "Voir l'echantillon",
      });
    });
  }

  if (deliveredSamples.data && deliveredSamples.data.length > 0) {
    (deliveredSamples.data as unknown as SampleOrder[]).forEach(sample => {
      const supplierName =
        sample.supplier?.trade_name ??
        sample.supplier?.legal_name ??
        'Fournisseur';
      const mainProduct =
        sample.sample_order_items?.[0]?.products?.name ?? null;

      results.push({
        id: `sample-delivered-${sample.id}`,
        type: 'activity',
        severity: 'info',
        title: 'Echantillon livre',
        message: `${sample.order_number} - ${supplierName}${mainProduct ? ` (${mainProduct})` : ''}`,
        timestamp: new Date(sample.created_at),
        actionUrl: `/produits/sourcing?sample_id=${sample.id}`,
        actionLabel: "Voir l'echantillon",
      });
    });
  }

  return results;
}
