/**
 * API Route: POST /api/linkme/users/update-email
 * Met à jour l'email d'un utilisateur LinkMe via Supabase Admin API
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

// Client Admin Supabase (avec service_role key)
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
