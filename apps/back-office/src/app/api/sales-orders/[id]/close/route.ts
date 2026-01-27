/**
 * Close Sales Order (Partial Closure)
 * POST /api/sales-orders/[id]/close
 * Closes order and releases forecasted_out via trigger CAS 5
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@verone/utils/supabase/server';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const params = await context.params;
    const orderId = params.id;

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get sales order
    const { data: order, error: orderError } = await supabase
      .from('sales_orders')
      .select('id, order_number, status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('[Close Order] Order not found:', orderError);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Validate order status
    if ((order.status as string) === 'closed') {
      return NextResponse.json(
        { error: 'Order is already closed' },
        { status: 400 }
      );
    }

    const validStatuses = ['validated', 'partially_shipped'];
    if (!validStatuses.includes(order.status as string)) {
      return NextResponse.json(
        { error: 'Only validated or partially_shipped orders can be closed' },
        { status: 400 }
      );
    }

    // Get order items to calculate units_released
    const { data: items } = await supabase
      .from('sales_order_items')
      .select('quantity, quantity_shipped')
      .eq('sales_order_id', orderId);

    const unitsReleased =
      items?.reduce((sum, item) => {
        return sum + (item.quantity - (item.quantity_shipped || 0));
      }, 0) || 0;

    // Close order - Trigger CAS 5 will release forecasted_out automatically
    const { error: updateError } = await supabase
      .from('sales_orders')
      .update({
        status: 'closed' as any, // TypeScript types incomplete, 'closed' exists in DB
        closed_at: new Date().toISOString(),
        closed_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('[Close Order] Update failed:', updateError);
      return NextResponse.json(
        { error: 'Failed to close order' },
        { status: 500 }
      );
    }

    console.log(
      `[Close Order] Order ${order.order_number} closed successfully`,
      {
        units_released: unitsReleased,
        closed_by: user.id,
      }
    );

    return NextResponse.json({
      success: true,
      order_id: orderId,
      order_number: order.order_number,
      units_released: unitsReleased,
      message: `Order ${order.order_number} closed. ${unitsReleased} units released from forecast.`,
    });
  } catch (error) {
    console.error('[Close Order] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
