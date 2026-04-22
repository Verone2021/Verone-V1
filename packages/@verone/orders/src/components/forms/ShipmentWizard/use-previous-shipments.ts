'use client';

import { useState, useEffect } from 'react';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { PreviousShipmentGroup, ShipmentRow } from './types';

/**
 * Loads previous shipments for partially-shipped orders.
 * Extracted from useShipmentWizard to keep that hook under 400 lines.
 */
export function usePreviousShipments(
  salesOrderId: string,
  salesOrderStatus: string,
  supabase: SupabaseClient
): {
  previousShipments: PreviousShipmentGroup[];
  showPreviousShipments: boolean;
  setShowPreviousShipments: (v: boolean) => void;
} {
  const [previousShipments, setPreviousShipments] = useState<
    PreviousShipmentGroup[]
  >([]);
  const [showPreviousShipments, setShowPreviousShipments] = useState(false);

  // Charge aussi pour 'validated' et 'shipped' — les shipments Packlink `a_payer`
  // ne déclenchent pas le trigger `update_stock_on_shipment` (early return tant que
  // transport pas payé), donc la commande reste `validated` même avec des shipments
  // existants. Sans cette extension, le wizard propose de réexpédier des quantités
  // déjà réservées → risque de doubler l'envoi (BO-SHIP-PROG-001).
  useEffect(() => {
    if (
      !['validated', 'partially_shipped', 'shipped'].includes(salesOrderStatus)
    )
      return;

    const loadPreviousShipments = async () => {
      const { data: rawData } = await supabase
        .from('sales_order_shipments')
        .select(
          `shipped_at, quantity_shipped, product_id,
          delivery_method, carrier_name, tracking_number, tracking_url,
          packlink_status, shipping_cost,
          products:product_id (name)`
        )
        .eq('sales_order_id', salesOrderId)
        .order('shipped_at', { ascending: true });

      if (!rawData || rawData.length === 0) return;

      const rows = rawData as unknown as ShipmentRow[];

      const groups = new Map<string, PreviousShipmentGroup>();
      for (const row of rows) {
        const key = row.shipped_at;
        if (!groups.has(key)) {
          groups.set(key, {
            shipped_at: row.shipped_at,
            delivery_method: row.delivery_method,
            carrier_name: row.carrier_name,
            tracking_number: row.tracking_number,
            tracking_url: row.tracking_url,
            packlink_status: row.packlink_status,
            shipping_cost: row.shipping_cost,
            items: [],
          });
        }
        groups.get(key)!.items.push({
          product_name: row.products?.name ?? 'Produit',
          quantity: row.quantity_shipped,
        });
      }
      setPreviousShipments(Array.from(groups.values()));
    };

    void loadPreviousShipments();
  }, [salesOrderId, salesOrderStatus, supabase]);

  return { previousShipments, showPreviousShipments, setShowPreviousShipments };
}
