/**
 * API Route: POST /api/emails/preview-shipping-tracking
 *
 * Génère le HTML d'aperçu de l'email de tracking, identique à celui qui
 * sera envoyé via /api/emails/send-shipping-tracking. La même logique
 * d'enrichissement Packlink est appliquée (récup tracking_url + date
 * de pickup réelle), pour que l'utilisateur voie EXACTEMENT ce que le
 * client recevra avant de confirmer l'envoi.
 *
 * Aucun email n'est envoyé. La DB est néanmoins mise à jour si Packlink
 * fournit une date de pickup ou un tracking_url manquant — c'est cohérent
 * avec le flux d'envoi et permet à l'UI fiche commande de refléter la
 * vérité immédiatement.
 *
 * Protected: requires authenticated session.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';

import type { Database } from '@verone/types';

import {
  fetchShipmentsInfo,
  getAdminClient,
} from '../_shared/shipping-tracking-data';
import { buildTrackingEmailHtml } from '../_shared/shipping-tracking-template';

const PreviewSchema = z
  .object({
    salesOrderId: z.string().uuid(),
    shipmentId: z.string().uuid().optional(),
    shipmentIds: z.array(z.string().uuid()).max(10).optional(),
    customMessage: z.string().max(5000).default(''),
  })
  .refine(
    data => Boolean(data.shipmentId) || (data.shipmentIds?.length ?? 0) > 0,
    { message: 'Provide at least shipmentId or shipmentIds' }
  );

export async function POST(request: NextRequest) {
  const authClient = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // Read-only in Route Handler
        },
      },
    }
  );

  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError ?? !user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body: unknown = await request.json();
    const parsed = PreviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { salesOrderId, shipmentId, shipmentIds, customMessage } =
      parsed.data;
    const supabase = getAdminClient();

    const ids = shipmentIds ?? (shipmentId ? [shipmentId] : []);
    const info = await fetchShipmentsInfo(supabase, salesOrderId, ids);

    if (!info) {
      return NextResponse.json(
        { success: false, error: 'Order or shipments not found' },
        { status: 404 }
      );
    }

    if (info.trackings.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No tracking number available for the selected shipments',
        },
        { status: 422 }
      );
    }

    const html = buildTrackingEmailHtml({
      customerName: info.customerName,
      orderNumber: info.orderNumber,
      trackings: info.trackings.map(t => ({
        trackingNumber: t.trackingNumber,
        trackingUrl: t.trackingUrl,
        carrierName: t.carrierName,
        shippedAt: t.shippedAt,
      })),
      customMessage,
    });

    return NextResponse.json({
      success: true,
      html,
      customerName: info.customerName,
      orderNumber: info.orderNumber,
      trackings: info.trackings.map(t => ({
        shipmentId: t.shipmentId,
        trackingNumber: t.trackingNumber,
        trackingUrl: t.trackingUrl,
        carrierName: t.carrierName,
        shippedAt: t.shippedAt,
      })),
    });
  } catch (error) {
    console.error('[preview-shipping-tracking] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
