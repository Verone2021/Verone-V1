/**
 * API Route: /api/delivery-notes/[id]
 * Détail d'un bon de livraison
 *
 * GET - Récupère le détail d'une expédition comme bon de livraison
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createAdminClient } from '@verone/utils/supabase/server';

interface IRouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/delivery-notes/[id]
 */
export async function GET(
  request: NextRequest,
  context: IRouteParams
): Promise<
  NextResponse<{
    success: boolean;
    delivery_note?: unknown;
    error?: string;
  }>
> {
  try {
    const { id } = await context.params;

    const supabase = createAdminClient();

    // Récupérer l'expédition avec les relations
    const { data: shipment, error: shipmentError } = await supabase
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
          billing_address,
          notes
        ),
        products (
          id,
          name,
          sku,
          description
        )
      `
      )
      .eq('id', id)
      .single();

    if (shipmentError || !shipment) {
      return NextResponse.json(
        { success: false, error: 'Delivery note not found' },
        { status: 404 }
      );
    }

    const order = shipment.sales_orders as {
      id: string;
      order_number: string;
      customer_id: string;
      customer_type: string;
      shipping_address: unknown;
      billing_address: unknown;
      notes: string | null;
    } | null;

    // Récupérer toutes les lignes d'expédition pour cette commande
    const { data: allShipments } = await supabase
      .from('sales_order_shipments')
      .select(
        `
        *,
        products (id, name, sku)
      `
      )
      .eq('sales_order_id', shipment.sales_order_id)
      .eq('shipped_at', shipment.shipped_at);

    // Fetch customer info (polymorphic)
    let customer: {
      id: string;
      name: string;
      email: string | null;
      phone: string | null;
      address: {
        line1: string | null;
        city: string | null;
        postal_code: string | null;
        country: string | null;
      } | null;
      type: string;
    } | null = null;

    if (order?.customer_id && order?.customer_type) {
      if (order.customer_type === 'organisation') {
        const { data: org } = await supabase
          .from('organisations')
          .select(
            'id, legal_name, trade_name, email, phone, address_line1, city, postal_code, country'
          )
          .eq('id', order.customer_id)
          .single();
        customer = org
          ? {
              id: org.id,
              name: org.trade_name || org.legal_name,
              email: org.email,
              phone: org.phone,
              address: {
                line1: org.address_line1,
                city: org.city,
                postal_code: org.postal_code,
                country: org.country,
              },
              type: 'organisation',
            }
          : null;
      } else if (order.customer_type === 'individual') {
        const { data: indiv } = await supabase
          .from('individual_customers')
          .select(
            'id, first_name, last_name, email, phone, address_line1, city, postal_code, country'
          )
          .eq('id', order.customer_id)
          .single();
        customer = indiv
          ? {
              id: indiv.id,
              name: `${indiv.first_name ?? ''} ${indiv.last_name ?? ''}`.trim(),
              email: indiv.email,
              phone: indiv.phone,
              address: {
                line1: indiv.address_line1,
                city: indiv.city,
                postal_code: indiv.postal_code,
                country: indiv.country,
              },
              type: 'individual',
            }
          : null;
      }
    }

    const deliveryNote = {
      id: shipment.id,
      delivery_number: `BL-${shipment.shipped_at?.split('T')[0]?.replace(/-/g, '')}-${shipment.id.substring(0, 8).toUpperCase()}`,
      shipped_at: shipment.shipped_at,
      shipped_by: shipment.shipped_by,
      tracking_number: shipment.tracking_number,
      notes: shipment.notes,
      order: order
        ? {
            id: order.id,
            order_number: order.order_number,
            shipping_address: order.shipping_address,
            notes: order.notes,
          }
        : null,
      customer,
      items: (allShipments || [shipment]).map(s => ({
        id: s.id,
        product: s.products,
        quantity_shipped: s.quantity_shipped,
        notes: s.notes,
      })),
    };

    return NextResponse.json({
      success: true,
      delivery_note: deliveryNote,
    });
  } catch (error) {
    console.error('[API Delivery Notes] GET [id] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
