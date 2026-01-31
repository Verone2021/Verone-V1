/**
 * 🔒 Middleware Site-Internet - Vérone
 *
 * Middleware composé :
 * 1. App-Isolation : Vérifie que user.app_source = 'site-internet'
 * 2. Auth Session : Met à jour la session Supabase (cookies)
 *
 * Règles :
 * - User avec app_source='back-office' → Redirigé vers https://admin.verone.fr
 * - User avec app_source='linkme' → Redirigé vers https://linkme.verone.fr
 * - User avec app_source='site-internet' → Accès autorisé
 *
 * @module middleware
 * @since 2025-11-19 (Phase 2 Multi-Canal)
 */

import { type NextRequest, NextResponse } from 'next/server';

import { checkAppIsolation } from '@verone/utils';

import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // ========================================
  // ÉTAPE 1 : App-Isolation
  // ========================================

  const isolationResult = await checkAppIsolation(request, {
    appName: 'site-internet',
    redirects: {
      'back-office':
        process.env.NEXT_PUBLIC_BACK_OFFICE_URL ?? 'http://localhost:3000',
      linkme: process.env.NEXT_PUBLIC_LINKME_URL ?? 'http://localhost:3002',
    },
    defaultRedirect: '/',
    excludePaths: [
      /^\/api\/public/, // API publiques
      /^\/auth/, // Pages auth
      /^\/produits/, // Pages produits (publiques)
      /^\/collections/, // Pages collections (publiques)
      /^\/$/, // Homepage (publique)
      /^\/_next/, // Next.js internals
      /^\/favicon\.ico/,
      /\.(?:svg|png|jpg|jpeg|gif|webp)$/, // Images statiques
    ],
    debug: process.env.NODE_ENV === 'development',
  });

  if (!isolationResult.allowed && isolationResult.redirectUrl) {
    console.warn(
      `[Middleware Site-Internet] User app_source=${isolationResult.userAppSource} bloqué, redirection vers ${isolationResult.redirectUrl}`
    );
    return NextResponse.redirect(new URL(isolationResult.redirectUrl));
  }

  // ========================================
  // ÉTAPE 2 : Update Session Supabase
  // ========================================

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Static assets (.svg, .png, .jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
