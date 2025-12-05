/**
 * API Route: POST /api/linkme/selections/delete
 * Supprime une sélection LinkMe via Supabase Admin API (bypass RLS)
 * Les items sont supprimés en CASCADE automatiquement
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

// Client Admin Supabase (avec service_role key pour bypasser RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { selection_id } = body;

    // Validation
    if (!selection_id) {
      return NextResponse.json(
        { message: 'ID de la sélection requis' },
        { status: 400 }
      );
    }

    // Vérifier que la sélection existe
    const { data: selection, error: selectError } = await supabaseAdmin
      .from('linkme_selections')
      .select('id, name, status')
      .eq('id', selection_id)
      .single();

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
      .eq('id', selection_id);

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
      deleted_selection: {
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
