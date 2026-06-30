/**
 * API Route: POST /api/finance/sync-qonto-attachments
 *
 * Rapatrie en local les pièces jointes présentes sur Qonto mais pas encore
 * téléchargées (local_pdf_path IS NULL). Idempotent, traitement en série.
 *
 * Body (JSON, optionnel) : { year?: number, transactionIds?: string[] }
 * Réponse : { processed, downloaded, failed, errors }
 *
 * La logique est partagée avec le cron nocturne via _lib/sync-attachments.ts
 *
 * [BO-COMPTA-001]
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { createServerClient } from '@verone/utils/supabase/server';

import { syncQontoAttachments } from './_lib/sync-attachments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SyncBodySchema = z.object({
  year: z.number().int().min(2020).max(2100).optional(),
  transactionIds: z.array(z.string().uuid()).max(500).optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    let body: unknown;
    try {
      const text = await request.text();
      body = text.length > 0 ? JSON.parse(text) : {};
    } catch {
      return NextResponse.json(
        { error: 'Body JSON invalide' },
        { status: 400 }
      );
    }

    const parsed = SyncBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Paramètres invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await syncQontoAttachments(supabase, parsed.data);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error('[sync-qonto-attachments] Unexpected error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
