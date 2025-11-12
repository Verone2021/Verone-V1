/**
 * Get Shipments for Sales Order
 * GET /api/sales-orders/[id]/shipments
 * Returns shipments list + summary for a sales order
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@verone/utils/supabase/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const params = await context.params;
    const orderId = params.id;

    // Get shipment summary via RPC (TypeScript types incomplete, cast to any)
    const { data: summaryData, error: summaryError } = await (
      supabase as any
    ).rpc('get_shipment_summary', {
      p_sales_order_id: orderId,
    });

    if (summaryError) {
      console.error('[Get Shipments] Error fetching summary:', summaryError);
      return NextResponse.json(
        { error: 'Failed to fetch shipment summary' },
        { status: 500 }
      );
    }

    const summary = summaryData?.[0] || {
      total_shipments: 0,
      total_units_shipped: 0,
      total_units_ordered: 0,
      total_units_remaining: 0,
      last_shipment_date: null,
      completion_percentage: 0,
    };

    // Get all shipments for this order
    const { data: shipments, error: shipmentsError } = await supabase
      .from('shipments')
      .select('*')
      .eq('sales_order_id', orderId)
      .order('created_at', { ascending: false });

    if (shipmentsError) {
      console.error(
        '[Get Shipments] Error fetching shipments:',
        shipmentsError
      );
      return NextResponse.json(
        { error: 'Failed to fetch shipments' },
        { status: 500 }
      );
    }

    // For each shipment, get tracking events (table not in types, use any)
    const shipmentsWithTracking = await Promise.all(
      (shipments || []).map(async (shipment: any) => {
        const { data: trackingEvents } = await (supabase as any)
          .from('shipment_tracking_events')
          .select('*')
          .eq('shipment_id', shipment.id)
          .order('event_timestamp', { ascending: false });

        return {
          ...shipment,
          tracking_events: trackingEvents || [],
        };
      })
    );

    return NextResponse.json({
      summary,
      shipments: shipmentsWithTracking,
    });
  } catch (error) {
    console.error('[Get Shipments] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
