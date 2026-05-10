/**
 * sync-meta-image-insights — Edge Function (Supabase)
 *
 * Pull les Meta Insights API pour chaque post publie sur Instagram
 * (via media_asset_publications), match vers media_assets, upsert dans
 * media_asset_analytics.
 *
 * Trigger : pg_cron quotidien 04:00 UTC ou /functions/v1/sync-meta-image-insights.
 *
 * Variables d environnement :
 *   - META_ACCESS_TOKEN : System User VeroneCatalog (deja configure)
 *   - META_FACEBOOK_PAGE_ID : ID de la Page Facebook Verone (default 461826940345802)
 *   - SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (auto-injectes par Supabase)
 *
 * Pre-requis pour que ca marche en prod :
 *   1. Le System User VeroneCatalog doit avoir acces a la Page Facebook
 *      Verone (461826940345802) — a assigner dans Business Manager >
 *      System Users > VeroneCatalog > Elements affectes > Ajouter Page.
 *   2. Le token doit avoir les scopes : pages_read_engagement +
 *      instagram_basic + instagram_manage_insights (a regenerer dans
 *      Business Manager > System Users > Generer un token, sinon le
 *      token actuel a uniquement catalog_management + business_management).
 *
 * Pipeline :
 *   1. Decouverte IG_USER_ID au runtime via Graph API depuis page_id +
 *      access_token (pas besoin d'env var supplementaire)
 *   2. GET /{ig_user_id}/media?fields=id,permalink,timestamp&limit=100
 *   3. Match permalink IG <-> media_asset_publications.external_url
 *   4. Pour chaque match : GET /{media_id}/insights pour pull
 *      impressions, reach, saved, total_interactions
 *   5. Upsert dans media_asset_analytics avec channel_code='meta',
 *      period_date=CURRENT_DATE
 */

// @ts-expect-error: Deno runtime
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
// @ts-expect-error: Deno runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

// @ts-expect-error: Deno globals
const env = (k: string, fallback?: string) => Deno.env.get(k) ?? fallback;

const META_GRAPH_VERSION = env('META_GRAPH_API_VERSION', 'v22.0')!;
const META_ACCESS_TOKEN = env('META_ACCESS_TOKEN');
const META_FACEBOOK_PAGE_ID = env('META_FACEBOOK_PAGE_ID', '461826940345802')!;
const SUPABASE_URL = env('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = env('SUPABASE_SERVICE_ROLE_KEY');

interface IgMediaItem {
  id: string;
  permalink: string;
  timestamp: string;
}

interface SyncResult {
  ok: boolean;
  ig_user_id: string | null;
  posts_fetched: number;
  posts_matched: number;
  upserted: number;
  errors: string[];
}

async function fetchIgUserId(): Promise<string | null> {
  const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${META_FACEBOOK_PAGE_ID}?fields=instagram_business_account&access_token=${META_ACCESS_TOKEN}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    instagram_business_account?: { id?: string };
  };
  return data.instagram_business_account?.id ?? null;
}

async function fetchRecentMedia(igUserId: string): Promise<IgMediaItem[]> {
  const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${igUserId}/media?fields=id,permalink,timestamp&limit=100&access_token=${META_ACCESS_TOKEN}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = (await res.json()) as { data?: IgMediaItem[] };
  return data.data ?? [];
}

async function fetchMediaInsights(
  mediaId: string
): Promise<Record<string, number>> {
  const metrics = 'impressions,reach,saved,total_interactions';
  const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${mediaId}/insights?metric=${metrics}&access_token=${META_ACCESS_TOKEN}`;
  const res = await fetch(url);
  if (!res.ok) return {};
  const data = (await res.json()) as {
    data?: Array<{ name: string; values?: Array<{ value: number }> }>;
  };
  const insights: Record<string, number> = {};
  for (const entry of data.data ?? []) {
    insights[entry.name] = entry.values?.[0]?.value ?? 0;
  }
  return insights;
}

serve(async (req: Request): Promise<Response> => {
  void req; // accepted but unused — endpoint runs identical logic for any method
  const result: SyncResult = {
    ok: true,
    ig_user_id: null,
    posts_fetched: 0,
    posts_matched: 0,
    upserted: 0,
    errors: [],
  };

  if (!META_ACCESS_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    result.ok = false;
    result.errors.push(
      'Missing env vars: META_ACCESS_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY'
    );
    return jsonResponse(result, 500);
  }

  // 1. Discover IG_USER_ID
  const igUserId = await fetchIgUserId();
  if (!igUserId) {
    result.ok = false;
    result.errors.push(
      `Cannot discover instagram_business_account from page ${META_FACEBOOK_PAGE_ID}. Check token scopes (pages_read_engagement + instagram_basic) and Page assignment to System User.`
    );
    return jsonResponse(result, 500);
  }
  result.ig_user_id = igUserId;

  // 2. Fetch recent IG posts
  const posts = await fetchRecentMedia(igUserId);
  result.posts_fetched = posts.length;
  if (posts.length === 0) {
    return jsonResponse(result);
  }

  // 3. Init Supabase client (service role)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // 4. Load active media_asset_publications on Meta channels
  const { data: publications, error: pubError } = await supabase
    .from('media_asset_publications')
    .select('id, asset_id, external_url')
    .in('channel', ['meta', 'instagram'])
    .is('unpublished_at', null)
    .not('external_url', 'is', null);

  if (pubError) {
    result.ok = false;
    result.errors.push(`Supabase pub fetch error: ${pubError.message}`);
    return jsonResponse(result, 500);
  }

  // 5. Match permalink -> publication
  const permalinkToPost = new Map<string, IgMediaItem>();
  for (const post of posts) {
    permalinkToPost.set(normalizePermalink(post.permalink), post);
  }

  const matches: Array<{ assetId: string; mediaId: string }> = [];
  for (const pub of publications ?? []) {
    if (!pub.external_url) continue;
    const matched = permalinkToPost.get(normalizePermalink(pub.external_url));
    if (matched) {
      matches.push({ assetId: pub.asset_id, mediaId: matched.id });
    }
  }
  result.posts_matched = matches.length;

  // 6. For each match: pull insights + upsert
  const today = new Date().toISOString().slice(0, 10);
  for (const { assetId, mediaId } of matches) {
    try {
      const insights = await fetchMediaInsights(mediaId);
      const { error: upsertError } = await supabase
        .from('media_asset_analytics')
        .upsert(
          {
            asset_id: assetId,
            channel_code: 'meta',
            period_date: today,
            impressions: insights.impressions ?? 0,
            clicks: insights.total_interactions ?? 0,
            saves: insights.saved ?? 0,
            conversions: 0,
          },
          { onConflict: 'asset_id,channel_code,period_date' }
        );
      if (upsertError) {
        result.errors.push(
          `Upsert failed for asset ${assetId}: ${upsertError.message}`
        );
      } else {
        result.upserted += 1;
      }
    } catch (err) {
      result.errors.push(
        `Insights fetch failed for media ${mediaId}: ${
          err instanceof Error ? err.message : 'unknown'
        }`
      );
    }
  }

  return jsonResponse(result);
});

function normalizePermalink(url: string): string {
  // Strip protocol, trailing slash, query string
  return url
    .replace(/^https?:\/\//, '')
    .replace(/\?.*$/, '')
    .replace(/\/+$/, '')
    .toLowerCase();
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
