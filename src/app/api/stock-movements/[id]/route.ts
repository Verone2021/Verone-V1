/**
 * 🗑️ API Route: Suppression Mouvement Stock Manuel
 *
 * DELETE /api/stock-movements/[id]
 * Supprime un mouvement de stock manuel (ajustement inventaire uniquement)
 * ⚠️ Recalcul stock automatique via trigger maintain_stock_totals()
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createServerClient } from '@/lib/supabase/server';

interface DeleteResponse {
  success: boolean;
  message?: string;
  error?: string;
  details?: any;
}

/**
 * DELETE - Supprime un mouvement de stock manuel
 *
 * Règles métier :
 * - Seulement mouvements manuels (manual_adjustment, manual_entry)
 * - Pas de mouvements prévisionnels (affects_forecast = false)
 * - Pas de mouvements liés à des commandes
 * - Triggers database recalculent stock automatiquement
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<DeleteResponse>> {
  try {
    const resolvedParams = await params;
    const movementId = resolvedParams.id;

    console.log(`[API] Delete stock movement request for ID: ${movementId}`);

    // 1. Validation paramètre
    if (!movementId) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID mouvement manquant',
        },
        { status: 400 }
      );
    }

    // 2. Initialisation Supabase
    const supabase = await createServerClient();

    // 3. Récupération du mouvement pour validation
    const { data: movement, error: fetchError } = await supabase
      .from('stock_movements')
      .select(
        'id, reference_type, affects_forecast, movement_type, quantity_change'
      )
      .eq('id', movementId)
      .single();

    if (fetchError || !movement) {
      console.error('[API] Movement not found:', fetchError);
      return NextResponse.json(
        {
          success: false,
          error: 'Mouvement de stock introuvable',
        },
        { status: 404 }
      );
    }

    // 4. Validation règles métier

    // 4.1 - Interdire suppression mouvements prévisionnels
    if (movement.affects_forecast) {
      return NextResponse.json(
        {
          success: false,
          error: 'Impossible de supprimer un mouvement prévisionnel',
          details: {
            reason:
              'Les mouvements prévisionnels ne peuvent pas être supprimés manuellement',
          },
        },
        { status: 403 }
      );
    }

    // 4.2 - Interdire suppression mouvements liés à des commandes
    if (
      movement.reference_type &&
      movement.reference_type !== 'manual_adjustment' &&
      movement.reference_type !== 'manual_entry'
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Impossible de supprimer un mouvement lié à une commande',
          details: {
            reason: 'Ce mouvement a été créé automatiquement par une commande',
            reference_type: movement.reference_type,
          },
        },
        { status: 403 }
      );
    }

    // 5. Suppression du mouvement
    // ⚠️ Les triggers database recalculent automatiquement :
    //    - stock_real du produit (trigger_maintain_stock_totals AFTER DELETE)
    //    - stock_forecasted_in/out si applicable
    //    - alertes de stock
    const { error: deleteError } = await supabase
      .from('stock_movements')
      .delete()
      .eq('id', movementId);

    if (deleteError) {
      console.error('[API] Delete movement failed:', deleteError);
      return NextResponse.json(
        {
          success: false,
          error: 'Erreur lors de la suppression du mouvement',
          details: deleteError.message,
        },
        { status: 500 }
      );
    }

    // 6. Log de succès
    console.log(
      `[API] Movement ${movementId} deleted successfully. Stock recalculated automatically by triggers.`
    );

    // 7. Réponse de succès
    return NextResponse.json({
      success: true,
      message:
        'Mouvement supprimé avec succès. Le stock a été recalculé automatiquement.',
    });
  } catch (error: any) {
    console.error('[API] Delete stock movement failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur interne du serveur',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
