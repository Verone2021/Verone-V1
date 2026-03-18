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

    const { data: orders, error } = await supabase
      .from('site_orders')
      .select('id, customer_email, customer_name, updated_at')
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
      const row = order as {
        id: string;
        customer_email: string;
        customer_name: string;
      };
      try {
        await fetch(`${siteUrl}/api/emails/review-request`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: row.customer_email,
            customerName: row.customer_name,
            orderId: row.id,
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
