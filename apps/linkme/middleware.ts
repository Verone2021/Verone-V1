/**
 * 🔒 Middleware Linkme - Vérone
 *
 * Middleware composé :
 * 1. App-Isolation : Vérifie que user.app_source = 'linkme'
 * 2. Auth Session : Met à jour la session Supabase (cookies)
 *
 * Règles :
 * - User avec app_source='back-office' → Redirigé vers https://admin.verone.fr
 * - User avec app_source='site-internet' → Redirigé vers https://shop.verone.fr
 * - User avec app_source='linkme' → Accès autorisé
 *
 * @module middleware
 * @since 2025-11-19 (Phase 2 Multi-Canal)
 */

import { type NextRequest, NextResponse } from 'next/server';

import { checkAppIsolation } from '@verone/utils';
// import { updateSession } from '@/lib/supabase/middleware'; // ⚠️ À activer si lib existe

export async function middleware(request: NextRequest) {
  // ========================================
  // ÉTAPE 1 : App-Isolation
  // ========================================

  const isolationResult = await checkAppIsolation(request, {
    appName: 'linkme',
    redirects: {
      'back-office':
        process.env.NEXT_PUBLIC_BACK_OFFICE_URL || 'http://localhost:3000',
      'site-internet':
        process.env.NEXT_PUBLIC_SITE_INTERNET_URL || 'http://localhost:3001',
    },
    defaultRedirect: '/login',
    excludePaths: [
      /^\/api\/public/, // API publiques
      /^\/auth/, // Pages auth (login, signup vendeurs)
      /^\/$/, // Homepage (publique ou landing vendeurs)
      /^\/_next/, // Next.js internals
      /^\/favicon\.ico/,
      /\.(?:svg|png|jpg|jpeg|gif|webp)$/, // Images statiques
    ],
    debug: process.env.NODE_ENV === 'development',
  });

  if (!isolationResult.allowed && isolationResult.redirectUrl) {
    console.warn(
      `[Middleware Linkme] User app_source=${isolationResult.userAppSource} bloqué, redirection vers ${isolationResult.redirectUrl}`
    );
    return NextResponse.redirect(new URL(isolationResult.redirectUrl));
  }

  // ========================================
  // ÉTAPE 2 : Update Session Supabase
  // ========================================

  // ⚠️ IMPORTANT : Décommenter une fois que lib/supabase/middleware.ts existe
  // return await updateSession(request);

  // Temporaire : Passer sans update session (créer lib/supabase/middleware.ts)
  return NextResponse.next();
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
