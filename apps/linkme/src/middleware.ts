/**
 * Middleware Linkme - Protection des routes
 *
 * SÉCURITÉ CRITIQUE : Ce middleware protège TOUTES les pages de LinkMe.
 * Seules les pages explicitement publiques sont accessibles sans authentification.
 *
 * Comportement:
 * - Routes protégées → Redirige vers /login si non connecté
 * - /login → Redirige vers /dashboard si déjà connecté
 * - / → Redirige vers /login (landing page publique ou login)
 *
 * @module middleware
 * @since 2025-12-01
 * @updated 2026-01-08 - Passage à l'approche WHITELIST pour sécurité
 */

import { type NextRequest, NextResponse } from 'next/server';

import { createMiddlewareClient, updateSession } from '@/lib/supabase-server';

// Routes PUBLIQUES (whitelist) - TOUTES les autres sont protégées
const PUBLIC_PAGES = ['/login'];

// API publiques (webhooks, health checks)
const PUBLIC_API_PREFIXES = [
  '/api/auth', // Callbacks OAuth Supabase
  '/api/health', // Health check monitoring
];

/**
 * Vérifie si une route est publique
 */
function isPublicRoute(pathname: string): boolean {
  // Pages publiques exactes
  if (PUBLIC_PAGES.includes(pathname)) {
    return true;
  }

  // API publiques (préfixes)
  if (PUBLIC_API_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return true;
  }

  return false;
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Skip pour les assets statiques et fichiers Next.js
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('.') // fichiers statiques (favicon, images, etc.)
  ) {
    return NextResponse.next();
  }

  // Route racine "/" → toujours rediriger vers /login
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Mettre à jour la session Supabase (rafraîchir le token si nécessaire)
  const response = await updateSession(request);

  // Route publique → laisser passer
  if (isPublicRoute(pathname)) {
    // Si sur /login et déjà connecté → rediriger vers dashboard
    if (pathname === '/login') {
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

  // Route PROTÉGÉE → vérifier l'authentification
  const { supabase, response: middlewareResponse } =
    createMiddlewareClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Non authentifié → rediriger vers /login avec URL de retour
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authentifié → accès autorisé
  return middlewareResponse;
}

// Matcher: exclut les assets statiques et fichiers Next.js
export const config = {
  matcher: [
    /*
     * Match tous les chemins SAUF :
     * - _next/static (fichiers statiques Next.js)
     * - _next/image (optimisation images)
     * - favicon.ico
     * - Assets statiques (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
