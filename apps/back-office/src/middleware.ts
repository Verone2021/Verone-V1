/**
 * 🔐 Middleware Auth Protection - Vérone Back Office
 *
 * Middleware Next.js pour :
 * - Protection des routes authentifiées
 * - Rafraîchissement automatique de la session Supabase
 * - Gestion correcte des requêtes RSC (React Server Components)
 * - Fail-closed: erreur middleware = redirect /login (routes protégées)
 *
 * Pattern adapté de apps/linkme/src/middleware.ts
 */

import { type NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import {
  createMiddlewareClient,
  updateSession,
  SupabaseEnvError,
} from './lib/supabase-middleware';

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
 * Gère les erreurs middleware de façon FAIL-CLOSED
 * - Routes publiques: laisse passer (l'utilisateur peut voir /login)
 * - Routes protégées: redirect /login (sécurité fail-closed)
 */
function handleMiddlewareError(
  error: unknown,
  request: NextRequest,
  pathname: string
): NextResponse {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorName = error instanceof Error ? error.name : 'UnknownError';

  // Capturer dans Sentry avec contexte Edge
  Sentry.captureException(error, {
    tags: {
      middleware: 'auth',
      pathname,
      isPublic: String(isPublicRoute(pathname)),
    },
    extra: {
      errorName,
      errorMessage,
      url: request.url,
    },
  });

  // Console log pour Vercel Runtime Logs
  console.error(`[Middleware Error] ${errorName}: ${errorMessage}`, {
    pathname,
    url: request.url,
  });

  // Routes publiques: laisser passer (fail-open pour /login uniquement)
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Routes protégées: redirect /login (FAIL-CLOSED sécurisé)
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', pathname);
  loginUrl.searchParams.set('error', 'middleware_error');
  return NextResponse.redirect(loginUrl);
}

/**
 * Middleware principal avec gestion d'erreurs fail-closed
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Skip assets statiques (_next, images, fonts, etc.)
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }

  try {
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
  } catch (error) {
    // FAIL-CLOSED: erreur = redirect /login pour routes protégées
    return handleMiddlewareError(error, request, pathname);
  }
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
