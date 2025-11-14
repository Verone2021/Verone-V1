/**
 * API Route: Create Manual Shipment
 * POST /api/shipments/create-manual
 *
 * Crée une expédition manuelle (interne, sans Packlink)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createServerClient } from '@verone/utils/supabase/server';
import { z } from 'zod';

const schema = z.object({
  sales_order_id: z.string().uuid('sales_order_id invalide'),
  carrier_name: z.string().min(1, 'Le nom du transporteur est obligatoire'),
  tracking_number: z.string().optional(),
  notes: z.string().optional(),
  estimated_delivery_at: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Parse et valider
    const body = await request.json();
    const validation = schema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: true,
          code: 422,
          message: 'Validation échouée',
          details: validation.error.issues,
        },
        { status: 422 }
      );
    }

    const {
      sales_order_id,
      carrier_name,
      tracking_number,
      notes,
      estimated_delivery_at,
    } = validation.data;

    // 2. Enregistrer dans DB
    const supabase = await createServerClient();

    const { data: shipment, error: dbError } = await supabase
      .from('shipments')
      .insert({
        sales_order_id,
        shipping_method: 'manual',
        shipment_type: 'parcel',
        carrier_name,
        tracking_number: tracking_number || null,
        estimated_delivery_at: estimated_delivery_at || null,
        metadata: {
          status: 'PENDING',
          notes: notes || null,
          created_type: 'manual',
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

    // 3. Retour succès
    return NextResponse.json({
      success: true,
      shipment: {
        id: shipment.id,
        sales_order_id: shipment.sales_order_id,
        carrier_name: shipment.carrier_name,
        tracking_number: shipment.tracking_number,
        status: 'PENDING',
        created_at: shipment.created_at,
      },
    });
  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return NextResponse.json(
      { error: true, code: 500, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
