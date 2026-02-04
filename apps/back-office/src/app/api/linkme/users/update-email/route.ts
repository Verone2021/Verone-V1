/**
 * API Route: POST /api/linkme/users/update-email
 * Met à jour l'email d'un utilisateur LinkMe via Supabase Admin API
 *
 * 🔐 SECURITE: Requiert authentification admin back-office (owner/admin)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createAdminClient } from '@verone/utils/supabase/server';

import { requireBackofficeAdmin } from '@/lib/guards';

interface IUpdateEmailInput {
  user_id: string;
  new_email: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 🔐 GUARD: Vérifier authentification admin back-office
  const guardResult = await requireBackofficeAdmin(request);
  if (guardResult instanceof NextResponse) {
    return guardResult; // 401 ou 403
  }

  try {
    const supabaseAdmin = createAdminClient();
    const body = (await request.json()) as IUpdateEmailInput;
    const { user_id, new_email } = body;

    // Validation
    if (!user_id || !new_email) {
      return NextResponse.json(
        { message: 'ID utilisateur et nouvel email requis' },
        { status: 400 }
      );
    }

    // Validation format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(new_email)) {
      return NextResponse.json(
        { message: 'Format email invalide' },
        { status: 400 }
      );
    }

    // Mettre à jour l'email via Admin API
    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(user_id, {
        email: new_email,
      });

    if (updateError) {
      console.error('Erreur modification email:', updateError);
      return NextResponse.json(
        { message: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email modifié avec succès',
    });
  } catch (error) {
    console.error('Erreur API update email:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
