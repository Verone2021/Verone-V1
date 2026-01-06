/**
 * API Route: POST /api/linkme/selections/delete
 * Supprime une sélection LinkMe via Supabase Admin API (bypass RLS)
 * Les items sont supprimés en CASCADE automatiquement
 *
 * 🔐 SECURITE: Requiert authentification admin back-office (owner/admin)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createAdminClient } from '@verone/utils/supabase/server';

import { requireBackofficeAdmin } from '@/lib/guards';
import type { Database } from '@/types/supabase';

type LinkmeSelectionRow =
  Database['public']['Tables']['linkme_selections']['Row'];

interface IDeleteSelectionInput {
  selection_id: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 🔐 GUARD: Vérifier authentification admin back-office
  const guardResult = await requireBackofficeAdmin(request);
  if (guardResult instanceof NextResponse) {
    return guardResult; // 401 ou 403
  }

  try {
    const supabaseAdmin = createAdminClient();
    const body = (await request.json()) as IDeleteSelectionInput;
    const { selection_id: selectionId } = body;

    // Validation
    if (!selectionId) {
      return NextResponse.json(
        { message: 'ID de la sélection requis' },
        { status: 400 }
      );
    }

    // Vérifier que la sélection existe
    const { data: selection, error: selectError } = await supabaseAdmin
      .from('linkme_selections')
      .select('id, name')
      .eq('id', selectionId)
      .single<Pick<LinkmeSelectionRow, 'id' | 'name'>>();

    if (selectError || !selection) {
      return NextResponse.json(
        { message: 'Sélection introuvable' },
        { status: 404 }
      );
    }

    // Supprimer la sélection (les items sont supprimés en CASCADE)
    const { error: deleteError } = await supabaseAdmin
      .from('linkme_selections')
      .delete()
      .eq('id', selectionId);

    if (deleteError) {
      console.error('Erreur suppression sélection:', deleteError);
      return NextResponse.json(
        { message: deleteError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Sélection "${selection.name}" supprimée avec succès`,
      deletedSelection: {
        id: selection.id,
        name: selection.name,
      },
    });
  } catch (error) {
    console.error('Erreur API delete selection:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
