/**
 * 📦 API Route: Validation Réception Purchase Order
 *
 * Workflow:
 * 1. Valider payload (quantités cohérentes)
 * 2. Pour chaque item: Update quantity_received dans purchase_order_items
 * 3. Trigger handle_purchase_order_forecast() s'exécute automatiquement
 * 4. Update status purchase_orders (partially_received / received)
 * 5. Update received_at, received_by
 * 6. Return success
 *
 * Le trigger database gère automatiquement:
 * - Création mouvements stock (OUT forecast, IN real)
 * - Calcul différentiel (quantité_received - déjà traité)
 * - Update stock_real, stock_forecasted_in, stock_quantity
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createServerClient } from '@verone/utils/supabase/server';
import type { ValidateReceptionPayload } from '@verone/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const payload: ValidateReceptionPayload = await request.json();

    // Validation payload
    if (
      !payload.purchase_order_id ||
      !payload.items ||
      payload.items.length === 0
    ) {
      return NextResponse.json(
        { error: 'Données invalides: purchase_order_id et items requis' },
        { status: 400 }
      );
    }

    // Vérifier que le PO existe et est confirmé
    const { data: purchaseOrder, error: poError } = await supabase
      .from('purchase_orders')
      .select('id, po_number, status')
      .eq('id', payload.purchase_order_id)
      .single();

    if (poError || !purchaseOrder) {
      return NextResponse.json(
        { error: 'Commande fournisseur introuvable' },
        { status: 404 }
      );
    }

    if (!['confirmed', 'partially_received'].includes(purchaseOrder.status)) {
      return NextResponse.json(
        {
          error: `Impossible de réceptionner: commande au statut "${purchaseOrder.status}"`,
        },
        { status: 400 }
      );
    }

    // ÉTAPE 1: Update quantity_received pour chaque item
    for (const item of payload.items) {
      if (item.quantity_to_receive <= 0) {
        continue; // Skip items avec quantité 0
      }

      // Récupérer quantité actuelle
      const { data: currentItem, error: itemError } = await supabase
        .from('purchase_order_items')
        .select('id, quantity, quantity_received')
        .eq('id', item.purchase_order_item_id)
        .single();

      if (itemError || !currentItem) {
        console.error(`Item ${item.purchase_order_item_id} introuvable`);
        continue;
      }

      const currentReceived = currentItem.quantity_received || 0;
      const newReceived = currentReceived + item.quantity_to_receive;

      // Vérifier cohérence
      if (newReceived > currentItem.quantity) {
        return NextResponse.json(
          {
            error:
              `Quantité reçue incohérente pour item ${item.purchase_order_item_id}: ` +
              `${newReceived} > ${currentItem.quantity} commandée`,
          },
          { status: 400 }
        );
      }

      // Update quantity_received
      const { error: updateError } = await supabase
        .from('purchase_order_items')
        .update({ quantity_received: newReceived })
        .eq('id', item.purchase_order_item_id);

      if (updateError) {
        console.error('Erreur update item:', updateError);
        return NextResponse.json(
          { error: `Erreur mise à jour item: ${updateError.message}` },
          { status: 500 }
        );
      }
    }

    // ÉTAPE 2: Déterminer nouveau statut PO
    // Si tous les items sont totalement reçus → 'received'
    // Sinon → 'partially_received'
    const { data: allItems, error: allItemsError } = await supabase
      .from('purchase_order_items')
      .select('quantity, quantity_received')
      .eq('purchase_order_id', payload.purchase_order_id);

    if (allItemsError) {
      console.error('Erreur récupération items:', allItemsError);
      return NextResponse.json(
        { error: 'Erreur calcul statut' },
        { status: 500 }
      );
    }

    const allFullyReceived = allItems?.every(
      item => (item.quantity_received || 0) >= item.quantity
    );

    const newStatus = allFullyReceived ? 'received' : 'partially_received';

    // ÉTAPE 3: Update purchase_orders
    const updateData: any = {
      status: newStatus,
    };

    // ✅ FIX: TOUJOURS mettre à jour received_at/received_by pour activer les triggers
    // Le trigger handle_purchase_order_forecast() nécessite ces champs pour créer les mouvements réels
    updateData.received_at = payload.received_at || new Date().toISOString();
    updateData.received_by = payload.received_by;

    const { error: updatePOError } = await supabase
      .from('purchase_orders')
      .update(updateData)
      .eq('id', payload.purchase_order_id);

    if (updatePOError) {
      console.error('Erreur update PO:', updatePOError);
      return NextResponse.json(
        { error: `Erreur mise à jour commande: ${updatePOError.message}` },
        { status: 500 }
      );
    }

    // SUCCESS!
    // Le trigger handle_purchase_order_forecast() s'est exécuté automatiquement
    // lors de l'UPDATE status → Il a créé les mouvements stock

    return NextResponse.json({
      success: true,
      po_number: purchaseOrder.po_number,
      new_status: newStatus,
      items_updated: payload.items.filter(i => i.quantity_to_receive > 0)
        .length,
    });
  } catch (error) {
    console.error('Erreur validation réception:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Erreur serveur inconnue',
      },
      { status: 500 }
    );
  }
}
