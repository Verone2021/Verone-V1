/**
 * Middleware Back-Office - Protection des routes
 *
 * SÉCURITÉ CRITIQUE : Ce middleware protège TOUTES les 121 pages du back-office.
 * Seule la page /login est accessible sans authentification.
 *
 * Comportement:
 * - Routes protégées → Redirige vers /login si non connecté
 * - /login → Redirige vers /dashboard si déjà connecté
 * - / → Redirige vers /login
 *
 * @module middleware
 * @since 2026-01-07
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
  createMiddlewareClient,
  updateSession,
} from '@/lib/supabase-middleware';

// Routes PUBLIQUES (whitelist) - TOUTES les autres sont protégées
const PUBLIC_PAGES = ['/login'];

// API publiques (webhooks, cron, health checks)
const PUBLIC_API_PREFIXES = [
  '/api/auth', // Callbacks OAuth Supabase
  '/api/health', // Health check monitoring
  '/api/cron', // Cron jobs Vercel
  '/api/emails', // Webhooks emails entrants
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
    // Pour /login: laisser passer (user sera redirigé côté client si connecté)
    return response;
  }

  // Route PROTÉGÉE → vérifier l'authentification
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { supabase, response: middlewareResponse } =
    createMiddlewareClient(request);
  const {
    data: { user },
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  } = await (supabase.auth.getUser() as Promise<{ data: { user: unknown } }>);

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
