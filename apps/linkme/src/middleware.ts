/**
 * Middleware Linkme - Vérone
 *
 * Gère l'authentification et la protection des routes
 *
 * Comportement:
 * - / → Redirige vers /dashboard si connecté, sinon affiche landing page
 * - /login → Redirige vers /dashboard si connecté
 * - Routes protégées → Redirige vers /login si non connecté
 *
 * Routes protégées :
 * - /dashboard, /catalogue, /ma-selection, /mes-produits, /commandes, /commissions, /profil
 *
 * @module middleware
 * @since 2025-12-01
 * @updated 2026-01
 */

import { type NextRequest, NextResponse } from 'next/server';

import { createMiddlewareClient, updateSession } from '@/lib/supabase-server';

// Routes qui nécessitent une authentification
const PROTECTED_ROUTES = [
  '/dashboard',
  '/catalogue',
  '/ma-selection',
  '/mes-produits',
  '/commandes',
  '/commissions',
  '/profil',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip pour les assets statiques et API Next.js
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // fichiers statiques
  ) {
    return NextResponse.next();
  }

  // Mettre à jour la session Supabase (rafraîchir le token si nécessaire)
  const response = await updateSession(request);

  // Vérifier si la route est protégée
  const isProtectedRoute = PROTECTED_ROUTES.some(route =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // Vérifier la session RÉELLE avec Supabase (pas juste le cookie)
    const { supabase, response: middlewareResponse } =
      createMiddlewareClient(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Rediriger vers login avec URL de retour
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    return middlewareResponse;
  }

  // Si sur / ou /login et déjà connecté, rediriger vers dashboard
  if (pathname === '/' || pathname === '/login') {
    const { supabase } = createMiddlewareClient(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - Static assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
