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

const validateShipmentSchema = z.object({
  sales_order_id: z.string().uuid(),
  items: z.array(shipmentItemSchema).min(1),
  shipped_at: z.string().datetime().optional(),
  tracking_number: z.string().optional(),
  notes: z.string().optional(),
  shipped_by: z.string().uuid(),
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

    // 4. Pour chaque item: INSERT dans sales_order_shipments
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
      const newShipped = currentShipped + item.quantity_to_ship;

      if (newShipped > currentItem.quantity) {
        return {
          success: false,
          error: `Quantité incohérente pour item ${item.sales_order_item_id}: ${newShipped} > ${currentItem.quantity}`,
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

      if ((product.stock_real || 0) < item.quantity_to_ship) {
        return {
          success: false,
          error: `Stock insuffisant pour ${product.name}: ${product.stock_real || 0} disponibles, ${item.quantity_to_ship} demandés`,
        };
      }

      // ✅ INSERT INTO sales_order_shipments (triggers existants gèrent stock)
      const { error: insertError } = await supabase
        .from('sales_order_shipments')
        .insert({
          sales_order_id: validatedData.sales_order_id,
          product_id: item.product_id,
          quantity_shipped: item.quantity_to_ship,
          shipped_at: validatedData.shipped_at || new Date().toISOString(),
          shipped_by: validatedData.shipped_by,
          tracking_number: validatedData.tracking_number,
          notes: validatedData.notes,
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
