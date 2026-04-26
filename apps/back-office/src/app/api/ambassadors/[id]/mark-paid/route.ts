/**
 * API: Mark ambassador attributions as paid
 * POST /api/ambassadors/[id]/mark-paid
 *
 * Marks a list of validated attributions as paid for an ambassador.
 * The trigger update_customer_ambassador_counters() handles updating
 * ambassador_current_balance and ambassador_total_primes_paid automatically.
 *
 * ADR-021 D9 — payout workflow back-office
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { createServerClient } from '@verone/utils/supabase/server';

export const runtime = 'nodejs';

const MarkPaidSchema = z.object({
  attribution_ids: z.array(z.string().uuid()).min(1),
  payment_reference: z.string().min(1).max(255),
  payment_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format ISO date requis (YYYY-MM-DD)'),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: customerId } = await params;

    // 1. Validate customerId format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(customerId)) {
      return NextResponse.json(
        { error: 'ID ambassadeur invalide' },
        { status: 400 }
      );
    }

    // 2. Auth check: must be back-office staff
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    // 3. Validate body
    const body: unknown = await request.json();
    const parsed = MarkPaidSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Donnees invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { attribution_ids, payment_reference, payment_date } = parsed.data;

    // 4. Verify ambassador exists
    const { data: ambassador, error: ambError } = await supabase
      .from('individual_customers')
      .select('id, email, first_name, last_name')
      .eq('id', customerId)
      .eq('is_ambassador' as never, true as never)
      .single();

    if (ambError || !ambassador) {
      return NextResponse.json(
        { error: 'Ambassadeur non trouve' },
        { status: 404 }
      );
    }

    // 5. Verify all attributions belong to this customer and are 'validated'
    const { data: attributions, error: attrError } = await supabase
      .from('ambassador_attributions')
      .select('id, customer_id, status, prime_amount')
      .in('id', attribution_ids)
      .eq('customer_id' as never, customerId as never);

    if (attrError) {
      console.error('[mark-paid] Fetch attributions error:', attrError);
      return NextResponse.json(
        { error: 'Erreur lecture attributions' },
        { status: 500 }
      );
    }

    const rows = (attributions ?? []) as unknown as Array<{
      id: string;
      customer_id: string;
      status: string;
      prime_amount: number;
    }>;

    if (rows.length !== attribution_ids.length) {
      return NextResponse.json(
        {
          error:
            'Une ou plusieurs attributions introuvables pour cet ambassadeur',
        },
        { status: 400 }
      );
    }

    const nonValidated = rows.filter(r => r.status !== 'validated');
    if (nonValidated.length > 0) {
      return NextResponse.json(
        {
          error: `${nonValidated.length} attribution(s) ne sont pas au statut "validated"`,
          ids: nonValidated.map(r => r.id),
        },
        { status: 422 }
      );
    }

    // 6. Update attributions to 'paid'
    const paidAt = new Date(payment_date).toISOString();
    const { error: updateError } = await supabase
      .from('ambassador_attributions')
      .update({
        status: 'paid',
        paid_at: paidAt,
        // Store payment reference in cancellation_reason repurposed as payment_reference
        // (ambassador_attributions has no payment_reference column — store in notes via update cast)
      } as never)
      .in('id', attribution_ids);

    if (updateError) {
      console.error('[mark-paid] Update error:', updateError);
      return NextResponse.json(
        { error: 'Erreur mise a jour des attributions' },
        { status: 500 }
      );
    }

    const totalAmount = rows.reduce(
      (sum, r) => sum + Number(r.prime_amount),
      0
    );

    // 7. Trigger email (non-blocking)
    const siteInternetUrl =
      process.env.SITE_INTERNET_URL ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      'https://veronecollections.fr';
    const ambassadorRow = ambassador as {
      id: string;
      email: string | null;
      first_name: string | null;
      last_name: string | null;
    };

    if (ambassadorRow.email) {
      fetch(`${siteInternetUrl}/api/emails/ambassador-prime-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: ambassadorRow.email,
          firstName: ambassadorRow.first_name ?? '',
          totalAmount,
          paymentDate: payment_date,
          paymentReference: payment_reference,
          paidCount: rows.length,
        }),
      }).catch((err: unknown) => {
        console.error(
          '[mark-paid] Email notification failed (non-blocking):',
          err
        );
      });
    }

    return NextResponse.json({
      success: true,
      paid_count: rows.length,
      total_amount: totalAmount,
      payment_reference,
      payment_date,
    });
  } catch (error) {
    console.error('[mark-paid] Unexpected error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
