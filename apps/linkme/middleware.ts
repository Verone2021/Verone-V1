/**
 * Middleware Linkme - Vérone
 *
 * Gère l'authentification et la protection des routes
 *
 * Routes protégées :
 * - /dashboard, /commissions, /ventes, /profil → Requiert authentification
 *
 * Routes publiques :
 * - /, /login, /products, /categories, /api/public
 *
 * @module middleware
 * @since 2025-12-01
 */

import { type NextRequest, NextResponse } from 'next/server';

import { updateSession } from '@/lib/supabase-server';

// Routes qui nécessitent une authentification
const PROTECTED_ROUTES = [
  '/dashboard',
  '/commissions',
  '/ventes',
  '/profil',
  '/orders',
];

// Routes toujours publiques
const PUBLIC_ROUTES = ['/', '/login', '/products', '/categories', '/cart'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip pour les assets statiques et API Next.js
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // fichiers statiques
  ) {
    return NextResponse.next();
  }

  // Mettre à jour la session Supabase (rafraîchir le token si nécessaire)
  const response = await updateSession(request);

  // Vérifier si la route est protégée
  const isProtectedRoute = PROTECTED_ROUTES.some(route =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // Vérifier la présence d'un cookie de session Supabase
    const hasSession = request.cookies
      .getAll()
      .some(
        cookie =>
          cookie.name.includes('sb-') && cookie.name.includes('-auth-token')
      );

    if (!hasSession) {
      // Rediriger vers login avec URL de retour
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Si sur /login et déjà connecté, rediriger vers dashboard
  if (pathname === '/login') {
    const hasSession = request.cookies
      .getAll()
      .some(
        cookie =>
          cookie.name.includes('sb-') && cookie.name.includes('-auth-token')
      );

    if (hasSession) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - Static assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
