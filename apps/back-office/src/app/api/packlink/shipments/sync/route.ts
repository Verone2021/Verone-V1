/**
 * API Route: Sync Packlink shipments with DB
 * POST /api/packlink/shipments/sync
 *
 * For a given sales_order_id, iterate over all DB rows with
 * packlink_status='a_payer' and packlink_shipment_id NOT NULL. For each:
 *
 *  1. GET /v1/shipments/{ref} on Packlink.
 *  2. If Packlink returns 404 → DELETE the DB row (shipment was removed
 *     from Packlink PRO web interface). The trigger
 *     `handle_shipment_deletion` early-returns for packlink_status
 *     'a_payer', so no stock side-effect.
 *  3. If Packlink returns the shipment with state in PAID_STATES (the user
 *     paid on the Packlink PRO web interface), update the DB row with
 *     packlink_status='paye', tracking_number, tracking_url, and label_url.
 *     Triggers the `confirm_packlink_shipment_stock` cascade.
 *
 * Why we need this: Packlink does not always emit the
 * `shipment.carrier.success` webhook reliably (and the callback URL may
 * not have been registered at the time of the original payment). Without
 * this on-demand sync, a shipment paid on Packlink stays visible in the
 * back-office as a phantom "à payer" row with no tracking and no label.
 */

import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { getPacklinkClient } from '@verone/common/lib/packlink/client';

const SyncSchema = z.object({
  sales_order_id: z.string().uuid(),
});

// Packlink shipment states that indicate the shipment has been paid and is
// no longer in the "à payer" inbox. As soon as we observe one of these,
// the DB row should flip to packlink_status='paye'.
const PAID_STATES = [
  'READY_TO_PRINT',
  'READY_FOR_COLLECTION',
  'IN_TRANSIT',
  'DELIVERED',
];

interface PacklinkShipmentDetailsExt {
  state?: string;
  tracking_url?: string;
  packages?: Array<{ carrier_tracking_number?: string }>;
}

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
      return NextResponse.json({ deleted: [], synced: [], checked: 0 });
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
      return NextResponse.json({ deleted: [], synced: [], checked: 0 });
    }

    const deleted: string[] = [];
    const synced: string[] = [];

    for (const row of candidates) {
      let detailsRaw: unknown;
      try {
        detailsRaw = await client.getShipment(row.packlink_shipment_id);
      } catch (err) {
        const message = err instanceof Error ? err.message : '';
        if (!/404/.test(message)) {
          console.error(
            '[Packlink Sync] Unexpected error for',
            row.packlink_shipment_id,
            err
          );
          continue;
        }

        // 404 → shipment was deleted on Packlink PRO. Drop the DB row.
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
        continue;
      }

      // Shipment exists on Packlink. Inspect state to see if it has been paid.
      const details = detailsRaw as PacklinkShipmentDetailsExt;
      if (!details.state || !PAID_STATES.includes(details.state)) {
        continue;
      }

      const trackingNumber =
        details.packages?.[0]?.carrier_tracking_number ?? null;

      let labelUrl: string | null = null;
      try {
        const labels = await client.getLabels(row.packlink_shipment_id);
        labelUrl = labels[0] ?? null;
      } catch (labelErr) {
        // Labels may not be ready yet — keep going, we'll pick them up next
        // sync.
        console.warn(
          '[Packlink Sync] Labels not ready yet for',
          row.packlink_shipment_id,
          labelErr instanceof Error ? labelErr.message : labelErr
        );
      }

      const updateFields: Record<string, unknown> = {
        packlink_status: 'paye',
        updated_at: new Date().toISOString(),
      };
      if (trackingNumber) updateFields.tracking_number = trackingNumber;
      if (details.tracking_url)
        updateFields.tracking_url = details.tracking_url;
      if (labelUrl) {
        updateFields.label_url = labelUrl;
        updateFields.packlink_label_url = labelUrl;
      }

      const { error: updateError } = await supabase
        .from('sales_order_shipments')
        .update(updateFields)
        .eq('id', row.id);

      if (updateError) {
        console.error(
          '[Packlink Sync] DB update failed for',
          row.id,
          updateError
        );
        continue;
      }

      synced.push(row.packlink_shipment_id);
      console.warn(
        '[Packlink Sync] Synced paid shipment from Packlink:',
        row.packlink_shipment_id,
        details.state
      );
    }

    return NextResponse.json({
      deleted,
      synced,
      checked: candidates.length,
    });
  } catch (error) {
    console.error('[Packlink Sync] Error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
