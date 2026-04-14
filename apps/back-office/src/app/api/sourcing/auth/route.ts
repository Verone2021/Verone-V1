import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createServerClient } from '@verone/utils/supabase/server';

/**
 * GET /api/sourcing/auth
 *
 * Retourne le token de session Supabase pour l'extension Chrome.
 * L'extension appelle cette route depuis le back-office (meme domaine = cookies OK)
 * puis stocke le token pour les appels cross-origin.
 *
 * CORS: autorise l'origine de l'extension Chrome.
 */
export async function GET(_request: NextRequest) {
  const supabase = await createServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Non connecte' }, { status: 401 });
  }

  return NextResponse.json({
    access_token: session.access_token,
    user_email: session.user.email,
    expires_at: session.expires_at,
  });
}
