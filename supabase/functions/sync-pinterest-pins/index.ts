/**
 * sync-pinterest-pins — Edge Function (Supabase)
 *
 * Trigger : pg_cron quotidien 04:30 UTC.
 *
 * Logique :
 *   1. SELECT pinterest_pin_syncs WHERE sync_status='synced'
 *      AND pinterest_pin_id IS NOT NULL
 *   2. Pour chaque row, GET /v5/pins/{pin_id}/analytics
 *   3. UPSERT impressions, saves, pin_clicks, outbound_clicks
 *      (incremental sur les 7 derniers jours, Pinterest API ToS interdit
 *      stockage > 90j donc on ne backfille pas)
 *   4. Insert dans media_asset_analytics et channel_stats_snapshots pour
 *      alimenter Top images + page /marketing/performance
 *
 * STATUT : SQUELETTE — a finaliser apres reception credentials Pinterest.
 */

// @ts-expect-error: Deno runtime
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

interface SyncResult {
  ok: boolean;
  fetched: number;
  upserted: number;
  errors: string[];
  todo: string;
}

serve(async (req: Request): Promise<Response> => {
  const result: SyncResult = {
    ok: true,
    fetched: 0,
    upserted: 0,
    errors: [],
    todo: 'Pull /v5/pins/{id}/analytics + upsert pinterest_pin_syncs + media_asset_analytics + channel_stats_snapshots.',
  };

  return new Response(JSON.stringify({ ...result, method: req.method }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
});
