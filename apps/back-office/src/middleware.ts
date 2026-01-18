/**
 * 🔐 Middleware Auth Protection - Vérone Back Office
 *
 * Middleware Next.js pour :
 * - Protection des routes authentifiées
 * - Rafraîchissement automatique de la session Supabase
 * - Gestion correcte des requêtes RSC (React Server Components)
 *
 * Pattern adapté de apps/linkme/src/middleware.ts
 */

import { type NextRequest, NextResponse } from 'next/server';
import {
  createMiddlewareClient,
  updateSession,
} from '@/lib/supabase-middleware';

// Routes publiques accessibles sans authentification
const PUBLIC_PAGES = ['/login'];

// Préfixes d'API publiques
const PUBLIC_API_PREFIXES = [
  '/api/auth', // Endpoints auth Supabase
  '/api/health', // Health checks
  '/api/cron', // Cron jobs Vercel
  '/api/emails', // Webhooks emails
];

/**
 * Vérifie si le chemin est une route publique
 */
function isPublicRoute(pathname: string): boolean {
  return (
    PUBLIC_PAGES.includes(pathname) ||
    PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

/**
 * Middleware principal
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Skip assets statiques (_next, images, fonts, etc.)
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Rafraîchir la session Supabase (gère auto le refresh token)
  const response = await updateSession(request);

  // Route publique
  if (isPublicRoute(pathname)) {
    // Si déjà authentifié et accès à /login → redirect /dashboard
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

  // Route protégée - vérifier authentification
  const { supabase, response: middlewareResponse } =
    createMiddlewareClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Non authentifié → redirect /login avec redirect param
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authentifié → laisser passer (inclut requêtes RSC avec ?_rsc)
  return middlewareResponse;
}

/**
 * Configuration matcher
 * Exclut les assets statiques Next.js et fichiers médias
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
