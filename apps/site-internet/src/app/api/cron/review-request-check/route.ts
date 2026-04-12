import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

/**
 * Cron: Send review request emails 7 days after delivery
 * Schedule: daily at 10am
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
    // Find orders delivered 7 days ago that haven't had review email sent
    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();
    const eightDaysAgo = new Date(
      Date.now() - 8 * 24 * 60 * 60 * 1000
    ).toISOString();

    const SITE_CHANNEL_ID = '0c2639e9-df80-41fa-84d0-9da96a128f7f';

    // Query sales_orders (site_orders was dropped and migrated)
    const { data: orders, error } = await supabase
      .from('sales_orders')
      .select(
        'id, individual_customer_id, updated_at, individual_customers(email, first_name, last_name)'
      )
      .eq('channel_id', SITE_CHANNEL_ID)
      .eq('status', 'delivered')
      .gte('updated_at', eightDaysAgo)
      .lte('updated_at', sevenDaysAgo)
      .limit(50);

    if (error) {
      console.error('[Review Request Cron] Query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let sent = 0;
    for (const order of orders ?? []) {
      // Supabase returns joined relations as arrays
      const rawCust = (order as Record<string, unknown>).individual_customers;
      const cust: unknown = Array.isArray(rawCust) ? rawCust[0] : rawCust;
      const typedCust = cust as {
        email: string | null;
        first_name: string | null;
        last_name: string | null;
      } | null;
      const customerEmail = typedCust?.email;
      if (!customerEmail) continue;
      try {
        await fetch(`${siteUrl}/api/emails/review-request`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: customerEmail,
            customerName:
              `${typedCust?.first_name ?? ''} ${typedCust?.last_name ?? ''}`.trim() ||
              'Client',
            orderId: (order as { id: string }).id,
          }),
        });
        sent++;
      } catch (emailErr) {
        console.error('[Review Request Cron] Email failed:', emailErr);
      }
    }

    return NextResponse.json({ sent, total: (orders ?? []).length });
  } catch (error) {
    console.error('[Review Request Cron] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
