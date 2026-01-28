/**
 * Server Action: Get Dashboard Metrics
 * Optimized version with caching and structured sections
 *
 * Architecture:
 * - Hero section: 4 essential KPIs (always visible)
 * - Sales section: LinkMe orders, commissions, revenue chart data
 * - Stock section: Products, out of stock, alerts
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
  };
  stock: {
    products: {
      total: number;
      new_month: number;
    };
    outOfStock: number;
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
      // Calculate date 30 days ago
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

      // Fetch all metrics in parallel (12 queries)
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

        // 3. LinkMe Pending Orders - draft seulement
        supabase
          .from('sales_orders')
          .select('id', { count: 'exact' })
          .eq('status', 'draft')
          .not('created_by_affiliate_id', 'is', null),

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

        // 12. Revenue Last 30 Days (delivered orders only)
        supabase
          .from('sales_orders')
          .select('total_ttc')
          .not('delivered_at', 'is', null)
          .gte('delivered_at', thirtyDaysAgoISO)
          .is('cancelled_at', null),
      ]);

      // Calculate new products/organisations in last 30 days
      const productsNewMonth =
        products.data?.filter(
          p => p.created_at && new Date(p.created_at) > thirtyDaysAgo
        ).length || 0;

      const organisationsNewMonth =
        organisations.data?.filter(
          o => o.created_at && new Date(o.created_at) > thirtyDaysAgo
        ).length || 0;

      // Calculate revenue 30 days (sum of delivered orders)
      const revenueSum =
        revenue30Days.data?.reduce(
          (sum, order) => sum + (order.total_ttc || 0),
          0
        ) || 0;

      // Format stock alerts
      const stockAlertsFormatted = (alertsDetails.data || [])
        .filter(alert => alert.product_id && alert.product_name)
        .map(alert => ({
          product_id: alert.product_id!,
          product_name: alert.product_name!,
          severity: alert.severity || 'critical',
          min_stock: alert.min_stock || 0,
          stock_real: alert.stock_real || 0,
        }));

      // Format recent orders
      const recentOrdersFormatted = (recentOrders.data || [])
        .filter(order => order.id && order.order_number)
        .map(order => ({
          id: order.id,
          order_number: order.order_number,
          created_at: order.created_at,
          total_ttc: order.total_ttc || 0,
          customer_type: order.customer_type || 'organization',
          status: order.status,
        }));

      return {
        // NEW: Structured sections
        hero: {
          ordersPending: ordersPending.count || 0,
          stockAlerts: alertsStock.count || 0,
          revenue30Days: revenueSum,
          consultations: consultations.count || 0,
        },
        sales: {
          ordersLinkme: ordersLinkme.count || 0,
          commissions: commissions.count || 0,
        },
        stock: {
          products: {
            total: products.count || 0,
            new_month: productsNewMonth,
          },
          outOfStock: outOfStock.count || 0,
          alerts: stockAlertsFormatted,
        },
        finance: {
          revenue30Days: revenueSum,
        },
        activity: {
          recentOrders: recentOrdersFormatted,
        },

        // LEGACY: Backward compatibility
        kpis: {
          alertsStock: alertsStock.count || 0,
          ordersPending: ordersPending.count || 0,
          ordersLinkme: ordersLinkme.count || 0,
          products: {
            total: products.count || 0,
            new_month: productsNewMonth,
          },
          consultations: consultations.count || 0,
          customers: customers.count || 0,
          organisations: {
            total: organisations.count || 0,
            new_month: organisationsNewMonth,
          },
          commissions: commissions.count || 0,
          outOfStock: outOfStock.count || 0,
        },
        widgets: {
          stockAlerts: stockAlertsFormatted,
          recentOrders: recentOrdersFormatted,
        },
      };
    } catch (error) {
      console.error('[getDashboardMetrics] Error fetching metrics:', error);

      // Return default values on error (graceful degradation)
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
        },
        stock: {
          products: {
            total: 0,
            new_month: 0,
          },
          outOfStock: 0,
          alerts: [],
        },
        finance: {
          revenue30Days: 0,
        },
        activity: {
          recentOrders: [],
        },
        kpis: {
          alertsStock: 0,
          ordersPending: 0,
          ordersLinkme: 0,
          products: {
            total: 0,
            new_month: 0,
          },
          consultations: 0,
          customers: 0,
          organisations: {
            total: 0,
            new_month: 0,
          },
          commissions: 0,
          outOfStock: 0,
        },
        widgets: {
          stockAlerts: [],
          recentOrders: [],
        },
      };
    }
  }
);
