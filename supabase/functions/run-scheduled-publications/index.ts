/**
 * run-scheduled-publications — Edge Function (Supabase)
 *
 * Trigger : pg_cron toutes les 5 minutes (cf. migration bo_mkt_pub_auto_001_cron_jobs).
 *
 * Logique :
 *   1. SELECT scheduled_publications WHERE status='pending' AND scheduled_at <= now() LIMIT 50
 *   2. UPDATE atomique status='publishing' (anti-race via WHERE status='pending')
 *   3. Dispatch par channel_code :
 *      - meta / instagram : POST /{ig_user_id}/media + /media_publish (Graph API)
 *      - pinterest        : status='failed' (compte business pas encore configure)
 *      - site_internet    : trace dans media_asset_publications + status='published'
 *      - autres           : status='failed' avec message clair
 *   4. En cas d erreur recuperable : retry si retry_count < 3, sinon failed.
 *
 * Variables d environnement :
 *   - META_ACCESS_TOKEN          : System User VeroneCatalog (scopes IG)
 *   - META_FACEBOOK_PAGE_ID      : default 461826940345802
 *   - SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (auto-injectes)
 */

// @ts-expect-error: Deno runtime — types Supabase Edge Functions
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
// @ts-expect-error: Deno runtime — esm.sh resolver
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

// @ts-expect-error: Deno globals
const env = (k: string, fallback?: string) => Deno.env.get(k) ?? fallback;

