/**
 * API Route: Cancel a Packlink draft shipment
 * POST /api/packlink/shipment/[ref]/cancel
 *
 * Used by StepError recovery when DB save succeeded on Packlink but failed locally.
 * Deletes the draft on Packlink PRO so the slot is freed.
 */

import { NextResponse } from 'next/server';

import { createServerClient } from '@verone/utils/supabase/server';
import { getPacklinkClient } from '@verone/common/lib/packlink/client';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ ref: string }> }
) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { ref } = await params;

    if (!ref) {
      return NextResponse.json(
        { error: 'Référence manquante' },
        { status: 400 }
      );
    }

    const client = getPacklinkClient();
    await client.deleteShipment(ref);

    return NextResponse.json({ success: true, ref });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Annulation échouée';
    console.error('[Packlink Cancel] Failed:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
