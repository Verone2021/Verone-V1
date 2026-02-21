/**
 * API Route: /api/delivery-notes
 * Liste des bons de livraison (basés sur sales_order_shipments)
 *
 * GET - Liste les expéditions comme bons de livraison
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createAdminClient } from '@verone/utils/supabase/server';

/**
 * GET /api/delivery-notes
 * Liste les expéditions avec infos commande et client
 */
export async function GET(request: NextRequest): Promise<
  NextResponse<{
    success: boolean;
    delivery_notes?: unknown[];
    count?: number;
    error?: string;
  }>
> {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');
    const limit = searchParams.get('limit') ?? '50';

    const supabase = createAdminClient();

    // Construire la requête
    let query = supabase
      .from('sales_order_shipments')
      .select(
        `
        *,
        sales_orders (
          id,
          order_number,
          customer_id,
          customer_type,
          shipping_address,
          billing_address
        ),
        products (
          id,
          name,
          sku
        )
      `
      )
      .order('shipped_at', { ascending: false })
      .limit(Number(limit));

    if (orderId) {
      query = query.eq('sales_order_id', orderId);
    }

    const { data: shipments, error: shipmentError } = await query;

    if (shipmentError) {
      console.error('[API Delivery Notes] Error:', shipmentError);
      return NextResponse.json(
        { success: false, error: shipmentError.message },
        { status: 500 }
      );
    }

    // Enrichir avec les infos client (fetch manuel pour relation polymorphique)
    const enrichedShipments = await Promise.all(
      (shipments ?? []).map(async shipment => {
        const order = shipment.sales_orders as {
          id: string;
          order_number: string;
          customer_id: string;
          customer_type: string;
          shipping_address: unknown;
          billing_address: unknown;
        } | null;

        let customer: {
          id: string;
          name: string;
          email: string | null;
          phone: string | null;
          type: string;
        } | null = null;

        if (order?.customer_id && order?.customer_type) {
          if (order.customer_type === 'organization') {
            const { data: org } = await supabase
              .from('organisations')
              .select('id, legal_name, trade_name, email, phone')
              .eq('id', order.customer_id)
              .single();
            customer = org
              ? {
                  id: org.id,
                  name: org.trade_name ?? org.legal_name,
                  email: org.email,
                  phone: org.phone,
                  type: 'organisation',
                }
              : null;
          } else if (order.customer_type === 'individual') {
            const { data: indiv } = await supabase
              .from('individual_customers')
              .select('id, first_name, last_name, email, phone')
              .eq('id', order.customer_id)
              .single();
            customer = indiv
              ? {
                  id: indiv.id,
                  name: `${indiv.first_name ?? ''} ${indiv.last_name ?? ''}`.trim(),
                  email: indiv.email,
                  phone: indiv.phone,
                  type: 'individual',
                }
              : null;
          }
        }

        return {
          id: shipment.id,
          shipped_at: shipment.shipped_at,
          shipped_by: shipment.shipped_by,
          tracking_number: shipment.tracking_number,
          notes: shipment.notes,
          quantity_shipped: shipment.quantity_shipped,
          product: shipment.products,
          order: order
            ? {
                id: order.id,
                order_number: order.order_number,
                shipping_address: order.shipping_address,
              }
            : null,
          customer,
        };
      })
    );

    return NextResponse.json({
      success: true,
      delivery_notes: enrichedShipments,
      count: enrichedShipments.length,
    });
  } catch (error) {
    console.error('[API Delivery Notes] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
