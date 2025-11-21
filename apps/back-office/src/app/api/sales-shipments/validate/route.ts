/**
 * API Route: Validation Expedition Sales Order
 *
 * Workflow similaire aux receptions:
 * 1. Update quantity_shipped pour chaque item
 * 2. Trigger handle_sales_order_stock() cree mouvements stock automatiquement
 * 3. Update status (partially_shipped / shipped)
 * 4. Update shipped_at, shipped_by
 * 5. Creer record shipments avec tracking (optionnel Phase 1)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { ValidateShipmentPayload } from '@verone/types';
import { createServerClient } from '@verone/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const payload: ValidateShipmentPayload = await request.json();

    // Validation payload
    if (
      !payload.sales_order_id ||
      !payload.items ||
      payload.items.length === 0
    ) {
      return NextResponse.json(
        { error: 'Donnees invalides: sales_order_id et items requis' },
        { status: 400 }
      );
    }

    // Verifier que le SO existe et est confirme
    const { data: salesOrder, error: soError } = await supabase
      .from('sales_orders')
      .select('id, order_number, status')
      .eq('id', payload.sales_order_id)
      .single();

    if (soError || !salesOrder) {
      return NextResponse.json(
        { error: 'Commande client introuvable' },
        { status: 404 }
      );
    }

    if (!['validated', 'partially_shipped'].includes(salesOrder.status)) {
      return NextResponse.json(
        {
          error: `Impossible d'expedier: commande au statut "${salesOrder.status}"`,
        },
        { status: 400 }
      );
    }

    // ETAPE 1: Update quantity_shipped pour chaque item
    for (const item of payload.items) {
      if (item.quantity_to_ship <= 0) {
        continue; // Skip items avec quantite 0
      }

      // Recuperer quantite actuelle
      const { data: currentItem, error: itemError } = await supabase
        .from('sales_order_items')
        .select('id, quantity, quantity_shipped')
        .eq('id', item.sales_order_item_id)
        .single();

      if (itemError || !currentItem) {
        console.error(`Item ${item.sales_order_item_id} introuvable`);
        continue;
      }

      const currentShipped = currentItem.quantity_shipped || 0;
      const newShipped = currentShipped + item.quantity_to_ship;

      // Verifier coherence
      if (newShipped > currentItem.quantity) {
        return NextResponse.json(
          {
            error:
              `Quantite expediee incoherente pour item ${item.sales_order_item_id}: ` +
              `${newShipped} > ${currentItem.quantity} commandee`,
          },
          { status: 400 }
        );
      }

      // Update quantity_shipped
      const { error: updateError } = await supabase
        .from('sales_order_items')
        .update({ quantity_shipped: newShipped })
        .eq('id', item.sales_order_item_id);

      if (updateError) {
        console.error('Erreur update item:', updateError);
        return NextResponse.json(
          { error: `Erreur mise a jour item: ${updateError.message}` },
          { status: 500 }
        );
      }
    }

    // ETAPE 2: Determiner nouveau statut SO
    const { data: allItems, error: allItemsError } = await supabase
      .from('sales_order_items')
      .select('quantity, quantity_shipped')
      .eq('sales_order_id', payload.sales_order_id);

    if (allItemsError) {
      console.error('Erreur recuperation items:', allItemsError);
      return NextResponse.json(
        { error: 'Erreur calcul statut' },
        { status: 500 }
      );
    }

    const allFullyShipped = allItems?.every(
      (item: any) => (item.quantity_shipped || 0) >= item.quantity
    );

    const newStatus: 'shipped' | 'partially_shipped' = allFullyShipped
      ? 'shipped'
      : 'partially_shipped';

    // ETAPE 3: Update sales_orders
    const updateData: any = {
      status: newStatus,
    };

    // TOUJOURS mettre a jour shipped_at/shipped_by pour activer les triggers
    updateData.shipped_at = payload.shipped_at || new Date().toISOString();
    updateData.shipped_by = payload.shipped_by;

    const { error: updateSOError } = await supabase
      .from('sales_orders')
      .update(updateData)
      .eq('id', payload.sales_order_id);

    if (updateSOError) {
      console.error('Erreur update SO:', updateSOError);
      return NextResponse.json(
        { error: `Erreur mise a jour commande: ${updateSOError.message}` },
        { status: 500 }
      );
    }

    // ETAPE 4 (Optionnel): Creer record shipments avec tracking
    // Phase 1: Simplifie sans carrier_info complexe
    // TODO Phase 2: Ajouter shipments table avec carrier info

    // SUCCESS!
    // Le trigger handle_sales_order_stock() s'est execute automatiquement
    // lors de l'UPDATE shipped_at - Il a cree les mouvements stock OUT

    return NextResponse.json({
      success: true,
      order_number: salesOrder.order_number,
      new_status: newStatus,
      items_updated: payload.items.filter(i => i.quantity_to_ship > 0).length,
    });
  } catch (error) {
    console.error('Erreur validation expedition:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Erreur serveur inconnue',
      },
      { status: 500 }
    );
  }
}
