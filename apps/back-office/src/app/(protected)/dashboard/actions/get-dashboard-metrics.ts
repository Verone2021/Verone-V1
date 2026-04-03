/**
 * Server Action: Get Dashboard Metrics
 * Optimized version with caching and structured sections
 *
 * Architecture:
 * - Hero section: 4 essential KPIs (always visible)
 * - Sales section: LinkMe orders, commissions, revenue by channel, top products, margin
 * - Stock section: Products, out of stock, stock value, movements, alerts
 * - Finance section: Revenue 30 days
 * - Activity section: Recent orders
 *
 * Performance:
 * - Cached with React cache() for request deduplication
 * - Parallel queries (Promise.all)
 * - Structured return by section
 *
 * @see CLAUDE.md - Dashboard section
 */

'use server';

import { cache } from 'react';
import { createServerClient } from '@verone/utils/supabase/server';

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
    products: {
      total: number;
      new_month: number;
    };
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
  finance: {
    revenue30Days: number;
  };
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
  // Legacy KPIs (for backward compatibility)
  kpis: {
    alertsStock: number;
    ordersPending: number;
    ordersLinkme: number;
    products: {
      total: number;
      new_month: number;
    };
    consultations: number;
    customers: number;
    organisations: {
      total: number;
      new_month: number;
    };
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

/**
 * Fetch dashboard metrics with React cache
 * Deduplicates requests within the same render cycle
 */
export const getDashboardMetrics = cache(
  async (): Promise<DashboardMetrics> => {
    const supabase = await createServerClient();

    try {
      // Calculate date ranges
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();
      const yearAgoISO = new Date(
        now.getTime() - 365 * 24 * 60 * 60 * 1000
      ).toISOString();

      // Fetch all metrics in parallel (16 queries)
      const [
        alertsStock,
        ordersPending,
        ordersLinkme,
        products,
        consultations,
        customers,
        organisations,
        commissions,
        outOfStock,
        alertsDetails,
        recentOrders,
        revenue30Days,
        ordersByChannel,
        topProductItems,
        stockSummary,
        stockMovements30d,
      ] = await Promise.all([
        // 1. Stock Alerts Critical
        supabase
          .from('stock_alerts_unified_view')
          .select('id', { count: 'exact' })
          .eq('severity', 'critical'),

        // 2. Pending Orders (all channels) - draft + validated non livrées
        supabase
          .from('sales_orders')
          .select('id', { count: 'exact' })
          .in('status', ['draft', 'validated', 'partially_shipped'])
          .is('delivered_at', null)
          .is('cancelled_at', null),

        // 3. LinkMe Active Orders
        supabase
          .from('sales_orders')
          .select('id', { count: 'exact' })
          .in('status', [
            'draft',
            'pending_approval',
            'validated',
            'partially_shipped',
          ])
          .not('created_by_affiliate_id', 'is', null)
          .is('cancelled_at', null),

        // 4. Total Products + New 30 days
        supabase
          .from('products')
          .select('id, created_at', { count: 'exact' })
          .is('deleted_at', null),

        // 5. Active Consultations
        supabase
          .from('client_consultations')
          .select('id', { count: 'exact' })
          .in('status', ['pending', 'in_progress']),

        // 6. Active Customers
        supabase
          .from('individual_customers')
          .select('id', { count: 'exact' })
          .eq('is_active', true),

        // 7. Organisations + New 30 days
        supabase
          .from('organisations')
          .select('id, created_at', { count: 'exact' })
          .is('deleted_at', null),

        // 8. Pending Commissions
        supabase
          .from('linkme_commissions')
          .select('id', { count: 'exact' })
          .eq('status', 'pending'),

        // 9. Out of Stock Products
        supabase
          .from('products')
          .select('id', { count: 'exact' })
          .eq('current_stock_real', 0)
          .is('deleted_at', null),

        // 10. Top 5 Stock Alerts Details
        supabase
          .from('stock_alerts_unified_view')
          .select('product_id, product_name, severity, min_stock, stock_real')
          .eq('severity', 'critical')
          .order('stock_real', { ascending: true })
          .limit(5),

        // 11. Last 10 Recent Orders
        supabase
          .from('sales_orders')
          .select(
            'id, order_number, created_at, total_ttc, customer_type, status'
          )
          .order('created_at', { ascending: false })
          .limit(10),

        // 12. Revenue Last 30 Days
        supabase
          .from('sales_orders')
          .select('total_ttc')
          .eq('status', 'validated')
          .gte('created_at', thirtyDaysAgoISO)
          .is('cancelled_at', null),

        // 13. Revenue by Channel (30 days)
        supabase
          .from('sales_orders')
          .select('total_ttc, total_ht, channel_id, sales_channels(name)')
          .in('status', ['shipped', 'delivered', 'validated'])
          .gte('created_at', thirtyDaysAgoISO)
          .is('cancelled_at', null),

        // 14. Top Products (365 days — client filters by period)
        supabase
          .from('sales_order_items')
          .select(
            'product_id, quantity, total_ht, unit_price_ht, sales_orders!inner(created_at, cancelled_at, status), products!inner(id, name, sku, cost_price, product_images(public_url, is_primary))'
          )
          .gte('sales_orders.created_at', yearAgoISO)
          .is('sales_orders.cancelled_at', null)
          .neq('sales_orders.status', 'cancelled'),

        // 15. Stock summary (active products)
        supabase
          .from('products')
          .select('stock_real, cost_price_avg')
          .eq('product_status', 'active')
          .is('archived_at', null),

        // 16. Stock movements count (30 days)
        supabase
          .from('stock_movements')
          .select('id', { count: 'exact' })
          .gte('performed_at', thirtyDaysAgoISO),
      ]);

      // Calculate new products/organisations in last 30 days
      const productsNewMonth =
        products.data?.filter(
          p => p.created_at && new Date(p.created_at) > thirtyDaysAgo
        ).length ?? 0;

      const organisationsNewMonth =
        organisations.data?.filter(
          o => o.created_at && new Date(o.created_at) > thirtyDaysAgo
        ).length ?? 0;

      // Calculate revenue 30 days (sum of delivered orders)
      const revenueSum =
        revenue30Days.data?.reduce(
          (sum, order) => sum + (order.total_ttc ?? 0),
          0
        ) ?? 0;

      // Calculate revenue by channel
      const channelMap = new Map<
        string,
        { orders: number; ttc: number; ht: number }
      >();
      for (const order of ordersByChannel.data ?? []) {
        const channelName =
          (order.sales_channels as { name: string } | null)?.name ?? 'Direct';
        const existing = channelMap.get(channelName) ?? {
          orders: 0,
          ttc: 0,
          ht: 0,
        };
        existing.orders += 1;
        existing.ttc += order.total_ttc ?? 0;
        existing.ht += order.total_ht ?? 0;
        channelMap.set(channelName, existing);
      }
      const revenueByChannel = Array.from(channelMap.entries())
        .map(([channel, data]) => ({
          channel,
          orders: data.orders,
          revenueTtc: Math.round(data.ttc * 100) / 100,
          revenueHt: Math.round(data.ht * 100) / 100,
        }))
        .sort((a, b) => b.revenueTtc - a.revenueTtc);

      // Calculate top products by revenue
      const productMap = new Map<
        string,
        {
          id: string;
          name: string;
          sku: string;
          imageUrl: string | null;
          orders: Set<string>;
          quantity: number;
          revenueHt: number;
          costPrice: number | null;
          unitPriceHt: number;
          latestDate: string;
        }
      >();
      for (const item of topProductItems.data ?? []) {
        const product = item.products as {
          id: string;
          name: string;
          sku: string;
          cost_price: number | null;
          product_images: Array<{
            public_url: string;
            is_primary: boolean;
          }> | null;
        };
        const orderData = item.sales_orders as {
          created_at: string;
          cancelled_at: string | null;
          status: string;
        };
        if (!product?.id) continue;
        const primaryImage =
          product.product_images?.find(img => img.is_primary)?.public_url ??
          null;
        const existing = productMap.get(product.id) ?? {
          id: product.id,
          name: product.name,
          sku: product.sku ?? '',
          imageUrl: primaryImage,
          orders: new Set<string>(),
          quantity: 0,
          revenueHt: 0,
          costPrice: product.cost_price,
          unitPriceHt: 0,
          latestDate: orderData.created_at,
        };
        existing.orders.add(item.product_id);
        existing.quantity += item.quantity ?? 0;
        existing.revenueHt += item.total_ht ?? 0;
        existing.unitPriceHt = item.unit_price_ht ?? existing.unitPriceHt;
        if (!existing.imageUrl && primaryImage)
          existing.imageUrl = primaryImage;
        if (orderData.created_at > existing.latestDate)
          existing.latestDate = orderData.created_at;
        productMap.set(product.id, existing);
      }
      const topProducts = Array.from(productMap.values())
        .map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          imageUrl: p.imageUrl,
          orders: p.orders.size,
          quantity: p.quantity,
          revenueHt: Math.round(p.revenueHt * 100) / 100,
          marginPct:
            p.costPrice && p.unitPriceHt > 0
              ? Math.round(
                  ((p.unitPriceHt - p.costPrice) / p.unitPriceHt) * 1000
                ) / 10
              : null,
          orderDate: p.latestDate,
        }))
        .sort((a, b) => b.revenueHt - a.revenueHt);

      // Calculate average margin across top products (30d)
      const topProducts30d = topProducts.filter(
        p => p.orderDate >= thirtyDaysAgoISO
      );
      const productsWithMargin = topProducts30d.filter(
        p => p.marginPct !== null
      );
      const avgMarginPct =
        productsWithMargin.length > 0
          ? Math.round(
              (productsWithMargin.reduce(
                (sum, p) => sum + (p.marginPct ?? 0),
                0
              ) /
                productsWithMargin.length) *
                10
            ) / 10
          : null;

      // Calculate stock totals
      const stockData = stockSummary.data ?? [];
      const totalStockUnits = stockData.reduce(
        (sum, p) => sum + (p.stock_real ?? 0),
        0
      );
      const stockValue =
        Math.round(
          stockData.reduce(
            (sum, p) => sum + (p.stock_real ?? 0) * (p.cost_price_avg ?? 0),
            0
          ) * 100
        ) / 100;

      // Format stock alerts
      const stockAlertsFormatted = (alertsDetails.data ?? [])
        .filter(alert => alert.product_id && alert.product_name)
        .map(alert => ({
          product_id: alert.product_id!,
          product_name: alert.product_name!,
          severity: alert.severity ?? 'critical',
          min_stock: alert.min_stock ?? 0,
          stock_real: alert.stock_real ?? 0,
        }));

      // Format recent orders
      const recentOrdersFormatted = (recentOrders.data ?? [])
        .filter(order => order.id && order.order_number)
        .map(order => ({
          id: order.id,
          order_number: order.order_number,
          created_at: order.created_at,
          total_ttc: order.total_ttc ?? 0,
          customer_type: order.customer_type ?? 'organization',
          status: order.status,
        }));

      return {
        hero: {
          ordersPending: ordersPending.count ?? 0,
          stockAlerts: alertsStock.count ?? 0,
          revenue30Days: revenueSum,
          consultations: consultations.count ?? 0,
        },
        sales: {
          ordersLinkme: ordersLinkme.count ?? 0,
          commissions: commissions.count ?? 0,
          revenueByChannel,
          topProducts,
          avgMarginPct,
        },
        stock: {
          products: {
            total: products.count ?? 0,
            new_month: productsNewMonth,
          },
          outOfStock: outOfStock.count ?? 0,
          totalUnits: totalStockUnits,
          stockValue,
          movements30d: stockMovements30d.count ?? 0,
          alerts: stockAlertsFormatted,
        },
        finance: {
          revenue30Days: revenueSum,
        },
        activity: {
          recentOrders: recentOrdersFormatted,
        },
        kpis: {
          alertsStock: alertsStock.count ?? 0,
          ordersPending: ordersPending.count ?? 0,
          ordersLinkme: ordersLinkme.count ?? 0,
          products: { total: products.count ?? 0, new_month: productsNewMonth },
          consultations: consultations.count ?? 0,
          customers: customers.count ?? 0,
          organisations: {
            total: organisations.count ?? 0,
            new_month: organisationsNewMonth,
          },
          commissions: commissions.count ?? 0,
          outOfStock: outOfStock.count ?? 0,
        },
        widgets: {
          stockAlerts: stockAlertsFormatted,
          recentOrders: recentOrdersFormatted,
        },
      };
    } catch (error) {
      console.error('[getDashboardMetrics] Error fetching metrics:', error);

      return {
        hero: {
          ordersPending: 0,
          stockAlerts: 0,
          revenue30Days: 0,
          consultations: 0,
        },
        sales: {
          ordersLinkme: 0,
          commissions: 0,
          revenueByChannel: [],
          topProducts: [],
          avgMarginPct: null,
        },
        stock: {
          products: { total: 0, new_month: 0 },
          outOfStock: 0,
          totalUnits: 0,
          stockValue: 0,
          movements30d: 0,
          alerts: [],
        },
        finance: { revenue30Days: 0 },
        activity: { recentOrders: [] },
        kpis: {
          alertsStock: 0,
          ordersPending: 0,
          ordersLinkme: 0,
          products: { total: 0, new_month: 0 },
          consultations: 0,
          customers: 0,
          organisations: { total: 0, new_month: 0 },
          commissions: 0,
          outOfStock: 0,
        },
        widgets: { stockAlerts: [], recentOrders: [] },
      };
    }
  }
);
