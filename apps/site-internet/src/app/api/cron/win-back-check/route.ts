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

    // Find customers who last ordered 60+ days ago
    const { data: oldOrders, error } = await supabase
      .from('site_orders')
      .select('customer_email, customer_name, created_at')
      .lt('created_at', sixtyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      console.error('[Win-Back Cron] Query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Deduplicate by email and exclude those who ordered recently
    const { data: recentOrders } = await supabase
      .from('site_orders')
      .select('customer_email')
      .gte('created_at', sixtyDaysAgo)
      .limit(1000);

    const recentEmails = new Set(
      (recentOrders ?? []).map(o => (o.customer_email as string).toLowerCase())
    );

    const eligibleMap = new Map<
      string,
      { email: string; name: string; lastOrder: string }
    >();

    for (const order of oldOrders ?? []) {
      const email = (order.customer_email as string).toLowerCase();
      if (!recentEmails.has(email) && !eligibleMap.has(email)) {
        eligibleMap.set(email, {
          email: order.customer_email as string,
          name: order.customer_name as string,
          lastOrder: order.created_at as string,
        });
      }
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
