/**
 * Server Action: Get Dashboard Data
 * Fetches all dashboard metrics in parallel
 */

'use server';

import { createClient } from '@/lib/supabase-server';

export async function getDashboardData() {
  const supabase = await createClient();

  // Fetch all data in parallel
  const [organisations, orders, contacts, channels] = await Promise.all([
    // Organisations
    supabase
      .from('organisations')
      .select('id, created_at, status', { count: 'exact' }),

    // Orders
    supabase.from('sales_orders').select('id, status', { count: 'exact' }),

    // Contacts
    supabase.from('contacts').select('id, created_at', { count: 'exact' }),

    // Channels (for percentage calculation)
    supabase.from('sales_orders').select('channel'),
  ]);

  // Calculate date 30 days ago
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  return {
    organisations: {
      total: organisations.count || 0,
      new_month:
        organisations.data?.filter(
          (o) => new Date(o.created_at) > thirtyDaysAgo
        ).length || 0,
      active:
        organisations.data?.filter((o) => o.status === 'active').length || 0,
    },
    orders: {
      total: orders.count || 0,
      in_progress:
        orders.data?.filter((o) =>
          ['draft', 'validated'].includes(o.status)
        ).length || 0,
      delivered:
        orders.data?.filter((o) => o.status === 'delivered').length || 0,
    },
    contacts: {
      total: contacts.count || 0,
      new_month:
        contacts.data?.filter((c) => new Date(c.created_at) > thirtyDaysAgo)
          .length || 0,
    },
    channels: {
      linkme: calculatePercentage(channels.data, 'linkme'),
      direct: calculatePercentage(channels.data, 'direct'),
    },
  };
}

function calculatePercentage(
  data: Array<{ channel: string }> | null,
  channel: string
): number {
  if (!data?.length) return 0;
  const count = data.filter((d) => d.channel === channel).length;
  return Math.round((count / data.length) * 100);
}
