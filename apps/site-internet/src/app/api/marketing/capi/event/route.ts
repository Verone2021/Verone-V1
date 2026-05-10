/**
 * POST /api/marketing/capi/event
 *
 * Endpoint server-side qui reçoit un event du client (Pixel browser) et
 * le mirrore via Meta Conversions API. Le client passe `eventId` pour
 * que Meta dédoublonne côté serveur. Les match keys (fbp, fbc, IP, UA)
 * sont enrichis depuis la requête (cookies + headers).
 *
 * Body JSON attendu :
 *   {
 *     eventName: 'ViewContent' | 'AddToCart' | ...,
 *     eventId: string,
 *     eventSourceUrl?: string,
 *     customData?: { value, currency, content_ids, ... },
 *     userData?: { email, phone, external_id }  // optionnel, pour utilisateurs connus
 *   }
 *
 * Réponse 200 toujours (fire-and-forget côté client) — les erreurs Meta
 * sont loggées mais ne bloquent pas l'expérience utilisateur.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { sendMetaCapiEvent, type MetaCapiEventName } from '@/lib/meta-capi';

const EVENT_NAMES = [
  'PageView',
  'ViewContent',
  'AddToCart',
  'InitiateCheckout',
  'Purchase',
  'CompleteRegistration',
  'Lead',
] as const;

const RequestSchema = z.object({
  eventName: z.enum(EVENT_NAMES),
  eventId: z.string().min(1).max(128),
  eventSourceUrl: z.string().url().optional(),
  customData: z
    .object({
      currency: z.string().max(3).optional(),
      value: z.number().nonnegative().optional(),
      content_ids: z.array(z.string()).max(100).optional(),
      content_type: z.enum(['product', 'product_group']).optional(),
      content_name: z.string().max(200).optional(),
      content_category: z.string().max(200).optional(),
      num_items: z.number().int().nonnegative().optional(),
      order_id: z.string().max(64).optional(),
    })
    .optional(),
  userData: z
    .object({
      email: z.string().email().optional(),
      phone: z.string().max(32).optional(),
      external_id: z.string().max(128).optional(),
    })
    .optional(),
});

function getCookie(req: NextRequest, name: string): string | undefined {
  return req.cookies.get(name)?.value;
}

function getClientIp(req: NextRequest): string | undefined {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim();
  return req.headers.get('x-real-ip') ?? undefined;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON' },
      { status: 400 }
    );
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Invalid payload', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { eventName, eventId, eventSourceUrl, customData, userData } =
    parsed.data;

  const result = await sendMetaCapiEvent({
    eventName: eventName as MetaCapiEventName,
    eventId,
    eventSourceUrl: eventSourceUrl ?? req.headers.get('referer') ?? undefined,
    userData: {
      ...userData,
      fbp: getCookie(req, '_fbp'),
      fbc: getCookie(req, '_fbc'),
      client_ip_address: getClientIp(req),
      client_user_agent: req.headers.get('user-agent') ?? undefined,
    },
    customData,
    actionSource: 'website',
  });

  if (!result.ok) {
    console.error('[meta-capi/event] Meta Graph API error:', result.error, {
      status: result.status,
      body: result.body,
    });
  }

  // Toujours 200 côté client : fire-and-forget.
  return NextResponse.json({ ok: result.ok, status: result.status });
}
