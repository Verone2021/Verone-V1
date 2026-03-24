/**
 * API Route: Get pending Packlink shipments (grouped by expedition)
 * GET /api/packlink/shipments/pending
 *
 * Returns shipments grouped by packlink_shipment_id.
 * One row = one expedition (can contain multiple products).
 */

import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

interface GroupedShipment {
  packlink_shipment_id: string;
  sales_order_id: string;
  order_number: string;
  customer_name: string;
  items: Array<{ product_name: string; quantity: number }>;
  carrier_name: string | null;
  carrier_service: string | null;
  shipping_cost: number | null;
  packlink_status: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  label_url: string | null;
  estimated_delivery_at: string | null;
  created_at: string | null;
}

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ shipments: [] });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: rawData, error: rawErr } = await supabase
      .from('sales_order_shipments')
      .select(
        'id, sales_order_id, product_id, packlink_shipment_id, quantity_shipped, carrier_name, carrier_service, shipping_cost, packlink_status, tracking_number, tracking_url, label_url, estimated_delivery_at, created_at'
      )
      .in('packlink_status', ['a_payer', 'paye', 'in_transit', 'incident'])
      .order('created_at', { ascending: false });

    if (rawErr) {
      console.error('[Packlink Pending] Error:', rawErr);
      return NextResponse.json({ shipments: [] });
    }

    // Group by packlink_shipment_id
    const groups = new Map<
      string,
      {
        rows: Array<Record<string, unknown>>;
        soId: string;
        productIds: string[];
      }
    >();

    for (const row of (rawData ?? []) as Array<Record<string, unknown>>) {
      const plId = (row.packlink_shipment_id as string) ?? (row.id as string);
      if (!groups.has(plId)) {
        groups.set(plId, {
          rows: [],
          soId: row.sales_order_id as string,
          productIds: [],
        });
      }
      const g = groups.get(plId)!;
      g.rows.push(row);
      g.productIds.push(row.product_id as string);
    }

    // Enrich each group with order + product names
    const shipments: GroupedShipment[] = await Promise.all(
      Array.from(groups.entries()).map(async ([plId, group]) => {
        const firstRow = group.rows[0];

        // Load order info
        const { data: so } = await supabase
          .from('sales_orders')
          .select(
            'order_number, customer_id, individual_customer_id, organisations(trade_name), individual_customers(first_name, last_name)'
          )
          .eq('id', group.soId)
          .single();

        const soData = so as Record<string, unknown> | null;
        const org = soData?.organisations as { trade_name: string } | null;
        const indiv = soData?.individual_customers as {
          first_name: string;
          last_name: string;
        } | null;

        // Load product names
        const { data: products } = await supabase
          .from('products')
          .select('id, name')
          .in('id', group.productIds);

        const productMap = new Map(
          (products ?? []).map((p: { id: string; name: string }) => [
            p.id,
            p.name,
          ])
        );

        const items = group.rows.map(r => ({
          product_name: productMap.get(r.product_id as string) ?? '',
          quantity: (r.quantity_shipped as number) ?? 0,
        }));

        return {
          packlink_shipment_id: plId,
          sales_order_id: group.soId,
          order_number: (soData?.order_number as string) ?? '',
          customer_name:
            org?.trade_name ??
            (indiv ? `${indiv.first_name} ${indiv.last_name}` : ''),
          items,
          carrier_name: (firstRow.carrier_name as string) ?? null,
          carrier_service: (firstRow.carrier_service as string) ?? null,
          shipping_cost: (firstRow.shipping_cost as number) ?? null,
          packlink_status: (firstRow.packlink_status as string) ?? null,
          tracking_number: (firstRow.tracking_number as string) ?? null,
          tracking_url: (firstRow.tracking_url as string) ?? null,
          label_url: (firstRow.label_url as string) ?? null,
          estimated_delivery_at:
            (firstRow.estimated_delivery_at as string) ?? null,
          created_at: (firstRow.created_at as string) ?? null,
        };
      })
    );

    return NextResponse.json({ shipments });
  } catch (err) {
    console.error('[Packlink Pending] Error:', err);
    return NextResponse.json({ shipments: [] });
  }
}
