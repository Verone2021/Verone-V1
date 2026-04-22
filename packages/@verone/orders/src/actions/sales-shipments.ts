'use server';

import { revalidatePath } from 'next/cache';

import type { ValidateShipmentPayload } from '@verone/types';
import { createServerClient } from '@verone/utils/supabase/server';
import { z } from 'zod';

// Validation schema Zod
const shipmentItemSchema = z.object({
  sales_order_item_id: z.string().uuid(),
  product_id: z.string().uuid(),
  quantity_to_ship: z.number().int().positive(),
});

// Dimensions colis envoyés à Packlink (BO-SHIP-UX-002)
const packageInfoSchema = z.object({
  weight: z.number().positive(),
  width: z.number().positive(),
  height: z.number().positive(),
  length: z.number().positive(),
});

const validateShipmentSchema = z.object({
  sales_order_id: z.string().uuid(),
  items: z.array(shipmentItemSchema).min(1),
  shipped_at: z.string().datetime().optional(),
  tracking_number: z.string().optional(),
  notes: z.string().optional(),
  shipped_by: z.string().uuid(),
  // Champs expédition enrichis (optionnels, utilisés par tous les modes)
  delivery_method: z
    .enum(['pickup', 'hand_delivery', 'manual', 'packlink'])
    .optional(),
  carrier_name: z.string().optional(),
  carrier_service: z.string().optional(),
  shipping_cost: z.number().optional(),
  estimated_delivery_at: z.string().optional(),
  // Champs Packlink (transport payé par Verone à Packlink, PAS le paiement client)
  packlink_shipment_id: z.string().optional(),
  packlink_status: z
    .enum(['a_payer', 'paye', 'in_transit', 'delivered', 'incident'])
    .optional(),
  // Dimensions colis Packlink (persistés pour l'historique)
  packages_info: z.array(packageInfoSchema).optional(),
});

/**
 * Server Action: Valider Expédition Sales Order
 *
 * Workflow:
 * 1. Validation Zod payload
 * 2. Vérifier SO existe et status valide (validated | partially_shipped)
 * 3. Pour chaque item: INSERT INTO sales_order_shipments
 * 4. Triggers PostgreSQL gèrent automatiquement:
 *    - Sync quantity_shipped dans sales_order_items
 *    - Création stock_movements OUT
 *    - Update products.stock_real
 *    - Update sales_orders.status
 * 5. Revalidate cache Next.js
 *
 * @param payload ValidateShipmentPayload (simplifié sans carrier_info/shipping_address)
 * @returns Promise<{ success: boolean; error?: string }>
 */
export async function validateSalesShipment(
  payload: Omit<
    ValidateShipmentPayload,
    'carrier_info' | 'shipping_address'
  > & {
    tracking_number?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Validation Zod
    const validatedData = validateShipmentSchema.parse(payload);

    // 2. Create Supabase client
    const supabase = await createServerClient();

    // 3. Vérifier SO existe et status valide
    const { data: salesOrder, error: soError } = await supabase
      .from('sales_orders')
      .select('id, order_number, status')
      .eq('id', validatedData.sales_order_id)
      .single();

    if (soError || !salesOrder) {
      return { success: false, error: 'Commande client introuvable' };
    }

    if (!['validated', 'partially_shipped'].includes(salesOrder.status)) {
      return {
        success: false,
        error: `Impossible d'expédier: commande au statut "${salesOrder.status}"`,
      };
    }

    // 4. Charger les expéditions Packlink en cours (a_payer) pour cette commande
    // Ces quantités ne sont PAS dans quantity_shipped (trigger skip pour a_payer)
    // Il faut les compter manuellement pour empêcher les doublons
    const { data: pendingPacklinkShipments } = await supabase
      .from('sales_order_shipments')
      .select('product_id, quantity_shipped')
      .eq('sales_order_id', validatedData.sales_order_id)
      .eq('packlink_status', 'a_payer');

    const pendingByProduct = new Map<string, number>();
    for (const ps of pendingPacklinkShipments ?? []) {
      const current = pendingByProduct.get(ps.product_id) ?? 0;
      pendingByProduct.set(ps.product_id, current + ps.quantity_shipped);
    }

    // 5. Pour chaque item: INSERT dans sales_order_shipments
    for (const item of validatedData.items) {
      if (item.quantity_to_ship <= 0) {
        continue; // Skip items avec quantité 0
      }

      // Vérifier cohérence quantité
      const { data: currentItem, error: itemError } = await supabase
        .from('sales_order_items')
        .select('id, quantity, quantity_shipped, product_id')
        .eq('id', item.sales_order_item_id)
        .single();

      if (itemError || !currentItem) {
        return {
          success: false,
          error: `Item ${item.sales_order_item_id} introuvable`,
        };
      }

      const currentShipped = currentItem.quantity_shipped || 0;
      const pendingPacklink = pendingByProduct.get(item.product_id) ?? 0;
      const totalEngaged =
        currentShipped + pendingPacklink + item.quantity_to_ship;

      if (totalEngaged > currentItem.quantity) {
        return {
          success: false,
          error: `Quantité impossible pour "${currentItem.product_id}": ${currentShipped} expédiés + ${pendingPacklink} en cours Packlink + ${item.quantity_to_ship} demandés = ${totalEngaged} > ${currentItem.quantity} commandés`,
        };
      }

      // Vérifier stock disponible
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, stock_real, name')
        .eq('id', item.product_id)
        .single();

      if (productError || !product) {
        return {
          success: false,
          error: `Produit ${item.product_id} introuvable`,
        };
      }

      if ((product.stock_real ?? 0) < item.quantity_to_ship) {
        console.warn(
          `[Shipment] Stock bas pour ${product.name}: ${product.stock_real ?? 0} disponibles, ${item.quantity_to_ship} expédiés. Le stock sera ajusté par le trigger.`
        );
      }

      // ✅ INSERT INTO sales_order_shipments (triggers gèrent stock)
      // Si packlink_status = 'a_payer' → le trigger INSERT ne décrémente PAS le stock
      // Le stock sera décrémenté quand packlink_status passe à 'paye' (trigger UPDATE)
      const { error: insertError } = await supabase
        .from('sales_order_shipments')
        .insert({
          sales_order_id: validatedData.sales_order_id,
          product_id: item.product_id,
          quantity_shipped: item.quantity_to_ship,
          shipped_at: validatedData.shipped_at ?? new Date().toISOString(),
          shipped_by: validatedData.shipped_by,
          tracking_number: validatedData.tracking_number,
          notes: validatedData.notes,
          delivery_method: validatedData.delivery_method,
          carrier_name: validatedData.carrier_name,
          carrier_service: validatedData.carrier_service,
          shipping_cost: validatedData.shipping_cost,
          estimated_delivery_at: validatedData.estimated_delivery_at,
          packlink_shipment_id: validatedData.packlink_shipment_id,
          packlink_status: validatedData.packlink_status,
          // Dupliqué sur chaque row du shipment (groupé par shipped_at côté lecture).
          // Default '[]'::jsonb si non fourni (ex: shipment manuel sans dimensions).
          packages_info: validatedData.packages_info ?? [],
        });

      if (insertError) {
        console.error('Erreur insertion expédition:', insertError);
        return {
          success: false,
          error: `Erreur insertion expédition: ${insertError.message}`,
        };
      }
    }

    // 5. Revalidate cache Next.js
    revalidatePath('/stocks/expeditions');
    revalidatePath('/commandes/clients');
    revalidatePath(`/commandes/clients/${validatedData.sales_order_id}`);

    return { success: true };
  } catch (error) {
    console.error('Erreur validation expédition:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Données invalides: ${error.issues.map(e => e.message).join(', ')}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur inconnue',
    };
  }
}

