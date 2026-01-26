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

import { createMiddlewareClient } from '@/lib/supabase-server';

// Routes PUBLIQUES (whitelist) - TOUTES les autres sont protégées
const PUBLIC_PAGES = [
  '/', // Landing page
  '/login', // Connexion
  '/about', // À propos
  '/contact', // Contact
  '/cgu', // CGU
  '/privacy', // Confidentialité
  '/cookies', // Cookies
];

// API publiques (webhooks, health checks)
const PUBLIC_API_PREFIXES = [
  '/api/auth', // Callbacks OAuth Supabase
  '/api/health', // Health check monitoring
  '/api/globe-items', // Sphère 3D produits (utilisée sur page login)
  '/api/page-config', // Configuration pages publiques (login, home)
];

/**
 * Vérifie si une route est publique
 */
function isPublicRoute(pathname: string): boolean {
  // Pages publiques exactes
  if (PUBLIC_PAGES.includes(pathname)) {
    return true;
  }

  // Routes dynamiques publiques (white-label catalogues, delivery links)
  if (/^\/s\/[^/]+$/.test(pathname)) {
    return true; // /s/[id]
  }
  if (/^\/delivery-info\/[^/]+$/.test(pathname)) {
    return true; // /delivery-info/[token]
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

  // Créer UNE SEULE instance Supabase pour toute la requête
  const { supabase, response } = createMiddlewareClient(request);

  // Rafraîchir session UNE FOIS au début (déclenche refresh si nécessaire)
  try {
    await supabase.auth.getSession();
  } catch (error) {
    // Log server-side uniquement (pas dans browser console)
    console.error('[Middleware] Session refresh failed:', error);
    // Continue silencieusement → user sera redirigé vers /login si nécessaire
  }

  // Récupérer l'utilisateur (réutilise la même instance)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Route publique → vérifier si l'utilisateur est connecté ET a un rôle LinkMe
  if (isPublicRoute(pathname)) {
    // Si connecté sur une page marketing → vérifier le rôle LinkMe avant de rediriger
    // IMPORTANT: Ne pas rediriger si l'utilisateur n'a pas de rôle LinkMe
    // (cas où l'utilisateur est connecté au back-office mais pas à LinkMe)
    if (user && PUBLIC_PAGES.includes(pathname)) {
      // Vérifier si l'utilisateur a un rôle LinkMe actif
      const { data: linkmeRole } = await supabase
        .from('user_app_roles')
        .select('id')
        .eq('user_id', user.id)
        .eq('app', 'linkme')
        .eq('is_active', true)
        .maybeSingle();

      // Rediriger vers dashboard SEULEMENT si rôle LinkMe actif
      if (linkmeRole) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      // Sinon: laisser sur la page publique (login) pour se connecter avec un autre compte
    }

    return response;
  }

  // Route PROTÉGÉE → vérifier l'authentification
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
