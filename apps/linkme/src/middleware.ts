/**
 * Middleware LinkMe - App Isolation via shared enforceAppIsolation
 *
 * Utilise le middleware centralisé @verone/utils pour:
 * 1. Refresh session Supabase
 * 2. Vérifier authentification sur routes protégées
 * 3. Vérifier rôle LinkMe actif dans user_app_roles
 *
 * @module middleware
 * @since 2025-12-01
 * @updated 2026-02-09 - Refactored to use shared enforceAppIsolation (DRY)
 */

import type { NextRequest, NextResponse } from 'next/server';

import { enforceAppIsolation } from '@verone/utils/middleware/enforce-app-isolation';

export async function middleware(request: NextRequest): Promise<NextResponse> {
  return enforceAppIsolation(request, {
    appName: 'linkme',
    loginPath: '/login',
    publicRoutes: [
      // Pages publiques exactes
      /^\/$/,
      /^\/login$/,
      /^\/about$/,
      /^\/contact$/,
      /^\/cgu$/,
      /^\/privacy$/,
      /^\/cookies$/,
      // Routes dynamiques publiques (catalogues white-label, delivery links)
      /^\/s\//,
      /^\/delivery-info\//,
      // API publiques
      /^\/api\/auth/,
      /^\/api\/health/,
      /^\/api\/globe-items/,
      /^\/api\/page-config/,
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
