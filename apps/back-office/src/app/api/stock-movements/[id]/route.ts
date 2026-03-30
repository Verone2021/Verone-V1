/**
 * 🗑️ API Route: Suppression Mouvement Stock Manuel
 *
 * DELETE /api/stock-movements/[id]
 * Supprime un mouvement de stock manuel (ajustement inventaire uniquement)
 * ⚠️ Recalcul stock automatique via trigger maintain_stock_totals()
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createServerClient } from '@verone/utils/supabase/server';

interface MovementDeleteDetails {
  reason?: string;
  reference_type?: string;
}

interface DeleteResponse {
  success: boolean;
  message?: string;
  error?: string;
  details?: MovementDeleteDetails | string;
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
function errorJson(
  error: string,
  status: number,
  details?: MovementDeleteDetails | string
) {
  return NextResponse.json<DeleteResponse>(
    { success: false, error, details },
    { status }
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<DeleteResponse>> {
  try {
    const resolvedParams = await params;
    const movementId = resolvedParams.id;

    console.warn(`[API] Delete stock movement request for ID: ${movementId}`);

    // 1. Validation paramètre
    if (!movementId) return errorJson('ID mouvement manquant', 400);

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
      return errorJson('Mouvement de stock introuvable', 404);
    }

    if (movement.affects_forecast) {
      return errorJson(
        'Impossible de supprimer un mouvement prévisionnel',
        403,
        {
          reason:
            'Les mouvements prévisionnels ne peuvent pas être supprimés manuellement',
        }
      );
    }

    if (
      movement.reference_type &&
      movement.reference_type !== 'manual_adjustment' &&
      movement.reference_type !== 'manual_entry'
    ) {
      return errorJson(
        'Impossible de supprimer un mouvement lié à une commande',
        403,
        {
          reason: 'Ce mouvement a été créé automatiquement par une commande',
          reference_type: movement.reference_type,
        }
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
      return errorJson(
        'Erreur lors de la suppression du mouvement',
        500,
        deleteError.message
      );
    }

    return NextResponse.json({
      success: true,
      message:
        'Mouvement supprimé avec succès. Le stock a été recalculé automatiquement.',
    });
  } catch (error: unknown) {
    console.error('[API] Delete stock movement failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur interne du serveur',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
