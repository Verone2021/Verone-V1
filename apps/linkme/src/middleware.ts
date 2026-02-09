/**
 * Middleware LinkMe - Ultra-Minimaliste (Conforme Supabase SSR 2026)
 *
 * SÉCURITÉ: Ce middleware protège toutes les routes non-publiques.
 * Il vérifie UNIQUEMENT l'authentification (pas les rôles).
 *
 * La vérification du rôle LinkMe se fait dans AuthContext (client-side).
 *
 * Pattern officiel Supabase SSR:
 * 1. Créer le client Supabase
 * 2. Appeler getUser() directement (PAS getSession() avant!)
 * 3. Retourner la response avec cookies synchronisés
 *
 * @module middleware
 * @since 2025-12-01
 * @updated 2026-01-27 - Refonte complète selon best practices Supabase
 */

import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

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
  if (pathname.startsWith('/s/')) {
    return true; // /s/[id] et toutes les sous-routes /s/[id]/*
  }
  if (pathname.startsWith('/delivery-info/')) {
    return true; // /delivery-info/[token] et sous-routes
  }

  // API publiques (préfixes)
  if (PUBLIC_API_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return true;
  }

  return false;
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Skip assets statiques et fichiers Next.js
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('.') // fichiers statiques (favicon, images, etc.)
  ) {
    return NextResponse.next();
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
  // NB: On ne redirige PAS /login → /dashboard ici, meme si user est authentifie.
  // Un user peut etre authentifie sur une AUTRE app (back-office) sans role LinkMe.
  // La redirection aveugle creait une boucle infinie avec le layout qui rejette
  // les users sans role LinkMe vers /login. La page login gere sa propre logique.
  if (isPublicRoute(pathname)) {
    return supabaseResponse;
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
