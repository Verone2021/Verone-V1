/**
 * Middleware Back Office - Protection des routes
 *
 * SÉCURITÉ CRITIQUE : Ce middleware protège TOUTES les pages du Back Office.
 * Seules les pages explicitement publiques sont accessibles sans authentification.
 *
 * Comportement:
 * - Routes protégées → Redirige vers /login si non connecté
 * - /login → Redirige vers /dashboard si déjà connecté
 * - / → Géré par ce middleware (redirect vers /dashboard ou /login)
 *
 * @module middleware
 * @since 2026-01-22
 */

import { type NextRequest, NextResponse } from 'next/server';

import { createMiddlewareClient, updateSession } from '@/lib/supabase-middleware';

// Routes PUBLIQUES (whitelist) - TOUTES les autres sont protégées
const PUBLIC_PAGES = ['/login'];

// API publiques (webhooks, health checks)
const PUBLIC_API_PREFIXES = [
  '/api/auth', // Callbacks OAuth Supabase
  '/api/health', // Health check monitoring
  '/api/cron', // Cron jobs
  '/api/emails', // Webhooks emails
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

// Redirections URL (ancien chemin → nouveau chemin)
// Backward compatibility pour migration sidebar optimisée (2026-01-22)
const URL_REDIRECTS: Record<string, string> = {
  // LinkMe promu top-level
  '/canaux-vente/linkme': '/linkme',
  '/canaux-vente/linkme/dashboard': '/linkme',
  '/canaux-vente/linkme/enseignes': '/linkme/enseignes',
  '/canaux-vente/linkme/selections': '/linkme/selections',
  '/canaux-vente/linkme/commandes': '/linkme/commandes',
  '/canaux-vente/linkme/commandes/a-traiter': '/linkme/commandes/a-traiter',
  '/canaux-vente/linkme/catalogue': '/linkme/catalogue',
  '/canaux-vente/linkme/commissions': '/linkme/commissions',

  // Site Internet et Google Merchant promues top-level
  '/canaux-vente/site-internet': '/site-internet',
  '/canaux-vente/google-merchant': '/google-merchant',

  // Finance fusionné (Comptabilité + Facturation + Trésorerie)
  '/comptabilite': '/finance',
  '/comptabilite/transactions': '/finance/transactions',
  '/comptabilite/depenses': '/finance/depenses',
  '/comptabilite/livres': '/finance/livres',
  '/facturation': '/finance/factures',
  '/factures': '/finance/factures',
  '/tresorerie': '/finance/tresorerie',
};

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Skip pour les assets statiques et fichiers Next.js
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('.') // fichiers statiques (favicon, images, etc.)
  ) {
    return NextResponse.next();
  }

  // Redirections URL (avant vérification auth pour transparence)
  // Chercher redirection exacte OU par préfixe
  let redirectTarget: string | null = null;

  // 1. Redirection exacte
  if (URL_REDIRECTS[pathname]) {
    redirectTarget = URL_REDIRECTS[pathname];
  } else {
    // 2. Redirection par préfixe (pour /canaux-vente/linkme/selections/123 → /linkme/selections/123)
    for (const [oldPath, newPath] of Object.entries(URL_REDIRECTS)) {
      if (pathname.startsWith(oldPath + '/')) {
        redirectTarget = pathname.replace(oldPath, newPath);
        break;
      }
    }
  }

  if (redirectTarget) {
    return NextResponse.redirect(new URL(redirectTarget, request.url));
  }

  // Mettre à jour la session Supabase (rafraîchir le token si nécessaire)
  const response = await updateSession(request);

  // Route publique → laisser passer
  if (isPublicRoute(pathname)) {
    // Si sur /login et déjà connecté → dashboard
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

  // Gestion spéciale de la racine "/"
  if (pathname === '/') {
    const { supabase } = createMiddlewareClient(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
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
