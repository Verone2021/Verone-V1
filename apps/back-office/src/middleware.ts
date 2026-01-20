/**
 * Middleware Back-Office - Protection des routes
 *
 * SÉCURITÉ CRITIQUE : Ce middleware protège TOUTES les 121 pages du back-office.
 * Seule la page /login est accessible sans authentification.
 *
 * Comportement:
 * - Routes protégées → Redirige vers /login si non connecté
 * - /login → Accessible sans auth (redirection côté client si connecté)
 * - / → Redirige vers /login
 *
 * @module middleware
 * @since 2026-01-07
 * @updated 2026-01-16 - Pattern officiel Supabase SSR
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

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

  // Créer client Supabase avec pattern officiel SSR
  // ⚠️ IMPORTANT: setAll() DOIT créer et RETOURNER le response (pattern officiel)
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Mettre à jour les cookies sur la requête
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          // Créer nouvelle response avec requête mise à jour
          response = NextResponse.next({
            request,
          });

          // Mettre à jour les cookies sur la réponse
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Vérifier l'authentification (rafraîchit automatiquement la session si expirée)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Route publique → laisser passer
  if (isPublicRoute(pathname)) {
    return response;
  }

  // Route PROTÉGÉE → vérifier si user connecté
  if (!user) {
    // Non authentifié → rediriger vers /login avec URL de retour
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authentifié → accès autorisé
  return response;
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
