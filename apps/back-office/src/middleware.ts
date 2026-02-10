/**
 * Middleware Back-Office - App Isolation via shared enforceAppIsolation
 *
 * Utilise le middleware centralisé @verone/utils pour:
 * 1. Refresh session Supabase
 * 2. Vérifier authentification sur routes protégées
 * 3. Vérifier rôle back-office actif dans user_app_roles
 * 4. Redirect vers /unauthorized si authentifié MAIS sans rôle back-office
 *
 * @module middleware
 * @since 2026-02-10 - Cross-app protection pattern
 */

import type { NextRequest, NextResponse } from 'next/server';

import { enforceAppIsolation } from '@verone/utils/middleware/enforce-app-isolation';

export async function middleware(request: NextRequest): Promise<NextResponse> {
  return enforceAppIsolation(request, {
    appName: 'back-office',
    loginPath: '/login',
    unauthorizedPath: '/unauthorized',
    publicRoutes: [
      // Pages publiques exactes
      /^\/$/,
      /^\/login$/,
      /^\/unauthorized$/,
      // Assets statiques
      /^\/_next/,
      /\.\w+$/,
    ],
  });
}

// Matcher: exclut les assets statiques et fichiers Next.js
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
