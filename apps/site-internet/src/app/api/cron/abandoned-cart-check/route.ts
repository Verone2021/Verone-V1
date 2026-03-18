import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

/**
 * Cron endpoint: checks for abandoned carts (>2h old, with email, not yet emailed)
 * Called hourly by Vercel Cron
 *
 * Security: Protected by CRON_SECRET header
 */
export async function GET(request: Request) {
  // Verify cron secret
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
    // Find abandoned carts: updated > 2h ago, have email, not yet emailed
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const { data: abandonedCarts, error: queryError } = await supabase
      .from('shopping_carts')
      .select('session_id, customer_email, user_id')
      .lt('updated_at', twoHoursAgo)
      .not('customer_email', 'is', null)
      .is('abandoned_cart_email_sent_at', null)
      .limit(100);

    if (queryError) {
      console.error('[Abandoned Cart Cron] Query error:', queryError);
      return NextResponse.json({ error: queryError.message }, { status: 500 });
    }

    if (!abandonedCarts || abandonedCarts.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No abandoned carts' });
    }

    // Group by email (one email per customer, not per cart item)
    const emailGroups = new Map<string, { sessionId: string; email: string }>();
    for (const cart of abandonedCarts) {
      const email = cart.customer_email as string;
      if (!emailGroups.has(email)) {
        emailGroups.set(email, {
          sessionId: cart.session_id as string,
          email,
        });
      }
    }

    let sentCount = 0;

    for (const { sessionId, email } of emailGroups.values()) {
      // Count items in this session's cart
      const { count } = await supabase
        .from('shopping_carts')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId);

      // Send abandoned cart email
      try {
        const firstName = email.split('@')[0] ?? 'Client';
        await fetch(`${siteUrl}/api/emails/abandoned-cart`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            firstName,
            cartItemsCount: count ?? 1,
            cartTotal: 0, // We don't have price info in shopping_carts
          }),
        });

        // Mark as emailed to prevent duplicates
        await supabase
          .from('shopping_carts')
          .update({ abandoned_cart_email_sent_at: new Date().toISOString() })
          .eq('session_id', sessionId);

        sentCount++;
      } catch (emailError) {
        console.error(
          `[Abandoned Cart Cron] Email to ${email} failed:`,
          emailError
        );
      }
    }

    return NextResponse.json({
      sent: sentCount,
      total: emailGroups.size,
    });
  } catch (error) {
    console.error('[Abandoned Cart Cron] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
