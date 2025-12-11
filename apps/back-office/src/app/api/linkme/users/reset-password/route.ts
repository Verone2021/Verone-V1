/**
 * API Route: POST /api/linkme/users/reset-password
 * Réinitialise le mot de passe d'un utilisateur LinkMe via Supabase Admin API
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

// Fonction pour créer le client Admin Supabase (lazy initialization)
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const { user_id, new_password } = body;

    // Validation
    if (!user_id || !new_password) {
      return NextResponse.json(
        { message: 'ID utilisateur et nouveau mot de passe requis' },
        { status: 400 }
      );
    }

    // Validation longueur mot de passe
    if (new_password.length < 8) {
      return NextResponse.json(
        { message: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      );
    }

    // Mettre à jour le mot de passe via Admin API
    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(user_id, {
        password: new_password,
      });

    if (updateError) {
      console.error('Erreur réinitialisation mot de passe:', updateError);
      return NextResponse.json(
        { message: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès',
    });
  } catch (error) {
    console.error('Erreur API reset password:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
