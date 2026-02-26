/**
 * API Route: POST /api/linkme/selections/toggle-item-visibility
 * Toggle visibility of a product in a LinkMe selection (staff only)
 *
 * When is_hidden_by_staff = true, the product remains in the selection
 * but is excluded from public pages (RPCs filter it out).
 * The affiliate can still see it (greyed out) in their dashboard.
 *
 * @security Requires back-office admin authentication
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createAdminClient } from '@verone/utils/supabase/server';

import { requireBackofficeAdmin } from '@/lib/guards';
import type { Database } from '@verone/types';

type LinkmeSelectionItemRow =
  Database['public']['Tables']['linkme_selection_items']['Row'];

interface IToggleVisibilityInput {
  item_id: string;
  is_hidden: boolean;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Guard: back-office admin only
  const guardResult = await requireBackofficeAdmin(request);
  if (guardResult instanceof NextResponse) {
    return guardResult;
  }

  try {
    const supabaseAdmin = createAdminClient();
    const body = (await request.json()) as IToggleVisibilityInput;
    const { item_id: itemId, is_hidden: isHidden } = body;

    // Validation
    if (!itemId) {
      return NextResponse.json(
        { message: 'item_id est requis' },
        { status: 400 }
      );
    }

    if (typeof isHidden !== 'boolean') {
      return NextResponse.json(
        { message: 'is_hidden doit être un booléen' },
        { status: 400 }
      );
    }

    // Verify item exists
    const { data: existingItem, error: fetchError } = await supabaseAdmin
      .from('linkme_selection_items')
      .select('id, selection_id, product_id, is_hidden_by_staff')
      .eq('id', itemId)
      .single<
        Pick<
          LinkmeSelectionItemRow,
          'id' | 'selection_id' | 'product_id' | 'is_hidden_by_staff'
        >
      >();

    if (fetchError || !existingItem) {
      return NextResponse.json(
        { message: 'Item introuvable' },
        { status: 404 }
      );
    }

    // Update visibility
    const { error: updateError } = await supabaseAdmin
      .from('linkme_selection_items')
      .update({
        is_hidden_by_staff: isHidden,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId);

    if (updateError) {
      console.error('Erreur toggle visibility:', updateError);
      return NextResponse.json(
        { message: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: isHidden
        ? 'Produit masqué de la sélection publique'
        : 'Produit visible dans la sélection publique',
      item_id: itemId,
      is_hidden_by_staff: isHidden,
    });
  } catch (error) {
    console.error('Erreur API toggle-item-visibility:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
