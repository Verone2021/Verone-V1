/**
 * API Route: Create Packlink Draft (Step 1: DB only)
 * POST /api/packlink/draft/create
 *
 * Enregistre les données du formulaire dans notre DB
 * Étape suivante : appeler Packlink API pour créer draft
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createServerClient } from '@verone/utils/supabase/server';

import {
  createDraftSchema,
  validateData,
  formatZodErrors,
} from '@/lib/packlink/validation';

export async function POST(request: NextRequest) {
  try {
    // 1. Parse request body
    const body = await request.json();
    const { sales_order_id, ...draftData } = body;

    if (!sales_order_id) {
      return NextResponse.json(
        { error: true, code: 400, message: 'sales_order_id est obligatoire' },
        { status: 400 }
      );
    }

    // 2. Valider données avec Zod
    const validation = validateData(createDraftSchema, draftData);

    if (!validation.success) {
      return NextResponse.json(
        { error: true, code: 422, ...formatZodErrors(validation.errors) },
        { status: 422 }
      );
    }

    const validatedData = validation.data;

    // 3. Créer draft chez Packlink API
    const { getPacklinkClient } = await import('@/lib/packlink/client');
    const packlinkClient = getPacklinkClient();

    const draftResponse = await packlinkClient.createDraft({
      from: validatedData.from,
      to: validatedData.to,
      packages: validatedData.packages,
      service_id: validatedData.service_id,
      content: validatedData.content,
      contentvalue: validatedData.contentvalue,
    });

    const draftReference = draftResponse.shipment_reference;

    // 4. Enregistrer dans notre DB
    const supabase = await createServerClient();

    const { data: shipment, error: dbError } = await supabase
      .from('shipments')
      .insert({
        sales_order_id,
        shipping_method: 'packlink',
        shipment_type: 'parcel',
        shipping_address: validatedData.to,
        packlink_shipment_id: draftReference,
        packlink_service_id: validatedData.service_id,
        metadata: {
          status: 'DRAFT',
          draft_reference: draftReference,
          from: validatedData.from,
          to: validatedData.to,
          packages: validatedData.packages,
          content: validatedData.content,
          content_value: validatedData.contentvalue,
          customs: validatedData.customs || null,
          dropoff_point_id: validatedData.dropoff_point_id || null,
          shipment_custom_reference:
            validatedData.shipment_custom_reference || null,
        },
      })
      .select()
      .single();

    if (dbError) {
      console.error('[API] DB insert error:', dbError);
      return NextResponse.json(
        {
          error: true,
          code: 500,
          message: "Erreur lors de l'enregistrement",
          details: [
            {
              field: 'database',
              type: 'insert_error',
              message: dbError.message,
            },
          ],
        },
        { status: 500 }
      );
    }

    // 5. Retour succès
    return NextResponse.json({
      success: true,
      shipment: {
        id: shipment.id,
        sales_order_id: shipment.sales_order_id,
        packlink_draft_reference: draftReference,
        status: 'DRAFT',
        created_at: shipment.created_at,
      },
    });
  } catch (error) {
    console.error('[API] Unexpected error:', error);

    // Gestion erreurs Packlink
    const { PacklinkError } = await import('@/lib/packlink/errors');
    if (error instanceof PacklinkError) {
      return NextResponse.json(
        {
          error: true,
          code: error.statusCode || 500,
          message: error.message,
          details: error.response?.errors,
        },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: true, code: 500, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
