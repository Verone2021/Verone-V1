/**
 * POST /api/channel-pricing/toggle-publication
 *
 * Toggle dédié pour publier/dépublier un produit sur un canal donné, sans
 * affecter le prix ni les autres champs de la ligne `channel_pricing`.
 *
 * Sémantique :
 *  - Si la ligne `channel_pricing` (product_id, channel_id, min_quantity=1)
 *    n'existe pas : INSERT avec `is_published_on_channel = is_published`,
 *    `is_active = true`, `min_quantity = 1`.
 *  - Si la ligne existe : UPDATE seul `is_published_on_channel`.
 *
 * Route séparée de `/api/channel-pricing/upsert` qui gère le prix avec
 * garde-fou minimum (sémantique différente : configuration vs publication).
 *
 * Voir : docs/scratchpad/dev-plan-BO-BRAND-003b.md décision D
 */

import { NextResponse } from 'next/server';

import { createServerClient } from '@verone/utils/supabase/server';
import { z } from 'zod';

const togglePublicationSchema = z.object({
  product_id: z.string().uuid(),
  channel_id: z.string().uuid(),
  is_published: z.boolean(),
});

interface TogglePublicationResponse {
  ok: boolean;
  channel_pricing_id?: string;
  error?: string;
}

export async function POST(
  request: Request
): Promise<NextResponse<TogglePublicationResponse>> {
  try {
    const body = togglePublicationSchema.safeParse(await request.json());

    if (!body.success) {
      return NextResponse.json(
        { ok: false, error: body.error.issues.map(i => i.message).join(' | ') },
        { status: 400 }
      );
    }

    const input = body.data;

    const supabase = await createServerClient();

    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: upserted, error: upsertError } = await supabase
      .from('channel_pricing')
      .upsert(
        {
          product_id: input.product_id,
          channel_id: input.channel_id,
          min_quantity: 1,
          is_published_on_channel: input.is_published,
        },
        { onConflict: 'product_id,channel_id,min_quantity' }
      )
      .select('id')
      .single();

    if (upsertError) {
      console.error(
        '[API] channel-pricing toggle-publication failed:',
        upsertError
      );
      return NextResponse.json(
        { ok: false, error: upsertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      channel_pricing_id: upserted.id,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
