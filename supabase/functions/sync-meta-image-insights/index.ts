/**
 * sync-meta-image-insights — Edge Function (Supabase)
 *
 * Pull les Meta Insights API pour chaque media publie sur Instagram
 * (via media_asset_publications), match vers media_assets, upsert dans
 * media_asset_analytics.
 *
 * Trigger : pg_cron quotidien 04:00 UTC ou via /functions/v1/sync-meta-image-insights.
 *
 * Auth Meta : long-lived Page Access Token + System User token.
 *   - META_GRAPH_API_VERSION (default v22.0)
 *   - META_IG_USER_ID (compte Instagram Business)
 *   - META_PAGE_ACCESS_TOKEN
 *
 * STATUT : SQUELETTE — la logique de pull complete est a finaliser.
 *
 * Etapes attendues :
 *   1. Lire media_asset_publications WHERE channel='meta'
 *      AND unpublished_at IS NULL
 *   2. Pour chaque publication, extraire le media_id Instagram depuis
 *      external_url (format https://www.instagram.com/p/{shortcode}/) ou
 *      stocker un media_id_meta colonne dediee a la publication
 *   3. Appeler GET /v22.0/{media-id}/insights?metric=impressions,reach,
 *      engagement,saves
 *   4. Upsert dans media_asset_analytics (asset_id, channel_code='meta',
 *      period_date=CURRENT_DATE, impressions, clicks=0, saves, conversions=0)
 *
 * Pour aller plus loin : ajouter Meta Marketing API insights par
 * adcreative_id pour avoir les conversions reelles attribuees.
 */

// @ts-expect-error: Deno runtime — types Supabase Edge Functions
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
    todo: 'Implement Meta Insights API pull. See file header for the 4 expected steps.',
  };

  return new Response(JSON.stringify({ ...result, method: req.method }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
});
