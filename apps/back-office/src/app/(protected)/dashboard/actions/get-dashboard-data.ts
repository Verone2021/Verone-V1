/**
 * Server Action: Get Dashboard Data
 * Fetches all dashboard metrics in parallel
 */

'use server';

import { createServerClient } from '@verone/utils/supabase/server';

export async function getDashboardData() {
  const supabase = await createServerClient();

  // Fetch all data in parallel
  const [organisations, orders, contacts] = await Promise.all([
    // Organisations
    supabase
      .from('organisations')
      .select('id, created_at, is_active', { count: 'exact' }),

    // Orders
    supabase.from('sales_orders').select('id, delivered_at, cancelled_at', { count: 'exact' }),

    // Contacts
    supabase.from('contacts').select('id, created_at', { count: 'exact' }),
  ]);

  // Calculate date 30 days ago
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  return {
    organisations: {
      total: organisations.count || 0,
      new_month:
        organisations.data?.filter(
          (o) => o.created_at && new Date(o.created_at) > thirtyDaysAgo
        ).length || 0,
      active:
        organisations.data?.filter((o) => o.is_active === true).length || 0,
    },
    orders: {
      total: orders.count || 0,
      in_progress:
        orders.data?.filter((o) => !o.delivered_at && !o.cancelled_at).length || 0,
      delivered:
        orders.data?.filter((o) => o.delivered_at !== null).length || 0,
    },
    contacts: {
      total: contacts.count || 0,
      new_month:
        contacts.data?.filter((c) => c.created_at && new Date(c.created_at) > thirtyDaysAgo)
          .length || 0,
    },
  };
}
