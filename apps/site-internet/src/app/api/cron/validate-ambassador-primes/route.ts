/**
 * CRON: Validate ambassador primes after 30 days
 * GET /api/cron/validate-ambassador-primes
 *
 * Runs daily. Finds ambassador_attributions with status='pending'
 * where validation_date <= now(), and updates them to 'validated'.
 */

import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Config missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Find pending attributions past their validation date
    const now = new Date().toISOString();
    const { data: pendingAttributions, error: fetchError } = await supabase
      .from('ambassador_attributions')
      .select('id, ambassador_id, prime_amount')
      .eq('status', 'pending')
      .lte('validation_date', now);

    if (fetchError) {
      console.error('[Cron] Fetch pending attributions failed:', fetchError);
      return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
    }

    if (!pendingAttributions || pendingAttributions.length === 0) {
      return NextResponse.json({
        validated: 0,
        message: 'No pending primes to validate',
      });
    }

    // Validate each attribution
    let validatedCount = 0;
    for (const attr of pendingAttributions) {
      const { error: updateError } = await supabase
        .from('ambassador_attributions')
        .update({
          status: 'validated',
          validated_at: now,
        })
        .eq('id', attr.id);

      if (updateError) {
        console.error(
          `[Cron] Failed to validate attribution ${attr.id}:`,
          updateError
        );
      } else {
        validatedCount++;
      }
    }

    console.warn(
      `[Cron] Validated ${validatedCount}/${pendingAttributions.length} ambassador primes`
    );

    return NextResponse.json({
      validated: validatedCount,
      total: pendingAttributions.length,
      message: `${validatedCount} primes validees`,
    });
  } catch (error) {
    console.error('[Cron] Validate ambassador primes error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
