/**
 * run-scheduled-publications — Edge Function (Supabase)
 *
 * Trigger : pg_cron toutes les 5 minutes via cron.schedule.
 *
 * Logique :
 *   1. SELECT scheduled_publications WHERE status='pending'
 *      AND scheduled_at <= now()
 *      ORDER BY scheduled_at ASC LIMIT 50
 *   2. Pour chaque row : UPDATE status='publishing' (atomique)
 *   3. Selon channel_code :
 *      - meta : POST Instagram Graph API /{ig-user-id}/media + /media_publish
 *      - pinterest : POST /v5/pins
 *      - site_internet : INSERT dans une table interne / publication CMS
 *   4. UPDATE status='published', external_url=..., published_at=now()
 *      OU UPDATE status='failed', error_message=..., retry_count=retry_count+1
 *      (re-bascule en pending si retry_count < 3)
 *
 * STATUT : SQUELETTE — la logique de publication par canal est a finaliser
 * quand les credentials Meta IG / Pinterest sont disponibles. Voir
 * .claude/rules/agent-autonomy-external.md pour les credentials.
 *
 * Variables d'environnement attendues :
 *   - META_PAGE_ACCESS_TOKEN
 *   - META_IG_USER_ID
 *   - PINTEREST_ACCESS_TOKEN
 *   - PINTEREST_BOARD_ID
 */

// @ts-expect-error: Deno runtime — types Supabase Edge Functions
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

interface RunResult {
  ok: boolean;
  picked: number;
  published: number;
  failed: number;
  errors: string[];
  todo: string;
}

serve(async (req: Request): Promise<Response> => {
  const result: RunResult = {
    ok: true,
    picked: 0,
    published: 0,
    failed: 0,
    errors: [],
    todo: 'Implement per-channel publish logic (meta IG /media + /media_publish, pinterest /v5/pins, site_internet CMS).',
  };

  return new Response(JSON.stringify({ ...result, method: req.method }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
});
