/**
 * API Route: POST /api/linkme/users/reset-password
 * Réinitialise le mot de passe d'un utilisateur LinkMe via Supabase Admin API
 *
 * 🔐 SECURITE: Requiert authentification admin back-office (owner/admin)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createAdminClient } from '@verone/utils/supabase/server';

import { requireBackofficeAdmin } from '@/lib/guards';

interface IResetPasswordInput {
  user_id: string;
  new_password: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 🔐 GUARD: Vérifier authentification admin back-office
  const guardResult = await requireBackofficeAdmin(request);
  if (guardResult instanceof NextResponse) {
    return guardResult; // 401 ou 403
  }

  try {
    const supabaseAdmin = createAdminClient();
    const body = (await request.json()) as IResetPasswordInput;
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