// Schéma de validation pour l'édition d'un shipment manuel
const updateShipmentSchema = z.object({
  shipment_id: z.string().uuid(),
  carrier_name: z.string().optional(),
  tracking_number: z.string().optional(),
  tracking_url: z.string().url().optional().or(z.literal('')),
  shipping_cost: z.number().min(0).optional(),
  notes: z.string().optional(),
});

type UpdateShipmentPayload = z.infer<typeof updateShipmentSchema>;

/**
 * Server Action: Éditer un shipment manuel existant
 *
 * Seuls les shipments avec delivery_method = 'manual' peuvent être édités.
 * Les champs modifiables : carrier_name, tracking_number, tracking_url, shipping_cost, notes.
 * Les champs non-modifiables : quantity_shipped, delivery_method, shipped_at, shipped_by, colonnes packlink_*.
 *
 * @param payload UpdateShipmentPayload
 * @returns Promise<{ success: boolean; error?: string }>
 */
export async function updateSalesShipment(
  payload: UpdateShipmentPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Validation Zod
    const validatedData = updateShipmentSchema.parse(payload);

    // 2. Create Supabase client
    const supabase = await createServerClient();

    // 3. Récupérer le shipment existant
    const { data: shipment, error: fetchError } = await supabase
      .from('sales_order_shipments')
      .select('id, delivery_method, sales_order_id')
      .eq('id', validatedData.shipment_id)
      .single();

    if (fetchError || !shipment) {
      return { success: false, error: 'Expédition introuvable' };
    }

    // 4. Guard : uniquement pour les expéditions manuelles
    if (shipment.delivery_method !== 'manual') {
      return {
        success: false,
        error: 'Edition impossible : uniquement pour expeditions manuelles',
      };
    }

    // 5. UPDATE des champs éditables
    const { error: updateError } = await supabase
      .from('sales_order_shipments')
      .update({
        carrier_name: validatedData.carrier_name ?? null,
        tracking_number: validatedData.tracking_number ?? null,
        tracking_url:
          validatedData.tracking_url !== undefined &&
          validatedData.tracking_url !== ''
            ? validatedData.tracking_url
            : null,
        shipping_cost: validatedData.shipping_cost ?? null,
        notes: validatedData.notes ?? null,
      })
      .eq('id', validatedData.shipment_id);

    if (updateError) {
      console.error('Erreur mise à jour expédition:', updateError);
      return {
        success: false,
        error: `Erreur mise à jour: ${updateError.message}`,
      };
    }

    // 6. Revalidate cache Next.js
    revalidatePath('/stocks/expeditions');
    revalidatePath('/commandes/clients');
    revalidatePath(`/commandes/clients/${shipment.sales_order_id}`);

    return { success: true };
  } catch (error) {
    console.error('Erreur édition expédition:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Données invalides: ${error.issues.map(e => e.message).join(', ')}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur inconnue',
    };
  }
}
