/**
 * API Route: Sync Packlink shipments with DB
 * POST /api/packlink/shipments/sync
 *
 * For a given sales_order_id, iterate over all DB rows with
 * packlink_status='a_payer' and packlink_shipment_id NOT NULL. For each,
 * GET /v1/shipments/{ref} on Packlink. If Packlink returns 404 (shipment
 * deleted via the Packlink PRO web interface), DELETE the DB row. The
 * trigger `handle_shipment_deletion` early-returns for packlink_status
 * 'a_payer', so no stock side-effect.
 *
 * Why: Packlink does not emit any webhook when a shipment is deleted
 * (only carrier.success / label.ready / tracking.update / delivered).
 * Without this sync, a shipment removed from Packlink PRO stays visible
 * in the back-office as a phantom "a_payer" row.
 */

import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { getPacklinkClient } from '@verone/common/lib/packlink/client';

const SyncSchema = z.object({
  sales_order_id: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = SyncSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'sales_order_id requis' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ deleted: [], checked: 0 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const client = getPacklinkClient();

    const { data: rows, error } = await supabase
      .from('sales_order_shipments')
      .select('id, packlink_shipment_id')
      .eq('sales_order_id', parsed.data.sales_order_id)
      .eq('packlink_status', 'a_payer')
      .not('packlink_shipment_id', 'is', null);

    if (error) {
      console.error('[Packlink Sync] DB select failed:', error);
      return NextResponse.json({ error: 'DB select failed' }, { status: 500 });
    }

    const candidates = (rows ?? []) as Array<{
      id: string;
      packlink_shipment_id: string;
    }>;
    if (candidates.length === 0) {
      return NextResponse.json({ deleted: [], checked: 0 });
    }

    const deleted: string[] = [];

    for (const row of candidates) {
      try {
        await client.getShipment(row.packlink_shipment_id);
      } catch (err) {
        const message = err instanceof Error ? err.message : '';
        // The client throws a generic Error with "Packlink API error 404"
        // when the shipment no longer exists.
        if (!/404/.test(message)) {
          console.error(
            '[Packlink Sync] Unexpected error for',
            row.packlink_shipment_id,
            err
          );
          continue;
        }

        const { error: delError } = await supabase
          .from('sales_order_shipments')
          .delete()
          .eq('id', row.id)
          .eq('packlink_status', 'a_payer');

        if (delError) {
          console.error(
            '[Packlink Sync] DB delete failed for',
            row.id,
            delError
          );
          continue;
        }

        deleted.push(row.packlink_shipment_id);
        console.warn(
          '[Packlink Sync] Cleaned phantom shipment (deleted on Packlink):',
          row.packlink_shipment_id
        );
      }
    }

    return NextResponse.json({ deleted, checked: candidates.length });
  } catch (error) {
    console.error('[Packlink Sync] Error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
