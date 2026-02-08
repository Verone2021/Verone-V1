/**
 * Middleware Site-Internet — App Isolation
 *
 * Single wall: user must have an active role in user_app_roles
 * for app='site-internet'. Otherwise → sign out + redirect to /auth/login.
 *
 * Most routes are public (products, collections, contact).
 * Only /compte/* requires authentication + role check.
 *
 * @module middleware
 * @since 2026-02-08
 */

import type { NextRequest } from 'next/server';

import { enforceAppIsolation } from '@verone/utils/middleware/enforce-app-isolation';

export async function middleware(request: NextRequest) {
  return enforceAppIsolation(request, {
    appName: 'site-internet',
    publicRoutes: [
      /^\/$/, // Homepage
      /^\/produits/, // Product pages
      /^\/collections/, // Collection pages
      /^\/contact/, // Contact
      /^\/auth/, // Auth pages (login, signup, etc.)
      /^\/api\/public/, // Public APIs
      /^\/api\/auth/, // OAuth callbacks
    ],
    loginPath: '/auth/login',
    defaultRedirect: '/compte',
  });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