const META_GRAPH_VERSION = env('META_GRAPH_API_VERSION', 'v22.0')!;
const META_ACCESS_TOKEN = env('META_ACCESS_TOKEN');
const META_FACEBOOK_PAGE_ID = env('META_FACEBOOK_PAGE_ID', '461826940345802')!;
const SUPABASE_URL = env('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = env('SUPABASE_SERVICE_ROLE_KEY');
const MAX_RETRIES = 3;
const PICKUP_LIMIT = 50;

interface ScheduledPub {
  id: string;
  asset_id: string;
  channel_code: string;
  caption: string | null;
  hashtags: string[] | null;
  retry_count: number;
}

interface RunResult {
  ok: boolean;
  picked: number;
  published: number;
  failed: number;
  retried: number;
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

async function publishImageToInstagram(
  igUserId: string,
  imageUrl: string,
  caption: string
): Promise<{ permalink: string | null }> {
  // 1. Create container
  const containerUrl = `https://graph.facebook.com/${META_GRAPH_VERSION}/${igUserId}/media`;
  const containerParams = new URLSearchParams({
    image_url: imageUrl,
    caption,
    access_token: META_ACCESS_TOKEN!,
  });
  const containerRes = await fetch(
    `${containerUrl}?${containerParams.toString()}`,
    { method: 'POST' }
  );
  if (!containerRes.ok) {
    const errBody = await containerRes.text();
    throw new Error(
      `IG container create failed (${containerRes.status}): ${errBody}`
    );
  }
  const containerData = (await containerRes.json()) as { id?: string };
  const containerId = containerData.id;
  if (!containerId) {
    throw new Error('IG container create returned no id');
  }

  // 2. Publish container
  const publishUrl = `https://graph.facebook.com/${META_GRAPH_VERSION}/${igUserId}/media_publish`;
  const publishParams = new URLSearchParams({
    creation_id: containerId,
    access_token: META_ACCESS_TOKEN!,
  });
  const publishRes = await fetch(`${publishUrl}?${publishParams.toString()}`, {
    method: 'POST',
  });
  if (!publishRes.ok) {
    const errBody = await publishRes.text();
    throw new Error(`IG publish failed (${publishRes.status}): ${errBody}`);
  }
  const publishData = (await publishRes.json()) as { id?: string };
  const mediaId = publishData.id;
  if (!mediaId) {
    throw new Error('IG publish returned no media id');
  }

  // 3. Fetch permalink (best-effort, do not fail if missing)
  try {
    const permalinkUrl = `https://graph.facebook.com/${META_GRAPH_VERSION}/${mediaId}?fields=permalink&access_token=${META_ACCESS_TOKEN}`;
    const permalinkRes = await fetch(permalinkUrl);
    if (permalinkRes.ok) {
      const permalinkData = (await permalinkRes.json()) as {
        permalink?: string;
      };
      return { permalink: permalinkData.permalink ?? null };
    }
  } catch {
    // best-effort, swallow
  }
  return { permalink: null };
}

function buildCaption(
  caption: string | null,
  hashtags: string[] | null
): string {
  const parts: string[] = [];
  if (caption && caption.trim().length > 0) parts.push(caption.trim());
  if (hashtags && hashtags.length > 0) {
    const tags = hashtags.map(h => (h.startsWith('#') ? h : `#${h}`)).join(' ');
    parts.push(tags);
  }
  return parts.join('\n\n');
}

serve(async (req: Request): Promise<Response> => {
  void req; // accepted but unused — runs identically for any method
  const result: RunResult = {
    ok: true,
    picked: 0,
    published: 0,
    failed: 0,
    retried: 0,
    errors: [],
  };

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    result.ok = false;
    result.errors.push('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
    return jsonResponse(result, 500);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // 1. Find pending publications due now
  const nowIso = new Date().toISOString();
  const { data: pendingRows, error: selectError } = await supabase
    .from('scheduled_publications')
    .select('id')
    .eq('status', 'pending')
    .lte('scheduled_at', nowIso)
    .order('scheduled_at', { ascending: true })
    .limit(PICKUP_LIMIT);

  if (selectError) {
    result.ok = false;
    result.errors.push(`select pending: ${selectError.message}`);
    return jsonResponse(result, 500);
  }
  if (!pendingRows || pendingRows.length === 0) {
    return jsonResponse(result);
  }

  // 2. Atomic pickup : flip pending -> publishing only on rows still pending.
  // Anti-race : a concurrent invocation that already flipped them won't see them.
  const ids = pendingRows.map((r: { id: string }) => r.id);
  const { data: picked, error: pickError } = await supabase
    .from('scheduled_publications')
    .update({ status: 'publishing', updated_at: nowIso })
    .in('id', ids)
    .eq('status', 'pending')
    .select('id, asset_id, channel_code, caption, hashtags, retry_count');

  if (pickError) {
    result.ok = false;
    result.errors.push(`pickup: ${pickError.message}`);
    return jsonResponse(result, 500);
  }

  result.picked = picked?.length ?? 0;
  if (!picked || picked.length === 0) {
    return jsonResponse(result);
  }

  // 3. Resolve IG user ID once if any meta/instagram pubs in batch
  const needsIg = picked.some(
    (p: ScheduledPub) =>
      p.channel_code === 'meta' || p.channel_code === 'instagram'
  );
  let igUserId: string | null = null;
  if (needsIg) {
    if (!META_ACCESS_TOKEN) {
      // Fail-fast for the whole IG batch; non-IG channels still process below
    } else {
      igUserId = await fetchIgUserId();
    }
  }

  // 4. Process each picked publication
  for (const pub of picked as ScheduledPub[]) {
    try {
      await processOne(supabase, pub, igUserId, result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown error';
      result.errors.push(`pub ${pub.id}: ${msg}`);
      const outcome = await markFailedOrRetry(supabase, pub, msg);
      if (outcome.retried) result.retried += 1;
      else result.failed += 1;
    }
  }

  return jsonResponse(result);
});

async function processOne(
  supabase: ReturnType<typeof createClient>,
  pub: ScheduledPub,
  igUserId: string | null,
  result: RunResult
): Promise<void> {
  switch (pub.channel_code) {
    case 'meta':
    case 'instagram': {
      if (!META_ACCESS_TOKEN) {
        const out = await markFailedOrRetry(
          supabase,
          pub,
          'META_ACCESS_TOKEN missing on Edge Function — cannot publish to Instagram'
        );
        if (out.retried) result.retried += 1;
        else result.failed += 1;
        return;
      }
      if (!igUserId) {
        const out = await markFailedOrRetry(
          supabase,
          pub,
          'Cannot resolve instagram_business_account — check token scopes (instagram_basic + pages_read_engagement) and Page assignment'
        );
        if (out.retried) result.retried += 1;
        else result.failed += 1;
        return;
      }

      const { data: asset, error: assetError } = await supabase
        .from('media_assets')
        .select('public_url')
        .eq('id', pub.asset_id)
        .single();

      if (assetError) {
        throw new Error(`asset lookup failed: ${assetError.message}`);
      }
      if (!asset?.public_url) {
        const out = await markFailedOrRetry(
          supabase,
          pub,
          'Asset has no public_url — cannot publish to Instagram',
          { noRetry: true }
        );
        if (out.retried) result.retried += 1;
        else result.failed += 1;
        return;
      }

      const caption = buildCaption(pub.caption, pub.hashtags);
      const { permalink } = await publishImageToInstagram(
        igUserId,
        asset.public_url,
        caption
      );

      const publishedAt = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('scheduled_publications')
        .update({
          status: 'published',
          published_at: publishedAt,
          external_url: permalink,
          error_message: null,
          updated_at: publishedAt,
        })
        .eq('id', pub.id);

      if (updateError) {
        throw new Error(`update success failed: ${updateError.message}`);
      }

      // Trace into media_asset_publications so sync-meta-image-insights can match later
      const { error: traceError } = await supabase
        .from('media_asset_publications')
        .insert({
          asset_id: pub.asset_id,
          channel: 'meta',
          external_url: permalink,
          published_at: publishedAt,
        });
      if (traceError) {
        // log but don't fail the publication
        result.errors.push(
          `trace media_asset_publications failed for ${pub.id}: ${traceError.message}`
        );
      }

      result.published += 1;
      return;
    }

    case 'pinterest': {
      const out = await markFailedOrRetry(
        supabase,
        pub,
        'Pinterest API not configured yet — publish manually via Pinterest app',
        { noRetry: true }
      );
      if (out.retried) result.retried += 1;
      else result.failed += 1;
      return;
    }

    case 'site_internet':
    case 'site_verone': {
      const publishedAt = new Date().toISOString();
      const { error: traceError } = await supabase
        .from('media_asset_publications')
        .insert({
          asset_id: pub.asset_id,
          channel: 'site_verone',
          published_at: publishedAt,
        });
      if (traceError) {
        throw new Error(`trace site_verone failed: ${traceError.message}`);
      }
      const { error: updateError } = await supabase
        .from('scheduled_publications')
        .update({
          status: 'published',
          published_at: publishedAt,
          error_message: null,
          updated_at: publishedAt,
        })
        .eq('id', pub.id);
      if (updateError) {
        throw new Error(
          `update site_verone success failed: ${updateError.message}`
        );
      }
      result.published += 1;
      return;
    }

    default: {
      const out = await markFailedOrRetry(
        supabase,
        pub,
        `Unsupported channel_code: ${pub.channel_code}`,
        { noRetry: true }
      );
      if (out.retried) result.retried += 1;
      else result.failed += 1;
      return;
    }
  }
}

async function markFailedOrRetry(
  supabase: ReturnType<typeof createClient>,
  pub: ScheduledPub,
  message: string,
  opts: { noRetry?: boolean } = {}
): Promise<{ retried: boolean }> {
  const newRetryCount = pub.retry_count + 1;
  const shouldRetry = !opts.noRetry && newRetryCount < MAX_RETRIES;
  await supabase
    .from('scheduled_publications')
    .update({
      status: shouldRetry ? 'pending' : 'failed',
      retry_count: newRetryCount,
      error_message: message,
      updated_at: new Date().toISOString(),
    })
    .eq('id', pub.id);
  return { retried: shouldRetry };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
