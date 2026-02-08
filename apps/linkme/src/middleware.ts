/**
 * Middleware LinkMe — App Isolation
 *
 * Single wall: user must have an active role in user_app_roles
 * for app='linkme'. Otherwise → sign out + redirect to /login.
 *
 * Public routes (landing, catalogues, delivery links, APIs) pass through.
 *
 * @module middleware
 * @since 2026-02-08
 */

import type { NextRequest } from 'next/server';

import { enforceAppIsolation } from '@verone/utils/middleware/enforce-app-isolation';

export async function middleware(request: NextRequest) {
  return enforceAppIsolation(request, {
    appName: 'linkme',
    publicRoutes: [
      /^\/$/, // Landing page
      /^\/login$/, // Login
      /^\/about$/, // About
      /^\/contact$/, // Contact
      /^\/cgu$/, // CGU
      /^\/privacy$/, // Privacy
      /^\/cookies$/, // Cookies
      /^\/s\//, // /s/[id] white-label catalogues
      /^\/delivery-info\//, // /delivery-info/[token]
      /^\/api\/auth/, // OAuth callbacks
      /^\/api\/health/, // Health check
      /^\/api\/globe-items/, // 3D sphere (login page)
      /^\/api\/page-config/, // Public page config
    ],
    loginPath: '/login',
    defaultRedirect: '/dashboard',
  });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
