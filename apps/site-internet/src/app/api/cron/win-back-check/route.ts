import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

/**
 * Cron: Send win-back emails to users inactive 60+ days
 * Schedule: weekly on Mondays at 10am
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001';

  try {
    const sixtyDaysAgo = new Date(
      Date.now() - 60 * 24 * 60 * 60 * 1000
    ).toISOString();

    const SITE_CHANNEL_ID = '0c2639e9-df80-41fa-84d0-9da96a128f7f';

    // Find customers who last ordered 60+ days ago (sales_orders replaces site_orders)
    const { data: oldOrders, error } = await supabase
      .from('sales_orders')
      .select(
        'id, individual_customer_id, created_at, individual_customers(email, first_name, last_name)'
      )
      .eq('channel_id', SITE_CHANNEL_ID)
      .lt('created_at', sixtyDaysAgo)
      .neq('status', 'cancelled')
      .neq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      console.error('[Win-Back Cron] Query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Deduplicate by email and exclude those who ordered recently
    const { data: recentOrders } = await supabase
      .from('sales_orders')
      .select('individual_customers(email)')
      .eq('channel_id', SITE_CHANNEL_ID)
      .gte('created_at', sixtyDaysAgo)
      .neq('status', 'cancelled')
      .neq('status', 'draft')
      .limit(1000);

    const recentEmails = new Set(
      (recentOrders ?? [])
        .map(o => {
          const rawCust = (o as Record<string, unknown>).individual_customers;
          const cust: unknown = Array.isArray(rawCust) ? rawCust[0] : rawCust;
          return (
            (cust as { email: string | null } | null)?.email?.toLowerCase() ??
            ''
          );
        })
        .filter(Boolean)
    );

    const eligibleMap = new Map<
      string,
      { email: string; name: string; lastOrder: string }
    >();

    for (const order of oldOrders ?? []) {
      const rawCust = (order as Record<string, unknown>).individual_customers;
      const cust: unknown = Array.isArray(rawCust) ? rawCust[0] : rawCust;
      const typedCust = cust as {
        email: string | null;
        first_name: string | null;
        last_name: string | null;
      } | null;
      const email = typedCust?.email?.toLowerCase();
      if (!email || recentEmails.has(email) || eligibleMap.has(email)) continue;
      eligibleMap.set(email, {
        email,
        name:
          `${typedCust?.first_name ?? ''} ${typedCust?.last_name ?? ''}`.trim() ||
          'Client',
        lastOrder: (order as { created_at: string }).created_at,
      });
    }

    let sent = 0;
    for (const customer of eligibleMap.values()) {
      const daysSince = Math.floor(
        (Date.now() - new Date(customer.lastOrder).getTime()) /
          (24 * 60 * 60 * 1000)
      );

      try {
        await fetch(`${siteUrl}/api/emails/win-back`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: customer.email,
            customerName: customer.name,
            daysSinceLastOrder: daysSince,
          }),
        });
        sent++;
      } catch (emailErr) {
        console.error('[Win-Back Cron] Email failed:', emailErr);
      }
    }

    return NextResponse.json({
      sent,
      eligible: eligibleMap.size,
      excluded: recentEmails.size,
    });
  } catch (error) {
    console.error('[Win-Back Cron] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
