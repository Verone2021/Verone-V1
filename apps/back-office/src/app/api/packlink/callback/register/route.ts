/**
 * API Route: POST /api/packlink/callback/register
 *
 * Enregistre l'URL de webhook côté Packlink (POST /v1/shipments/callback).
 * À appeler une fois après chaque déploiement qui change l'URL publique du
 * back-office. Packlink push ensuite les events `shipment.carrier.success`,
 * `shipment.label.ready`, `shipment.tracking.update`, `shipment.delivered` sur
 * /api/webhooks/packlink (déjà implémenté).
 *
 * Auth : utilisateur connecté côté back-office (admin staff). Pas de check de
 * rôle plus fin pour l'instant (la route ne lit pas de données sensibles, elle
 * écrit juste une URL chez Packlink).
 *
 * Usage :
 *   curl -X POST https://verone-backoffice.vercel.app/api/packlink/callback/register \
 *     -H "Cookie: <session-supabase>" \
 *     -H "Content-Type: application/json" \
 *     -d '{"url":"https://verone-backoffice.vercel.app/api/webhooks/packlink"}'
 *
 * Body :
 *   - url (optionnel) : URL complète à enregistrer. Si omis, on calcule
 *     l'URL depuis NEXT_PUBLIC_SITE_URL ou request.headers.origin.
 */

import { NextResponse } from 'next/server';

import { z } from 'zod';

import { getPacklinkClient } from '@verone/common/lib/packlink/client';
import { createServerClient } from '@verone/utils/supabase/server';

const RegisterSchema = z.object({
  url: z.string().url().optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: unknown = await request.json().catch(() => ({}));
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Calcul de l'URL par défaut depuis l'origin de la requête, fallback sur
    // l'env. En staging et prod, request.headers.origin renvoie l'URL du
    // déploiement Vercel courant.
    const origin =
      request.headers.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? '';
    const defaultUrl = origin ? `${origin}/api/webhooks/packlink` : null;
    const callbackUrl = parsed.data.url ?? defaultUrl;

    if (!callbackUrl) {
      return NextResponse.json(
        {
          error:
            'Aucune URL fournie. Passe `url` dans le body ou configure NEXT_PUBLIC_SITE_URL.',
        },
        { status: 400 }
      );
    }

    const client = getPacklinkClient();
    await client.registerCallback(callbackUrl);

    console.warn('[Packlink Callback] Webhook URL registered:', callbackUrl);

    return NextResponse.json({
      success: true,
      callbackUrl,
      registeredBy: authData.user.email ?? authData.user.id,
    });
  } catch (error) {
    console.error('[Packlink Callback Register] Error:', error);
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
