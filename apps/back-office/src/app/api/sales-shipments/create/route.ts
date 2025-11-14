/**
 * Create Shipment with Packlink (HIGH-LEVEL API)
 * POST /api/sales-shipments/create
 *
 * Workflow automatique complet : Shipment + Items + Parcels + Packlink Order
 * Pour workflow manuel Draft → Validation → Payment, utiliser /api/packlink/draft/create
 *
 * IMPORTANT : Appel direct createOrder() sans draft préalable
 * Use case : Expédition automatique depuis Sales Order confirmée
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createServerClient } from '@verone/utils/supabase/server';

import { getPacklinkClient } from '@/lib/packlink';
import type {
  PacklinkOrderRequest,
  PacklinkShipmentRequest,
} from '@/lib/packlink/types';

interface CreateShipmentRequest {
  sales_order_id: string;
  items: Array<{
    sales_order_item_id: string;
    quantity: number;
  }>;
  service_id: number;
  packages?: Array<{
    width: number;
    height: number;
    length: number;
    weight: number;
  }>;
  recipient?: {
    name: string;
    surname?: string;
    email: string;
    phone: string;
  };
  shipping_address?: {
    street1: string;
    city: string;
    zip_code: string;
    country: string;
    state?: string;
  };
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const body: CreateShipmentRequest = await request.json();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate input
    if (
      !body.sales_order_id ||
      !body.items ||
      body.items.length === 0 ||
      !body.service_id
    ) {
      return NextResponse.json(
        { error: 'Missing required fields: sales_order_id, items, service_id' },
        { status: 400 }
      );
    }

    // 1. Get sales order with items
    const { data: order, error: orderError } = await supabase
      .from('sales_orders')
      .select(
        `
        id,
        order_number,
        status,
        customer_id,
        shipping_address,
        organisations!sales_orders_customer_id_fkey(name, email, phone)
      `
      )
      .eq('id', body.sales_order_id)
      .single();

    if (orderError || !order) {
      console.error('[Create Shipment] Order not found:', orderError);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const validStatuses = ['confirmed', 'partially_shipped'];
    if (!validStatuses.includes(order.status as string)) {
      return NextResponse.json(
        { error: 'Only confirmed or partially_shipped orders can be shipped' },
        { status: 400 }
      );
    }

    // 2. Get order items with product details
    const itemIds = body.items.map(i => i.sales_order_item_id);
    const { data: orderItems, error: itemsError } = await supabase
      .from('sales_order_items')
      .select(
        `
        id,
        product_id,
        quantity,
        quantity_shipped,
        products(name, weight)
      `
      )
      .in('id', itemIds)
      .eq('sales_order_id', body.sales_order_id);

    if (itemsError || !orderItems) {
      console.error('[Create Shipment] Items not found:', itemsError);
      return NextResponse.json(
        { error: 'Order items not found' },
        { status: 404 }
      );
    }

    // 3. Validate quantities
    for (const reqItem of body.items) {
      const orderItem = orderItems.find(
        oi => oi.id === reqItem.sales_order_item_id
      );
      if (!orderItem) {
        return NextResponse.json(
          { error: `Item ${reqItem.sales_order_item_id} not found in order` },
          { status: 400 }
        );
      }

      const remaining = orderItem.quantity - (orderItem.quantity_shipped || 0);
      if (reqItem.quantity > remaining) {
        return NextResponse.json(
          {
            error: `Item ${orderItem.id}: requested ${reqItem.quantity} but only ${remaining} remaining`,
          },
          { status: 400 }
        );
      }
    }

    // 4. Prepare Packlink order
    const shippingAddr = body.shipping_address || order.shipping_address;
    if (!shippingAddr) {
      return NextResponse.json(
        { error: 'Shipping address is required' },
        { status: 400 }
      );
    }

    // Use provided packages or calculate default
    let packages;
    if (body.packages && body.packages.length > 0) {
      // Use provided packages from modal
      packages = body.packages.map(pkg => ({
        weight: pkg.weight,
        length: pkg.length,
        width: pkg.width,
        height: pkg.height,
      }));
    } else {
      // Fallback: calculate single package from weight
      const totalWeight = orderItems.reduce((sum, item) => {
        const quantity =
          body.items.find(i => i.sales_order_item_id === item.id)?.quantity ||
          0;
        return sum + ((item.products as any)?.weight || 1) * quantity;
      }, 0);

      packages = [
        {
          weight: Math.max(totalWeight, 0.5), // Min 0.5kg
          length: 30,
          width: 30,
          height: 30,
        },
      ];
    }

    // Generate unique reference
    const shipmentReference = `${order.order_number}-${Date.now()}`;

    // Warehouse address Vérone (hardcoded)
    const warehouseAddress = {
      name: 'Service client',
      surname: 'Entreprise',
      email: 'romeo@veronecollections.fr',
      phone: '0656720702',
      street1: '4 rue du Pérou',
      city: 'Massy',
      zip_code: '91300',
      country: 'FR',
    };

    // Cast shipping address from JSONB
    const addr = shippingAddr as any;

    // Get recipient info (from body or fallback to order)
    const recipientName =
      body.recipient?.name ||
      addr.name ||
      (order.organisations as any)?.name ||
      'Customer';
    const recipientSurname = body.recipient?.surname || addr.surname || '';
    const recipientEmail =
      body.recipient?.email ||
      addr.email ||
      (order.organisations as any)?.email ||
      '';
    const recipientPhone =
      body.recipient?.phone ||
      addr.phone ||
      (order.organisations as any)?.phone ||
      '';

    // Create shipment request
    const shipmentRequest: PacklinkShipmentRequest = {
      from: warehouseAddress,
      to: {
        name: recipientName,
        surname: recipientSurname,
        email: recipientEmail,
        phone: recipientPhone,
        street1: addr.street1,
        city: addr.city,
        zip_code: addr.zip_code,
        country: addr.country,
        state: addr.state,
      },
      packages,
      service_id: body.service_id,
      content: `Order ${order.order_number} - ${orderItems.length} items`,
      contentvalue: 100, // TODO: Calculate from order value
      shipment_custom_reference: shipmentReference,
    };

    // Wrap in order request
    const packlinkOrder: PacklinkOrderRequest = {
      order_custom_reference: shipmentReference,
      shipments: [shipmentRequest],
    };

    // 5. Call Packlink API
    console.log('[Create Shipment] Calling Packlink API...', {
      reference: shipmentReference,
      service_id: body.service_id,
    });

    const packlinkClient = getPacklinkClient();
    let packlinkResponse;

    try {
      packlinkResponse = await packlinkClient.createOrder(packlinkOrder);
    } catch (packlinkError) {
      console.error('[Create Shipment] Packlink API failed:', packlinkError);
      return NextResponse.json(
        {
          error: 'Failed to create shipment with Packlink',
          details: (packlinkError as Error).message,
        },
        { status: 500 }
      );
    }

    // Extract first shipment from response
    const packlinkShipment = packlinkResponse.shipments[0];
    if (!packlinkShipment) {
      console.error('[Create Shipment] No shipment in Packlink response');
      return NextResponse.json(
        { error: 'Invalid Packlink response: no shipment created' },
        { status: 500 }
      );
    }

    console.log('[Create Shipment] Packlink success:', {
      order_reference: packlinkResponse.order_reference,
      shipment_reference: packlinkShipment.shipment_reference,
    });

    // 6. Create shipment record in DB
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .insert({
        sales_order_id: body.sales_order_id,
        shipping_method: 'packlink',
        // shipment_type: DEFAULT 'parcel' en DB, pas besoin de spécifier
        carrier_name: 'Packlink', // TODO: Get from service details
        service_name: `Service ${body.service_id}`, // TODO: Get from service details
        tracking_number: null, // Will be updated via webhook
        tracking_url: null, // Will be updated via webhook
        packlink_shipment_id: packlinkShipment.shipment_reference,
        packlink_order_ref: packlinkResponse.order_reference,
        packlink_label_url: packlinkShipment.receipt_url || null,
        packlink_service_id: body.service_id, // ✅ INT pas string
        status: 'PROCESSING',
        shipping_address: shippingAddr,
        notes: body.notes || null,
        created_by: user.id,
      } as any) // TypeScript types incomplete, sales_order_id exists in DB
      .select()
      .single();

    if (shipmentError || !shipment) {
      console.error('[Create Shipment] DB insert failed:', shipmentError);
      return NextResponse.json(
        {
          error: 'Shipment created in Packlink but failed to save in database',
          packlink_reference: packlinkShipment.shipment_reference,
        },
        { status: 500 }
      );
    }

    // 7. Set warehouse_exit_at to trigger automatic stock management
    // ✅ CORRECT: Trigger handle_sales_order_stock() gère automatiquement :
    //    - stock_movements (INSERT)
    //    - products.stock_quantity (UPDATE)
    //    - products.stock_forecasted_out (UPDATE - libération)
    //    - sales_order_items.quantity_shipped (UPDATE)
    //    - sales_orders.status transition (partially_shipped → shipped)
    await supabase
      .from('sales_orders')
      .update({ warehouse_exit_at: new Date().toISOString() })
      .eq('id', body.sales_order_id);

    console.log(
      '[Create Shipment] Trigger handle_sales_order_stock() déclenché via warehouse_exit_at'
    );

    console.log(`[Create Shipment] Shipment created successfully:`, {
      shipment_id: shipment.id,
      packlink_order_ref: packlinkResponse.order_reference,
      packlink_shipment_ref: packlinkShipment.shipment_reference,
    });

    return NextResponse.json({
      success: true,
      shipment,
      packlink: {
        order_reference: packlinkResponse.order_reference,
        shipment_reference: packlinkShipment.shipment_reference,
        total_price: packlinkShipment.total_price,
        receipt_url: packlinkShipment.receipt_url,
      },
    });
  } catch (error) {
    console.error('[Create Shipment] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
