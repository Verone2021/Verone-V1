/**
 * Middleware Back-Office — App Isolation
 *
 * Single wall: user must have an active role in user_app_roles
 * for app='back-office'. Otherwise → sign out + redirect to /login.
 *
 * @module middleware
 * @since 2026-02-08
 */

import type { NextRequest } from 'next/server';

import { enforceAppIsolation } from '@verone/utils/middleware/enforce-app-isolation';

export async function middleware(request: NextRequest) {
  return enforceAppIsolation(request, {
    appName: 'back-office',
    publicRoutes: [/^\/login$/, /^\/auth/, /^\/api\/auth/],
    loginPath: '/login',
    defaultRedirect: '/dashboard',
  });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
