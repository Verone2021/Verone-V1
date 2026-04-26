'use client';

import { useState, useCallback } from 'react';

import type { ShipmentItem, ShipmentHistory } from '@verone/types';
import { createClient } from '@verone/utils/supabase/client';
import { getOrganisationDisplayName } from '@verone/utils/utils/organisation-helpers';

import type { SalesOrderForShipment } from './types';

/**
 * Sub-hook : chargement détail SO pour expédition + historique
 */
export function useShipmentDetail() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Charger un SO avec items pour formulaire expédition
   */
  const loadSalesOrderForShipment = useCallback(
    async (soId: string): Promise<SalesOrderForShipment | null> => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('sales_orders')
          .select(
            `
          id,
          order_number,
          status,
          created_at,
          expected_delivery_date,
          shipped_at,
          shipped_by,
          shipping_address,
          customer_id,
          customer_type,
          individual_customer_id,
          responsable_contact:contacts!sales_orders_responsable_contact_id_fkey(id, first_name, last_name, email, phone, mobile),
          billing_contact:contacts!sales_orders_billing_contact_id_fkey(id, first_name, last_name, email, phone, mobile),
          delivery_contact:contacts!sales_orders_delivery_contact_id_fkey(id, first_name, last_name, email, phone, mobile),
          sales_order_items (
            id,
            product_id,
            quantity,
            quantity_shipped,
            unit_price_ht,
            products (
              id,
              name,
              sku,
              stock_quantity,
              stock_real,
              stock_forecasted_out,
              product_images!left (
                public_url,
                is_primary
              )
            )
          )
        `
          )
          .eq('id', soId)
          .single();

        if (fetchError) {
          console.error('Erreur chargement SO pour expédition:', fetchError);
          setError(fetchError.message);
          return null;
        }

        if (!data) {
          return null;
        }

        // Charger nom client selon customer_type (relation polymorphique)
        let customerName = 'Client inconnu';
        let organisationData: SalesOrderForShipment['organisations'] | null =
          null;

        if (data.customer_type === 'organization' && data.customer_id) {
          const { data: org } = await supabase
            .from('organisations')
            .select(
              'id, legal_name, trade_name, email, phone, address_line1, address_line2, postal_code, city, region, enseigne_id'
            )
            .eq('id', data.customer_id)
            .single();

          if (org) {
            customerName = getOrganisationDisplayName(org);
            organisationData = {
              ...org,
              email: org.email ?? undefined,
              phone: org.phone ?? undefined,
              address_line1: org.address_line1 ?? undefined,
              address_line2: org.address_line2 ?? undefined,
              postal_code: org.postal_code ?? undefined,
              city: org.city ?? undefined,
              region: org.region ?? undefined,
              enseigne_id: org.enseigne_id ?? null,
            };
          }
        } else if (
          data.customer_type === 'individual' &&
          data.individual_customer_id
        ) {
          const { data: indiv } = await supabase
            .from('individual_customers')
            .select('first_name, last_name')
            .eq('id', data.individual_customer_id)
            .single();

          if (indiv) {
            customerName = `${indiv.first_name} ${indiv.last_name}`;
          }
        }

        // Charger les expéditions Packlink en cours (a_payer) pour cette commande
        // Ces quantités ne sont PAS dans quantity_shipped (trigger skip pour a_payer)
        const { data: pendingShipments } = await supabase
          .from('sales_order_shipments')
          .select('product_id, quantity_shipped')
          .eq('sales_order_id', soId)
          .eq('packlink_status', 'a_payer');

        const pendingByProduct = new Map<string, number>();
        for (const ps of pendingShipments ?? []) {
          const current = pendingByProduct.get(ps.product_id) ?? 0;
          pendingByProduct.set(ps.product_id, current + ps.quantity_shipped);
        }

        return {
          ...data,
          customer_name: customerName,
          organisations: organisationData,
          _pendingPacklinkByProduct: Object.fromEntries(pendingByProduct),
        } as SalesOrderForShipment & {
          _pendingPacklinkByProduct: Record<string, number>;
        };
      } catch (err) {
        console.error('Exception chargement SO:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  /**
   * Transformer items SO en ShipmentItems avec calculs
   */
  const prepareShipmentItems = useCallback(
    (salesOrder: SalesOrderForShipment): ShipmentItem[] => {
      // Récupérer les quantités Packlink en cours (a_payer, pas encore dans quantity_shipped)
      const pendingMap =
        (
          salesOrder as SalesOrderForShipment & {
            _pendingPacklinkByProduct?: Record<string, number>;
          }
        )._pendingPacklinkByProduct ?? {};

      return salesOrder.sales_order_items.map(item => {
        const quantityOrdered = item.quantity;
        const quantityAlreadyShipped = item.quantity_shipped ?? 0;
        const pendingPacklink = pendingMap[item.product_id] ?? 0;
        const quantityRemaining =
          quantityOrdered - quantityAlreadyShipped - pendingPacklink;
        const stockAvailable = item.products.stock_real ?? 0;

        // Extraire l'image principale du produit
        const primaryImage = item.products.product_images?.find(
          img => img.is_primary
        );
        const imageUrl =
          primaryImage?.public_url ??
          item.products.product_images?.[0]?.public_url ??
          null;

        return {
          sales_order_item_id: item.id,
          product_id: item.product_id,
          product_name: item.products.name,
          product_sku: item.products.sku,
          primary_image_url: imageUrl,
          quantity_ordered: quantityOrdered,
          quantity_already_shipped: quantityAlreadyShipped,
          quantity_remaining: quantityRemaining,
          quantity_to_ship: quantityRemaining, // Défaut: quantité restante (le trigger DB ajuste le stock)
          stock_available: stockAvailable,
          unit_price_ht: item.unit_price_ht,
        };
      });
    },
    []
  );

  /**
   * Charger historique expéditions
   * Source primaire: sales_order_shipments (nouvelles expéditions)
   * Fallback: stock_movements avec reference_type='sale' (legacy)
   */
  const loadShipmentHistory = useCallback(
    async (soId: string): Promise<ShipmentHistory[]> => {
      try {
        // 1. Source primaire : sales_order_shipments (nouvelles expéditions)
        const { data: shipments, error: shipmentsError } = await supabase
          .from('sales_order_shipments')
          .select(
            `
            id, shipped_at, tracking_number, tracking_url, notes, quantity_shipped, product_id, shipped_by,
            delivery_method, carrier_name, carrier_service, shipping_cost,
            products:product_id (name, sku, product_images!left(public_url, is_primary))
          `
          )
          .eq('sales_order_id', soId)
          .order('shipped_at', { ascending: false });

        if (!shipmentsError && shipments && shipments.length > 0) {
          // Résoudre les noms des expéditeurs (shipped_by UUID → nom)
          const shippedByIds = [
            ...new Set(
              shipments.filter(s => s.shipped_by).map(s => s.shipped_by)
            ),
          ];
          const profilesMap = new Map<string, string>();
          if (shippedByIds.length > 0) {
            const { data: profiles } = await supabase
              .from('user_profiles')
              .select('user_id, first_name, last_name')
              .in('user_id', shippedByIds);
            if (profiles) {
              for (const p of profiles) {
                profilesMap.set(
                  p.user_id,
                  `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()
                );
              }
            }
          }

          const grouped = new Map<string, ShipmentHistory>();
          for (const s of shipments) {
            const key = s.shipped_at;
            const product = s.products as unknown as {
              name: string;
              sku: string;
              product_images?: Array<{
                public_url: string;
                is_primary: boolean;
              }>;
            } | null;

            // Extraire image principale
            const primaryImage = product?.product_images?.find(
              img => img.is_primary
            );
            const imageUrl =
              primaryImage?.public_url ??
              product?.product_images?.[0]?.public_url ??
              undefined;

            if (!grouped.has(key)) {
              grouped.set(key, {
                shipment_id: s.id,
                shipped_at: s.shipped_at,
                carrier_name: s.carrier_name ?? 'Manuel',
                service_name: s.carrier_service ?? undefined,
                tracking_number: s.tracking_number ?? undefined,
                tracking_url: s.tracking_url ?? undefined,
                delivery_method: s.delivery_method ?? undefined,
                shipping_cost: s.shipping_cost ?? undefined,
                items: [],
                total_quantity: 0,
                delivery_status: 'delivered',
                shipped_by_name: s.shipped_by
                  ? (profilesMap.get(s.shipped_by) ?? undefined)
                  : undefined,
                notes: s.notes ?? undefined,
              });
            }
            const h = grouped.get(key)!;
            h.items.push({
              product_name: product?.name ?? 'Produit inconnu',
              product_sku: product?.sku ?? '-',
              quantity_shipped: s.quantity_shipped,
              product_image_url: imageUrl,
            });
            h.total_quantity += s.quantity_shipped;
          }
          return Array.from(grouped.values());
        }

        // 2. Fallback : stock_movements legacy (reference_type = 'sale')
        const { data: movements, error: movementsError } = await supabase
          .from('stock_movements')
          .select(
            `
            id, quantity_change, performed_at, notes, product_id,
            carrier_name, tracking_number,
            products (name, sku)
          `
          )
          .eq('reference_type', 'sale')
          .eq('reference_id', soId)
          .eq('movement_type', 'OUT')
          .order('performed_at', { ascending: false });

        if (movementsError) {
          console.error('Erreur chargement historique legacy:', movementsError);
          return [];
        }

        const grouped = new Map<string, ShipmentHistory>();
        movements?.forEach(m => {
          const key = m.performed_at;
          const product = m.products as unknown as {
            name: string;
            sku: string;
          };
          if (!grouped.has(key)) {
            grouped.set(key, {
              shipment_id: m.id,
              shipped_at: m.performed_at,
              carrier_name: m.carrier_name ?? 'Manuel',
              tracking_number: m.tracking_number ?? undefined,
              items: [],
              total_quantity: 0,
              delivery_status: 'delivered',
            });
          }
          const h = grouped.get(key)!;
          h.items.push({
            product_name: product.name,
            product_sku: product.sku,
            quantity_shipped: Math.abs(m.quantity_change),
          });
          h.total_quantity += Math.abs(m.quantity_change);
        });

        return Array.from(grouped.values());
      } catch (err) {
        console.error('Exception historique expéditions:', err);
        return [];
      }
    },
    [supabase]
  );

  return {
    loading,
    error,
    loadSalesOrderForShipment,
    prepareShipmentItems,
    loadShipmentHistory,
  };
}
