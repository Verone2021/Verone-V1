import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * DELETE /api/stock-movements/[movementId]
 * Annule un mouvement de stock
 *
 * IMPORTANT: La suppression déclenche automatiquement:
 * - Recalcul du stock produit via trigger
 * - Recalcul des alertes via trigger
 * - Synchronisation complète du système
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { movementId: string } }
) {
  try {
    const supabase = await createClient()
    const { movementId } = params

    // Vérifier que le mouvement existe et récupérer ses infos
    const { data: movement, error: fetchError } = await supabase
      .from('stock_movements')
      .select('id, product_id, movement_type, quantity_change, performed_at, affects_forecast, reference_type, reference_id')
      .eq('id', movementId)
      .single()

    if (fetchError || !movement) {
      return NextResponse.json(
        { error: 'Mouvement non trouvé' },
        { status: 404 }
      )
    }

    // Bloquer suppression des mouvements prévisionnels (sécurité)
    if (movement.affects_forecast) {
      return NextResponse.json(
        { error: 'Impossible d\'annuler un mouvement prévisionnel' },
        { status: 400 }
      )
    }

    // Bloquer suppression des mouvements liés à des commandes
    // Seuls les mouvements manuels peuvent être annulés
    const isManualMovement = movement.reference_type === 'manual_adjustment' ||
                            movement.reference_type === 'manual_entry' ||
                            !movement.reference_type

    if (!isManualMovement) {
      return NextResponse.json(
        { error: 'Impossible d\'annuler un mouvement lié à une commande. Seuls les mouvements manuels peuvent être annulés.' },
        { status: 400 }
      )
    }

    // Supprimer le mouvement
    // Les triggers PostgreSQL se chargeront de:
    // 1. Recalculer le stock produit
    // 2. Mettre à jour les alertes
    // 3. Synchroniser toutes les vues
    const { error: deleteError } = await supabase
      .from('stock_movements')
      .delete()
      .eq('id', movementId)

    if (deleteError) {
      console.error('Erreur suppression mouvement:', deleteError)
      return NextResponse.json(
        { error: 'Erreur lors de l\'annulation du mouvement' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Mouvement annulé avec succès',
      movement: {
        id: movement.id,
        product_id: movement.product_id,
        movement_type: movement.movement_type,
        quantity_change: movement.quantity_change
      }
    })

  } catch (error) {
    console.error('Erreur API DELETE stock-movements:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de l\'annulation' },
      { status: 500 }
    )
  }
}
