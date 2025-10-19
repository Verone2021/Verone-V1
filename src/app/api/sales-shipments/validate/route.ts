/**
 * 📦 API Route: Validation Expédition Sales Order
 *
 * Workflow:
 * 1. Valider payload (quantités cohérentes, stock suffisant)
 * 2. Vérifier stock disponible pour chaque item
 * 3. Créer enregistrement shipment (table shipments)
 * 4. Créer enregistrements shipment_items
 * 5. Pour chaque item: Update quantity_shipped dans sales_order_items
 * 6. Trigger handle_sales_order_stock() s'exécute automatiquement
 * 7. Update status sales_orders (partially_shipped / shipped)
 * 8. Update shipped_at, shipped_by
 * 9. Return success
 *
 * Le trigger database gère automatiquement:
 * - Création mouvements stock (OUT forecast, OUT real)
 * - Calcul différentiel (quantité_shipped - déjà traité)
 * - Update stock_real, stock_forecasted_out, stock_quantity
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ValidateShipmentPayload } from '@/types/reception-shipment'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const payload: ValidateShipmentPayload = await request.json()

    // Validation payload
    if (!payload.sales_order_id || !payload.items || payload.items.length === 0) {
      return NextResponse.json(
        { error: 'Données invalides: sales_order_id et items requis' },
        { status: 400 }
      )
    }

    if (!payload.carrier_info || !payload.carrier_info.carrier_type) {
      return NextResponse.json(
        { error: 'Informations transporteur requises' },
        { status: 400 }
      )
    }

    if (!payload.shipping_address) {
      return NextResponse.json(
        { error: 'Adresse expédition requise' },
        { status: 400 }
      )
    }

    // Vérifier que le SO existe et est confirmé
    const { data: salesOrder, error: soError } = await supabase
      .from('sales_orders')
      .select('id, so_number, status')
      .eq('id', payload.sales_order_id)
      .single()

    if (soError || !salesOrder) {
      return NextResponse.json(
        { error: 'Commande client introuvable' },
        { status: 404 }
      )
    }

    if (!['confirmed', 'partially_shipped'].includes(salesOrder.status)) {
      return NextResponse.json(
        { error: `Impossible d'expédier: commande au statut "${salesOrder.status}"` },
        { status: 400 }
      )
    }

    // ÉTAPE 1: Vérifier stock disponible pour chaque item
    for (const item of payload.items) {
      if (item.quantity_to_ship <= 0) {
        continue // Skip items avec quantité 0
      }

      // Récupérer stock actuel
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, sku, stock_real')
        .eq('id', item.product_id)
        .single()

      if (productError || !product) {
        console.error(`Produit ${item.product_id} introuvable`)
        continue
      }

      // Vérifier stock suffisant
      const stockAvailable = product.stock_real || 0
      if (item.quantity_to_ship > stockAvailable) {
        return NextResponse.json(
          {
            error: `Stock insuffisant pour ${product.sku}: ` +
                   `${item.quantity_to_ship} demandé > ${stockAvailable} disponible`
          },
          { status: 400 }
        )
      }
    }

    // ÉTAPE 2: Créer enregistrement shipment
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .insert({
        sales_order_id: payload.sales_order_id,
        shipped_at: payload.shipped_at || new Date().toISOString(),
        shipped_by: payload.shipped_by,

        // Carrier info
        carrier_type: payload.carrier_info.carrier_type,
        carrier_name: payload.carrier_info.carrier_name,
        service_name: payload.carrier_info.service_name,
        tracking_number: payload.carrier_info.tracking_number,
        tracking_url: payload.carrier_info.tracking_url,
        cost_paid_eur: payload.carrier_info.cost_paid_eur,
        cost_charged_eur: payload.carrier_info.cost_charged_eur,
        estimated_delivery_at: payload.carrier_info.estimated_delivery_at,

        // Packlink specifics
        packlink_shipment_id: payload.carrier_info.packlink_shipment_id,
        packlink_label_url: payload.carrier_info.packlink_label_url,

        // Mondial Relay specifics
        mondial_relay_point_id: payload.carrier_info.mondial_relay_point_id,
        mondial_relay_point_name: payload.carrier_info.mondial_relay_point_name,

        // Chronotruck specifics
        chronotruck_reference: payload.carrier_info.chronotruck_reference,
        chronotruck_palette_count: payload.carrier_info.chronotruck_palette_count,

        // Shipping address
        shipping_address: payload.shipping_address,

        // Notes
        notes: payload.notes,

        // Status initial
        delivery_status: 'in_transit'
      })
      .select()
      .single()

    if (shipmentError || !shipment) {
      console.error('Erreur création shipment:', shipmentError)
      return NextResponse.json(
        { error: `Erreur création expédition: ${shipmentError?.message}` },
        { status: 500 }
      )
    }

    // ÉTAPE 3: Créer shipment_items et update quantity_shipped
    for (const item of payload.items) {
      if (item.quantity_to_ship <= 0) {
        continue // Skip items avec quantité 0
      }

      // Créer shipment_item
      const { error: shipmentItemError } = await supabase
        .from('shipment_items')
        .insert({
          shipment_id: shipment.id,
          sales_order_item_id: item.sales_order_item_id,
          product_id: item.product_id,
          quantity_shipped: item.quantity_to_ship
        })

      if (shipmentItemError) {
        console.error('Erreur création shipment_item:', shipmentItemError)
        return NextResponse.json(
          { error: `Erreur création détail expédition: ${shipmentItemError.message}` },
          { status: 500 }
        )
      }

      // Récupérer quantité actuelle
      const { data: currentItem, error: itemError } = await supabase
        .from('sales_order_items')
        .select('id, quantity, quantity_shipped')
        .eq('id', item.sales_order_item_id)
        .single()

      if (itemError || !currentItem) {
        console.error(`Item ${item.sales_order_item_id} introuvable`)
        continue
      }

      const currentShipped = currentItem.quantity_shipped || 0
      const newShipped = currentShipped + item.quantity_to_ship

      // Vérifier cohérence
      if (newShipped > currentItem.quantity) {
        return NextResponse.json(
          {
            error: `Quantité expédiée incohérente pour item ${item.sales_order_item_id}: ` +
                   `${newShipped} > ${currentItem.quantity} commandée`
          },
          { status: 400 }
        )
      }

      // Update quantity_shipped
      const { error: updateError } = await supabase
        .from('sales_order_items')
        .update({ quantity_shipped: newShipped })
        .eq('id', item.sales_order_item_id)

      if (updateError) {
        console.error('Erreur update item:', updateError)
        return NextResponse.json(
          { error: `Erreur mise à jour item: ${updateError.message}` },
          { status: 500 }
        )
      }
    }

    // ÉTAPE 4: Déterminer nouveau statut SO
    // Si tous les items sont totalement expédiés → 'shipped'
    // Sinon → 'partially_shipped'
    const { data: allItems, error: allItemsError } = await supabase
      .from('sales_order_items')
      .select('quantity, quantity_shipped')
      .eq('sales_order_id', payload.sales_order_id)

    if (allItemsError) {
      console.error('Erreur récupération items:', allItemsError)
      return NextResponse.json(
        { error: 'Erreur calcul statut' },
        { status: 500 }
      )
    }

    const allFullyShipped = allItems?.every(
      item => (item.quantity_shipped || 0) >= item.quantity
    )

    const newStatus = allFullyShipped ? 'shipped' : 'partially_shipped'

    // ÉTAPE 5: Update sales_orders
    const updateData: any = {
      status: newStatus
    }

    // Si c'était la première expédition, set shipped_at et shipped_by
    if (salesOrder.status === 'confirmed') {
      updateData.shipped_at = payload.shipped_at || new Date().toISOString()
      updateData.shipped_by = payload.shipped_by
    }

    const { error: updateSOError } = await supabase
      .from('sales_orders')
      .update(updateData)
      .eq('id', payload.sales_order_id)

    if (updateSOError) {
      console.error('Erreur update SO:', updateSOError)
      return NextResponse.json(
        { error: `Erreur mise à jour commande: ${updateSOError.message}` },
        { status: 500 }
      )
    }

    // SUCCESS!
    // Le trigger handle_sales_order_stock() s'est exécuté automatiquement
    // lors de l'UPDATE status → Il a créé les mouvements stock

    return NextResponse.json({
      success: true,
      so_number: salesOrder.so_number,
      new_status: newStatus,
      shipment_id: shipment.id,
      tracking_number: payload.carrier_info.tracking_number,
      items_shipped: payload.items.filter(i => i.quantity_to_ship > 0).length
    })

  } catch (error) {
    console.error('Erreur validation expédition:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erreur serveur inconnue'
      },
      { status: 500 }
    )
  }
}
