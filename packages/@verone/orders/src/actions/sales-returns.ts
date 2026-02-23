'use server';

import { revalidatePath } from 'next/cache';

import { createServerClient } from '@verone/utils/supabase/server';
import { z } from 'zod';

// Validation schema Zod
const returnItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity_returned: z.number().int().positive(),
});

const processReturnSchema = z.object({
  sales_order_id: z.string().uuid(),
  items: z.array(returnItemSchema).min(1),
  reason: z.string().min(1, 'La raison du retour est obligatoire'),
  notes: z.string().optional(),
  performed_by: z.string().uuid(),
});

export type ProcessReturnPayload = z.infer<typeof processReturnSchema>;

/**
 * Server Action: Process Customer Return
 *
 * Workflow:
 * 1. Validate payload with Zod
 * 2. Verify SO exists and status is 'shipped' or 'delivered'
 * 3. Verify each return quantity <= quantity_shipped for that item
 * 4. For each returned item: INSERT stock_movement (IN, reason_code='return_customer')
 *    → Trigger automatically updates products.stock_real
 * 5. Revalidate cache
 *
 * @param payload ProcessReturnPayload
 * @returns Promise<{ success: boolean; error?: string; movements_created?: number }>
 */
export async function processCustomerReturn(
  payload: ProcessReturnPayload
): Promise<{ success: boolean; error?: string; movements_created?: number }> {
  try {
    // 1. Validation Zod
    const validatedData = processReturnSchema.parse(payload);

    // 2. Create Supabase client
    const supabase = await createServerClient();

    // 3. Verify SO exists and status is valid
    const { data: salesOrder, error: soError } = await supabase
      .from('sales_orders')
      .select('id, order_number, status')
      .eq('id', validatedData.sales_order_id)
      .single();

    if (soError || !salesOrder) {
      return { success: false, error: 'Commande client introuvable' };
    }

    if (!['shipped', 'delivered'].includes(salesOrder.status)) {
      return {
        success: false,
        error: `Impossible de traiter un retour: commande au statut "${salesOrder.status}" (doit être "shipped" ou "delivered")`,
      };
    }

    // 4. Load order items to verify quantities
    const { data: orderItems, error: itemsError } = await supabase
      .from('sales_order_items')
      .select('id, product_id, quantity, quantity_shipped')
      .eq('sales_order_id', validatedData.sales_order_id);

    if (itemsError || !orderItems) {
      return { success: false, error: 'Erreur chargement items commande' };
    }

    // Build a map of product_id -> quantity_shipped for validation
    const itemsByProduct = new Map<string, { quantity_shipped: number }>();
    for (const item of orderItems) {
      if (item.product_id) {
        itemsByProduct.set(item.product_id, {
          quantity_shipped: item.quantity_shipped ?? 0,
        });
      }
    }

    // 5. For each returned item: validate then create stock movement
    let movementsCreated = 0;

    for (const returnItem of validatedData.items) {
      if (returnItem.quantity_returned <= 0) {
        continue;
      }

      // Verify product was in the order and quantity is valid
      const orderItem = itemsByProduct.get(returnItem.product_id);
      if (!orderItem) {
        return {
          success: false,
          error: `Produit ${returnItem.product_id} non trouvé dans la commande`,
        };
      }

      if (returnItem.quantity_returned > orderItem.quantity_shipped) {
        return {
          success: false,
          error: `Quantité retournée (${returnItem.quantity_returned}) supérieure à la quantité expédiée (${orderItem.quantity_shipped})`,
        };
      }

      // Get current stock for quantity_before/after calculation
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, stock_real, name')
        .eq('id', returnItem.product_id)
        .single();

      if (productError || !product) {
        return {
          success: false,
          error: `Produit ${returnItem.product_id} introuvable`,
        };
      }

      const stockBefore = product.stock_real ?? 0;
      const stockAfter = stockBefore + returnItem.quantity_returned;

      // INSERT stock_movement (IN movement for return)
      const notesText = validatedData.notes
        ? `Retour client - ${validatedData.reason} - Commande ${salesOrder.order_number} - ${validatedData.notes}`
        : `Retour client - ${validatedData.reason} - Commande ${salesOrder.order_number}`;

      const { error: insertError } = await supabase
        .from('stock_movements')
        .insert({
          product_id: returnItem.product_id,
          movement_type: 'IN',
          quantity_change: returnItem.quantity_returned,
          quantity_before: stockBefore,
          quantity_after: stockAfter,
          reason_code: 'return_customer',
          reference_type: 'sales_order',
          reference_id: validatedData.sales_order_id,
          notes: notesText,
          performed_by: validatedData.performed_by,
          affects_forecast: false,
        });

      if (insertError) {
        console.error('Erreur insertion mouvement retour:', insertError);
        return {
          success: false,
          error: `Erreur insertion mouvement stock: ${insertError.message}`,
        };
      }

      movementsCreated++;
    }

    if (movementsCreated === 0) {
      return {
        success: false,
        error: 'Aucun produit retourné (quantités toutes à 0)',
      };
    }

    // 6. Revalidate cache
    revalidatePath('/stocks/mouvements');
    revalidatePath('/commandes/clients');
    revalidatePath(`/commandes/clients/${validatedData.sales_order_id}`);

    return { success: true, movements_created: movementsCreated };
  } catch (error) {
    console.error('Erreur traitement retour client:', error);

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
