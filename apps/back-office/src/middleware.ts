/**
 * 🔐 Middleware Authentification + Protection Routes - Phase 1
 *
 * Combine deux fonctionnalités :
 * 1. Authentification Supabase : Protection routes nécessitant connexion
 * 2. Feature Flags Phase 1 : Blocage modules Phase 2+ non déployés
 *
 * ✅ Modules accessibles (Phase 1) :
 * - /dashboard
 * - /profile
 * - /organisation, /contacts-organisations
 * - /admin
 * - /parametres
 * - /login (authentification)
 *
 * ❌ Modules bloqués (Phase 2+) :
 * - /produits (catalogue, sourcing)
 * - /stocks
 * - /commandes
 * - /ventes
 * - /interactions, /consultations
 * - /canaux-vente
 * - /finance, /factures, /tresorerie
 * - /notifications
 * - /tests-essentiels
 *
 * Dernière mise à jour : 2025-12-11 (Fix: Migration vers nouvelle API cookies @supabase/ssr)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createServerClient } from '@supabase/ssr';

// Routes protégées nécessitant authentification
const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/organisation',
  '/contacts-organisations',
  '/admin',
  '/parametres',
  // Phase 2+ modules (restaurés depuis d4b6e37)
  '/produits',
  '/stocks',
  '/commandes',
  '/ventes',
  '/consultations',
  '/canaux-vente',
  '/finance',
  '/factures',
  '/tresorerie',
];

// Routes publiques (pas d'authentification requise)
const PUBLIC_ROUTES = ['/login', '/', '/module-inactive'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 0. Autoriser assets statiques et API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 🔒 SÉCURITÉ: Vérifier que les variables d'environnement Supabase existent
  // Évite MIDDLEWARE_INVOCATION_FAILED si variables manquantes sur Vercel
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ MIDDLEWARE ERROR: Variables Supabase manquantes', {
      supabaseUrl: !!supabaseUrl,
      supabaseAnonKey: !!supabaseAnonKey,
    });
    // Continuer sans auth plutôt que crasher
    return NextResponse.next();
  }

  // 1. Créer le client Supabase avec la NOUVELLE API cookies (getAll/setAll)
  // Compatible avec @supabase/ssr ^0.5.0+
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  // IMPORTANT: Vérifier l'authentification
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  const isAuthenticated = !error && !!user;

  // 2. Protection authentification : routes protégées nécessitent connexion
  const isProtectedRoute = PROTECTED_ROUTES.some(route =>
    pathname.startsWith(route)
  );
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Si déjà authentifié sur page login → redirection dashboard
  if (pathname === '/login' && isAuthenticated) {
    const redirectUrl =
      request.nextUrl.searchParams.get('redirect') || '/dashboard';
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // 5. Route racine "/" → rediriger vers login (pas dashboard!)
  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // IMPORTANT: Retourner supabaseResponse pour conserver les cookies
  return supabaseResponse;
}

// Configuration matcher pour appliquer middleware
export const config = {
  matcher: [
    /*
     * Matcher tous chemins sauf :
     * - API routes internes Next.js (_next)
     * - Static assets
     * - Metadata files (favicon, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
