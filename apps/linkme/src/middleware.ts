/**
 * Middleware LinkMe — Self-contained App Isolation
 *
 * ⚠️ RÈGLE ABSOLUE: JAMAIS importer depuis @verone/* dans middleware.ts
 * Vercel Edge Runtime ne supporte PAS les imports workspace monorepo.
 * Toute la logique DOIT être inline dans ce fichier.
 *
 * @see commit 11e87901 — documentation de cette contrainte
 * @see packages/@verone/utils/src/middleware/enforce-app-isolation.ts — logique source
 *
 * Fonctionnalités:
 * 1. Refresh session Supabase (getUser)
 * 2. Routes publiques → pass through
 * 3. Non authentifié → redirect /login
 * 4. Authentifié sans rôle linkme → redirect /unauthorized
 * 5. Authentifié avec rôle → pass through
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_ROUTES: RegExp[] = [
  // Pages publiques exactes
  /^\/$/,
  /^\/login$/,
  /^\/unauthorized$/,
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
];

export async function middleware(request: NextRequest): Promise<NextResponse> {
  try {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // CRITICAL: call getUser() immediately after createServerClient
    // (Supabase SSR best practice — do NOT call getSession() first)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;
    const isPublic = PUBLIC_ROUTES.some(re => re.test(pathname));

    // --- Public route → pass through ---
    if (isPublic) {
      return supabaseResponse;
    }

    // --- Not authenticated → redirect to login ---
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    // --- Authenticated → verify linkme role ---
    const { data: role } = await supabase
      .from('user_app_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('app', 'linkme')
      .eq('is_active', true)
      .maybeSingle();

    if (!role) {
      const url = request.nextUrl.clone();
      url.pathname = '/unauthorized';
      return NextResponse.redirect(url);
    }

    // --- Has role → allow ---
    return supabaseResponse;
  } catch (error) {
    // Graceful fallback: redirect to login rather than 500
    console.error('[linkme/middleware] Error:', error);
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('error', 'middleware_error');
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
