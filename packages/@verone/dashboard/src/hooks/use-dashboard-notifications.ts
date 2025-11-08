/**
 * 🔔 Hook: Notifications Dashboard - Vérone
 *
 * Agrège les notifications et alertes critiques pour affichage
 * dans le dashboard : stocks bas, commandes urgentes, erreurs système.
 */

'use client';

import { useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

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
  commanderUrl?: string; // URL pour créer une commande fournisseur directement
  isRead?: boolean;
  read_at?: Date; // ✅ Timestamp marquage lu
}

interface UseDashboardNotificationsResult {
  notifications: DashboardNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
}

/**
 * Hook pour récupérer les notifications dashboard
 * Analyse plusieurs sources : stocks, commandes, logs activité
 */
export function useDashboardNotifications(
  limit = 10
): UseDashboardNotificationsResult {
  const [notifications, setNotifications] = useState<DashboardNotification[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const allNotifications: DashboardNotification[] = [];

      // 1. STOCKS BAS (stock_real < 10 ou stock_quantity < 10)
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

      if (lowStockProducts && lowStockProducts.length > 0) {
        lowStockProducts.forEach((product: any) => {
          const stock = product.stock_real ?? product.stock_quantity ?? 0;
          const category = product.subcategories?.name || 'Sans catégorie';
          const supplierName =
            product.supplier?.trade_name ||
            product.supplier?.legal_name ||
            null;

          // Message enrichi : Nom (Catégorie) - Stock - Fournisseur
          const message = `${product.name} (${category}) - ${stock} unités${supplierName ? ` - ${supplierName}` : ''}`;

          allNotifications.push({
            id: `stock-${product.id}`,
            type: 'stock',
            severity: stock < 5 ? 'critical' : 'warning',
            title: 'Stock bas',
            message,
            timestamp: new Date(),
            actionUrl: `/produits/catalogue/${product.id}`,
            actionLabel: 'Voir le produit',
            commanderUrl: product.supplier_id
              ? `/commandes/fournisseurs/create?product_id=${product.id}&supplier_id=${product.supplier_id}`
              : undefined,
          });
        });
      }

      // 2. COMMANDES URGENTES (draft > 3 jours pour sales et purchase)
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const [urgentSalesOrders, urgentPurchaseOrders] = await Promise.all([
        supabase
          .from('sales_orders')
          .select(
            `
            id, order_number, created_at, total_ttc, customer_type, customer_id,
            customer_org:organisations!customer_id(id, legal_name, trade_name, city, country),
            customer_ind:individual_customers!customer_id(id, first_name, last_name),
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

      // Sales orders urgentes
      if (urgentSalesOrders.data && urgentSalesOrders.data.length > 0) {
        urgentSalesOrders.data.forEach((order: any) => {
          const daysWaiting = Math.floor(
            (Date.now() - new Date(order.created_at).getTime()) /
              (1000 * 60 * 60 * 24)
          );

          // Nom client (polymorphique B2B/B2C)
          const customerName =
            order.customer_type === 'organization'
              ? order.customer_org?.trade_name ||
                order.customer_org?.legal_name ||
                'Client'
              : order.customer_ind
                ? `${order.customer_ind.first_name} ${order.customer_ind.last_name}`
                : 'Client';

          // Localisation (ville, pays si B2B)
          const location =
            order.customer_type === 'organization' &&
            order.customer_org?.city &&
            order.customer_org?.country
              ? ` (${order.customer_org.city}, ${order.customer_org.country})`
              : '';

          // Produit principal
          const mainProduct =
            order.sales_order_items?.[0]?.products?.name || null;

          // Message enrichi
          const message = `${order.order_number || 'Sans référence'} - ${customerName}${location}${mainProduct ? ` - ${mainProduct}` : ''} - ${daysWaiting}j d'attente`;

          allNotifications.push({
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

      // Purchase orders urgentes
      if (urgentPurchaseOrders.data && urgentPurchaseOrders.data.length > 0) {
        urgentPurchaseOrders.data.forEach((order: any) => {
          const daysWaiting = Math.floor(
            (Date.now() - new Date(order.created_at).getTime()) /
              (1000 * 60 * 60 * 24)
          );

          // Nom fournisseur
          const supplierName =
            order.supplier?.trade_name ||
            order.supplier?.legal_name ||
            'Fournisseur';

          // Localisation (ville, pays)
          const location =
            order.supplier?.city && order.supplier?.country
              ? ` (${order.supplier.city}, ${order.supplier.country})`
              : '';

          // Produit principal
          const mainProduct =
            order.purchase_order_items?.[0]?.products?.name || null;

          // Message enrichi
          const message = `${order.po_number || 'Sans référence'} - ${supplierName}${location}${mainProduct ? ` - ${mainProduct}` : ''} - ${daysWaiting}j d'attente`;

          allNotifications.push({
            id: `purchase-order-${order.id}`,
            type: 'order',
            severity: daysWaiting > 7 ? 'critical' : 'warning',
            title: 'Commande achat en attente',
            message,
            timestamp: new Date(order.created_at),
            actionUrl: `/commandes/fournisseurs?id=${order.id}`,
            actionLabel: 'Voir la commande',
          });
        });
      }

      // 3. ERREURS SYSTÈME RÉCENTES (logs avec severity error/critical dans les 24h)
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);

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

      if (errorLogs && errorLogs.length > 0) {
        errorLogs.forEach((log: any) => {
          // Nom utilisateur
          const userName =
            log.user_profile?.first_name && log.user_profile?.last_name
              ? `${log.user_profile.first_name} ${log.user_profile.last_name}`
              : null;

          // Message enrichi
          const actionFormatted = log.action.replace(/_/g, ' ');
          const message = userName
            ? `${actionFormatted} - Par: ${userName} (${log.user_profile?.role || 'User'})`
            : actionFormatted;

          allNotifications.push({
            id: `error-${log.id}`,
            type: 'system',
            severity: log.severity as NotificationSeverity,
            title: 'Erreur système',
            message,
            timestamp: new Date(log.created_at),
            actionUrl: `/admin/activite-utilisateurs?log=${log.id}`,
            actionLabel: 'Voir les détails',
          });
        });
      }

      // 4. ACTIVITÉ IMPORTANTE (nouvelles commandes dans les 2 dernières heures)
      const twoHoursAgo = new Date();
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

      const [recentSalesOrders, recentPurchaseOrders] = await Promise.all([
        supabase
          .from('sales_orders')
          .select(
            `
            id, order_number, created_at, customer_type,
            customer_org:organisations!customer_id(id, legal_name, trade_name),
            customer_ind:individual_customers!customer_id(id, first_name, last_name),
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

      // Nouvelles sales orders
      if (recentSalesOrders.data && recentSalesOrders.data.length > 0) {
        recentSalesOrders.data.forEach((order: any) => {
          // Nom client (polymorphique)
          const customerName =
            order.customer_type === 'organization'
              ? order.customer_org?.trade_name ||
                order.customer_org?.legal_name ||
                'Client'
              : order.customer_ind
                ? `${order.customer_ind.first_name} ${order.customer_ind.last_name}`
                : 'Client';

          // Produit principal
          const mainProduct =
            order.sales_order_items?.[0]?.products?.name || null;

          // Message enrichi
          const message = `${order.order_number || 'Sans référence'} - ${customerName}${mainProduct ? ` (${mainProduct})` : ''}`;

          allNotifications.push({
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

      // Nouvelles purchase orders
      if (recentPurchaseOrders.data && recentPurchaseOrders.data.length > 0) {
        recentPurchaseOrders.data.forEach((order: any) => {
          // Nom fournisseur
          const supplierName =
            order.supplier?.trade_name ||
            order.supplier?.legal_name ||
            'Fournisseur';

          // Produit principal
          const mainProduct =
            order.purchase_order_items?.[0]?.products?.name || null;

          // Message enrichi
          const message = `${order.po_number || 'Sans référence'} - ${supplierName}${mainProduct ? ` (${mainProduct})` : ''}`;

          allNotifications.push({
            id: `activity-purchase-${order.id}`,
            type: 'activity',
            severity: 'info',
            title: 'Nouvelle commande achat',
            message,
            timestamp: new Date(order.created_at),
            actionUrl: `/commandes/fournisseurs?id=${order.id}`,
            actionLabel: 'Voir la commande',
          });
        });
      }

      // 5. NOUVELLES ORGANISATIONS (clients B2B, B2C, fournisseurs dans les 24h)
      const [newCustomerOrgs, newIndividualCustomers, newSuppliers] =
        await Promise.all([
          // Clients B2B
          supabase
            .from('organisations')
            .select('id, legal_name, trade_name, city, country, created_at')
            .eq('type', 'customer')
            .gte('created_at', oneDayAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(2),
          // Clients B2C
          supabase
            .from('individual_customers')
            .select('id, first_name, last_name, city, country, created_at')
            .gte('created_at', oneDayAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(2),
          // Fournisseurs
          supabase
            .from('organisations')
            .select('id, legal_name, trade_name, city, country, created_at')
            .eq('type', 'supplier')
            .gte('created_at', oneDayAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(2),
        ]);

      // Clients B2B
      if (newCustomerOrgs.data && newCustomerOrgs.data.length > 0) {
        newCustomerOrgs.data.forEach((org: any) => {
          const name = org.trade_name || org.legal_name;
          const location =
            org.city && org.country ? ` - ${org.city}, ${org.country}` : '';

          allNotifications.push({
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

      // Clients B2C
      if (
        newIndividualCustomers.data &&
        newIndividualCustomers.data.length > 0
      ) {
        newIndividualCustomers.data.forEach((customer: any) => {
          const name = `${customer.first_name} ${customer.last_name}`;
          const location =
            customer.city && customer.country
              ? ` - ${customer.city}, ${customer.country}`
              : '';

          allNotifications.push({
            id: `new-customer-ind-${customer.id}`,
            type: 'activity',
            severity: 'info',
            title: 'Nouveau client particulier',
            message: `${name}${location}`,
            timestamp: new Date(customer.created_at),
            actionUrl: `/contacts-organisations/customers/${customer.id}`,
            actionLabel: 'Voir le client',
          });
        });
      }

      // Fournisseurs
      if (newSuppliers.data && newSuppliers.data.length > 0) {
        newSuppliers.data.forEach((supplier: any) => {
          const name = supplier.trade_name || supplier.legal_name;
          const location =
            supplier.city && supplier.country
              ? ` - ${supplier.city}, ${supplier.country}`
              : '';

          allNotifications.push({
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

      // 6. ÉCHANTILLONS (urgents >7 jours + livrés récemment)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [urgentSamples, deliveredSamples] = await Promise.all([
        // Échantillons en attente
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
        // Échantillons livrés récemment
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

      // Échantillons urgents
      if (urgentSamples.data && urgentSamples.data.length > 0) {
        urgentSamples.data.forEach((sample: any) => {
          const daysWaiting = Math.floor(
            (Date.now() - new Date(sample.created_at).getTime()) /
              (1000 * 60 * 60 * 24)
          );

          const supplierName =
            sample.supplier?.trade_name ||
            sample.supplier?.legal_name ||
            'Fournisseur';
          const mainProduct =
            sample.sample_order_items?.[0]?.products?.name || null;

          allNotifications.push({
            id: `sample-urgent-${sample.id}`,
            type: 'order',
            severity: daysWaiting > 14 ? 'critical' : 'warning',
            title: 'Échantillon en attente',
            message: `${sample.order_number} - ${supplierName}${mainProduct ? ` (${mainProduct})` : ''} - ${daysWaiting}j d'attente`,
            timestamp: new Date(sample.created_at),
            actionUrl: `/produits/sourcing?sample_id=${sample.id}`,
            actionLabel: "Voir l'échantillon",
          });
        });
      }

      // Échantillons livrés
      if (deliveredSamples.data && deliveredSamples.data.length > 0) {
        deliveredSamples.data.forEach((sample: any) => {
          const supplierName =
            sample.supplier?.trade_name ||
            sample.supplier?.legal_name ||
            'Fournisseur';
          const mainProduct =
            sample.sample_order_items?.[0]?.products?.name || null;

          allNotifications.push({
            id: `sample-delivered-${sample.id}`,
            type: 'activity',
            severity: 'info',
            title: 'Échantillon livré',
            message: `${sample.order_number} - ${supplierName}${mainProduct ? ` (${mainProduct})` : ''}`,
            timestamp: new Date(sample.created_at),
            actionUrl: `/produits/sourcing?sample_id=${sample.id}`,
            actionLabel: "Voir l'échantillon",
          });
        });
      }

      // Trier par timestamp décroissant et limiter
      allNotifications.sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      );
      const limited = allNotifications.slice(0, limit);

      // ✅ Charger l'état "lu" depuis localStorage
      if (typeof window !== 'undefined') {
        const storageKey = 'verone-dashboard-notifications-read';
        const existingReads = localStorage.getItem(storageKey);
        const readNotifications: Record<string, string> = existingReads
          ? JSON.parse(existingReads)
          : {};

        // Marquer notifications déjà lues
        limited.forEach(notif => {
          if (readNotifications[notif.id]) {
            notif.isRead = true;
            notif.read_at = new Date(readNotifications[notif.id]);
          }
        });
      }

      setNotifications(limited);
    } catch (err: any) {
      console.error('Erreur chargement notifications:', err);
      setError(err.message || 'Erreur lors du chargement des notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const now = new Date();

      // 1. Update optimiste local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, isRead: true, read_at: now } : notif
        )
      );

      // 2. Persist dans localStorage pour session persistante
      // (Les notifications dashboard sont des agrégations dynamiques,
      // pas des entités persistées en DB, donc localStorage est approprié)
      if (typeof window !== 'undefined') {
        const storageKey = 'verone-dashboard-notifications-read';
        const existingReads = localStorage.getItem(storageKey);
        const readNotifications: Record<string, string> = existingReads
          ? JSON.parse(existingReads)
          : {};

        readNotifications[id] = now.toISOString();
        localStorage.setItem(storageKey, JSON.stringify(readNotifications));
      }
    } catch (err) {
      console.error('Erreur markAsRead:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Rafraîchir les notifications toutes les 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [limit]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refresh: fetchNotifications,
    markAsRead,
  };
}
