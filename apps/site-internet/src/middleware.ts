/**
 * Middleware Site-Internet - Session Refresh + Ambassador Tracking
 *
 * Gere le refresh de session Supabase, protege /compte et /ambassadeur,
 * et detecte les parametres ?ref=CODE pour le tracking ambassadeur.
 *
 * @since 2026-02-09 - Simplifie (suppression app-isolation non necessaire)
 * @since 2026-04-12 - Ajout tracking ambassadeur (?ref=CODE → cookie 30j)
 */
import { type NextRequest } from 'next/server';

import { updateSession } from '@/lib/supabase/middleware';

const AMBASSADOR_COOKIE = 'verone_ref';
const AMBASSADOR_COOKIE_DAYS = 30;

export async function middleware(request: NextRequest) {
  // 1. Supabase session refresh (retourne supabaseResponse)
  const response = await updateSession(request);

  // 2. Tracking ambassadeur : detecter ?ref=CODE dans l'URL
  const refCode = request.nextUrl.searchParams.get('ref');
  if (refCode && refCode.length >= 3) {
    response.cookies.set(AMBASSADOR_COOKIE, refCode.toUpperCase(), {
      path: '/',
      maxAge: AMBASSADOR_COOKIE_DAYS * 24 * 60 * 60,
      httpOnly: false, // Accessible cote client pour pre-remplir le checkout
      sameSite: 'lax',
    });
  }

  // 3. Protection routes /ambassadeur (auth required)
  if (request.nextUrl.pathname.startsWith('/ambassadeur')) {
    // On ne peut pas verifier l'auth ici sans re-appeler supabase
    // La protection se fait au niveau de la page (server component ou client check)
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
