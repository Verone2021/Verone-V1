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
 * Dernière mise à jour : 2025-10-23 (Restauration authentification)
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

  // 1. Créer le client Supabase pour vérifier l'authentification
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          supabaseResponse.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          supabaseResponse.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

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
