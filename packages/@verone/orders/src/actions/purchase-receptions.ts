'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import type { ValidateReceptionPayload } from '@verone/types';
import { createServerClient } from '@verone/utils/supabase/server';

// Validation schema Zod
const receptionItemSchema = z.object({
  purchase_order_item_id: z.string().uuid(),
  product_id: z.string().uuid(),
  quantity_to_receive: z.number().int().positive(),
});

const validateReceptionSchema = z.object({
  purchase_order_id: z.string().uuid(),
  items: z.array(receptionItemSchema).min(1),
  received_at: z.string().datetime().optional(),
  carrier_name: z.string().optional(),
  tracking_number: z.string().optional(),
  delivery_note: z.string().optional(),
  notes: z.string().optional(),
  received_by: z.string().uuid(),
});

/**
 * Server Action: Valider Réception Purchase Order
 *
 * Workflow:
 * 1. Validation Zod payload
 * 2. Vérifier PO existe et status valide
 * 3. Pour chaque item: INSERT INTO purchase_order_receptions
 * 4. Triggers PostgreSQL gèrent automatiquement:
 *    - Sync quantity_received dans purchase_order_items
 *    - Création stock_movements IN
 *    - Update products.stock_real
 *    - Update purchase_orders.status
 * 5. Revalidate cache Next.js
 *
 * @param payload ValidateReceptionPayload
 * @returns Promise<{ success: boolean; error?: string }>
 */
export async function validatePurchaseReception(
  payload: ValidateReceptionPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Validation Zod
    const validatedData = validateReceptionSchema.parse(payload);

    // 2. Create Supabase client
    const supabase = await createServerClient();

    // 3. Vérifier PO existe et status valide
    const { data: purchaseOrder, error: poError } = await supabase
      .from('purchase_orders')
      .select('id, po_number, status')
      .eq('id', validatedData.purchase_order_id)
      .single();

    if (poError || !purchaseOrder) {
      return { success: false, error: 'Commande fournisseur introuvable' };
    }

    if (!['validated', 'partially_received'].includes(purchaseOrder.status)) {
      return {
        success: false,
        error: `Impossible de réceptionner: commande au statut "${purchaseOrder.status}"`,
      };
    }

    // 4. Pour chaque item: INSERT dans purchase_order_receptions
    for (const item of validatedData.items) {
      if (item.quantity_to_receive <= 0) {
        continue; // Skip items avec quantité 0
      }

      // Vérifier cohérence quantité
      const { data: currentItem, error: itemError } = await supabase
        .from('purchase_order_items')
        .select('id, quantity, quantity_received')
        .eq('id', item.purchase_order_item_id)
        .single();

      if (itemError || !currentItem) {
        return {
          success: false,
          error: `Item ${item.purchase_order_item_id} introuvable`,
        };
      }

      const currentReceived = currentItem.quantity_received || 0;
      const newReceived = currentReceived + item.quantity_to_receive;

      if (newReceived > currentItem.quantity) {
        return {
          success: false,
          error: `Quantité incohérente pour item ${item.purchase_order_item_id}: ${newReceived} > ${currentItem.quantity}`,
        };
      }

      // ✅ INSERT INTO purchase_order_receptions (triggers existants gèrent stock)
      const { error: insertError } = await supabase
        .from('purchase_order_receptions')
        .insert({
          purchase_order_id: validatedData.purchase_order_id,
          product_id: item.product_id,
          quantity_received: item.quantity_to_receive,
          received_at: validatedData.received_at || new Date().toISOString(),
          received_by: validatedData.received_by,
          carrier_name: validatedData.carrier_name,
          tracking_number: validatedData.tracking_number,
          delivery_note: validatedData.delivery_note,
          notes: validatedData.notes,
        });

      if (insertError) {
        console.error('Erreur insertion réception:', insertError);
        return {
          success: false,
          error: `Erreur insertion réception: ${insertError.message}`,
        };
      }
    }

    // 5. Revalidate cache Next.js
    revalidatePath('/stocks/receptions');
    revalidatePath(`/commandes/fournisseurs/${validatedData.purchase_order_id}`);

    return { success: true };
  } catch (error) {
    console.error('Erreur validation réception:', error);

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
