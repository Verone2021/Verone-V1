/**
 * Middleware Back Office - Ultra-Minimaliste (Conforme Supabase SSR 2026)
 *
 * SÉCURITÉ CRITIQUE : Ce middleware protège TOUTES les pages du Back Office.
 * Seules les pages explicitement publiques sont accessibles sans authentification.
 *
 * Pattern officiel Supabase SSR:
 * 1. Créer le client Supabase
 * 2. Appeler getUser() directement (PAS getSession() avant!)
 * 3. Retourner la response avec cookies synchronisés
 *
 * @module middleware
 * @since 2026-01-22
 * @updated 2026-01-27 - Refonte complète selon best practices Supabase
 */

import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

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
// Backward compatibility pour anciennes URLs
const URL_REDIRECTS: Record<string, string> = {
  // Finance fusionné (Comptabilité + Facturation + Trésorerie)
  '/comptabilite': '/finance',
  '/comptabilite/transactions': '/finance/transactions',
  '/comptabilite/depenses': '/finance/depenses',
  '/comptabilite/livres': '/finance/livres',
  // Note: /factures existe directement (pas de redirect vers /finance/factures)
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

  // Créer la response initiale
  let supabaseResponse = NextResponse.next({ request });

  // Créer le client Supabase avec gestion des cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Mettre à jour les cookies de la request
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          // Recréer la response avec les cookies mis à jour
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // CRITIQUE: Appeler getUser() directement (PAS getSession() avant!)
  // Documentation Supabase: "Avoid writing any logic between createServerClient and getUser()"
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Route publique → laisser passer (avec cookies rafraîchis)
  if (isPublicRoute(pathname)) {
    // Si connecté sur /login → rediriger vers /dashboard
    if (user && pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return supabaseResponse;
  }

  // Gestion spéciale de la racine "/"
  if (pathname === '/') {
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Route PROTÉGÉE sans authentification → rediriger vers /login
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authentifié → accès autorisé
  return supabaseResponse;
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
