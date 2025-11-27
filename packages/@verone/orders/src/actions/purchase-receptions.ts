'use server';

import { revalidatePath } from 'next/cache';

import type {
  ValidateReceptionPayload,
  CancelRemainderPayload,
  CancelRemainderResult,
} from '@verone/types';
import { createServerClient } from '@verone/utils/supabase/server';
import { z } from 'zod';

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
    revalidatePath(
      `/commandes/fournisseurs/${validatedData.purchase_order_id}`
    );

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

// Validation schema pour annulation reliquat
const cancelRemainderSchema = z.object({
  purchase_order_id: z.string().uuid(),
  reason: z.string().optional(),
  cancelled_by: z.string().uuid(),
});

/**
 * Server Action: Annuler Reliquat Purchase Order
 *
 * Workflow:
 * 1. Validation Zod payload
 * 2. Vérifier PO existe et status valide (validated ou partially_received)
 * 3. Récupérer items avec quantité restante > 0
 * 4. Pour chaque item avec reliquat:
 *    - Décrémenter products.stock_forecasted_in
 *    - Créer stock_movement de type CANCELLATION pour traçabilité
 * 5. Mettre à jour PO status = 'received' + received_at
 * 6. Reset stock_alert_tracking.draft_order_id si lié
 * 7. Revalidate cache Next.js
 *
 * @param payload CancelRemainderPayload
 * @returns Promise<CancelRemainderResult>
 */
export async function cancelPurchaseOrderRemainder(
  payload: CancelRemainderPayload
): Promise<CancelRemainderResult> {
  try {
    // 1. Validation Zod
    const validatedData = cancelRemainderSchema.parse(payload);

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
        error: `Impossible d'annuler le reliquat: commande au statut "${purchaseOrder.status}"`,
      };
    }

    // 4. Récupérer items avec quantité restante > 0
    const { data: items, error: itemsError } = await supabase
      .from('purchase_order_items')
      .select(
        `
        id,
        product_id,
        quantity,
        quantity_received,
        products (
          id,
          name,
          sku,
          stock_forecasted_in
        )
      `
      )
      .eq('purchase_order_id', validatedData.purchase_order_id);

    if (itemsError || !items) {
      return { success: false, error: 'Erreur récupération items commande' };
    }

    // Filtrer items avec reliquat
    const itemsWithRemainder = items.filter(item => {
      const received = item.quantity_received || 0;
      return item.quantity > received;
    });

    if (itemsWithRemainder.length === 0) {
      return {
        success: false,
        error: 'Aucun reliquat à annuler (commande déjà complète)',
      };
    }

    // 5. Pour chaque item avec reliquat
    const cancelledProducts: Array<{
      product_id: string;
      product_name: string;
      quantity_cancelled: number;
    }> = [];
    let totalQuantityCancelled = 0;

    for (const item of itemsWithRemainder) {
      const received = item.quantity_received || 0;
      const quantityCancelled = item.quantity - received;
      const product = item.products as {
        id: string;
        name: string;
        sku: string;
        stock_forecasted_in: number;
      };

      // a. Décrémenter stock_forecasted_in
      const newForecastedIn = Math.max(
        0,
        (product.stock_forecasted_in || 0) - quantityCancelled
      );

      const { error: updateProductError } = await supabase
        .from('products')
        .update({
          stock_forecasted_in: newForecastedIn,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.product_id);

      if (updateProductError) {
        console.error('Erreur update stock_forecasted_in:', updateProductError);
        return {
          success: false,
          error: `Erreur mise à jour stock prévisionnel: ${updateProductError.message}`,
        };
      }

      // b. Créer stock_movement de type ADJUST pour traçabilité annulation
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          product_id: item.product_id,
          movement_type: 'ADJUST',
          quantity_change: -quantityCancelled, // Quantité annulée (négative pour traçabilité)
          quantity_before: product.stock_forecasted_in || 0,
          quantity_after: newForecastedIn,
          reference_type: 'po_cancellation', // Type texte libre pour annulation PO
          reference_id: validatedData.purchase_order_id,
          reason_code: 'cancelled', // ENUM valide pour classification
          performed_by: validatedData.cancelled_by,
          performed_at: new Date().toISOString(),
          notes: validatedData.reason
            ? `Annulation reliquat PO ${purchaseOrder.po_number}: ${quantityCancelled} unités. ${validatedData.reason}`
            : `Annulation reliquat PO ${purchaseOrder.po_number}: ${quantityCancelled} unités`,
          affects_forecast: true,
        });

      if (movementError) {
        console.error('Erreur création stock_movement:', movementError);
        // Continue quand même - le mouvement de stock est pour traçabilité
      }

      cancelledProducts.push({
        product_id: item.product_id,
        product_name: product.name,
        quantity_cancelled: quantityCancelled,
      });
      totalQuantityCancelled += quantityCancelled;
    }

    // 6. Mettre à jour PO status = 'received'
    const { error: updatePoError } = await supabase
      .from('purchase_orders')
      .update({
        status: 'received',
        received_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', validatedData.purchase_order_id);

    if (updatePoError) {
      console.error('Erreur update PO status:', updatePoError);
      return {
        success: false,
        error: `Erreur mise à jour statut commande: ${updatePoError.message}`,
      };
    }

    // 7. Reset stock_alert_tracking si lié (le trigger existant le fait automatiquement
    // quand status passe à 'cancelled', mais ici on passe à 'received' donc on doit le faire manuellement)
    const { error: trackingError } = await supabase
      .from('stock_alert_tracking')
      .update({
        draft_order_id: null,
        draft_order_number: null,
        quantity_in_draft: null,
        added_to_draft_at: null,
        validated: false,
        validated_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('draft_order_id', validatedData.purchase_order_id);

    if (trackingError) {
      console.error('Erreur reset stock_alert_tracking:', trackingError);
      // Continue - pas critique
    }

    // 8. Revalidate cache Next.js
    revalidatePath('/stocks/receptions');
    revalidatePath('/stocks/alertes');
    revalidatePath('/commandes/fournisseurs');
    revalidatePath(
      `/commandes/fournisseurs/${validatedData.purchase_order_id}`
    );

    return {
      success: true,
      details: {
        items_cancelled: cancelledProducts.length,
        total_quantity_cancelled: totalQuantityCancelled,
        products: cancelledProducts,
      },
    };
  } catch (error) {
    console.error('Erreur annulation reliquat:', error);

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
