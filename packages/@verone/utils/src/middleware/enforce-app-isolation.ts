/**
 * App Isolation Middleware — Verone Multi-App
 *
 * Single wall per app: if the user has no active role for this app
 * in user_app_roles, they are signed out and redirected to login.
 *
 * ⚠️ Edge Runtime compatible — this file must NEVER import from
 * `../supabase/server` (which pulls `cookies()` from `next/headers`).
 * We import `createServerClient` directly from `@supabase/ssr`.
 *
 * @module enforce-app-isolation
 * @since 2026-02-08
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type AppName = 'back-office' | 'linkme' | 'site-internet';

interface AppIsolationConfig {
  /** Which app this middleware protects */
  appName: AppName;

  /** Regex patterns for routes that don't require authentication */
  publicRoutes: RegExp[];

  /** Path to the login page (e.g. '/login' or '/auth/login') */
  loginPath: string;

  /** Where to redirect authenticated users who land on the login page */
  defaultRedirect?: string;
}

export type { AppName, AppIsolationConfig };

/**
 * Enforce app isolation in a Next.js middleware.
 *
 * 1. Public routes → pass through (redirect logged-in users away from login)
 * 2. No session → redirect to login
 * 3. back-office / linkme: Session but no role → sign out + redirect with error
 * 4. site-internet: Session is enough (no role check — customers don't have roles yet)
 * 5. Session + role → pass through (with refreshed cookies)
 */
export async function enforceAppIsolation(
  request: NextRequest,
  config: AppIsolationConfig
): Promise<NextResponse> {
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
    const isPublic = config.publicRoutes.some(re => re.test(pathname));

    // --- Public route ---
    if (isPublic) {
      // Redirect logged-in users away from login page
      if (user && pathname === config.loginPath) {
        const url = request.nextUrl.clone();
        url.pathname = config.defaultRedirect ?? '/';
        return NextResponse.redirect(url);
      }
      return supabaseResponse;
    }

    // --- Not authenticated → login ---
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = config.loginPath;
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    // --- site-internet: authenticated is enough (no role check) ---
    // Customers on site-internet don't have entries in user_app_roles.
    // Authentication alone is sufficient for protected pages like /compte.
    if (config.appName === 'site-internet') {
      return supabaseResponse;
    }

    // --- back-office / linkme: verify role for this app ---
    const { data: role } = await supabase
      .from('user_app_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('app', config.appName)
      .eq('is_active', true)
      .maybeSingle();

    if (!role) {
      // No role for this app → sign out so stale session doesn't persist
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = config.loginPath;
      url.searchParams.set('error', 'no_access');
      return NextResponse.redirect(url);
    }

    // --- Has role → allow ---
    return supabaseResponse;
  } catch (error) {
    // Any unexpected error in middleware → redirect to login gracefully
    // rather than showing MIDDLEWARE_INVOCATION_FAILED to the user
    console.error('[enforce-app-isolation] Middleware error:', error);
    const url = request.nextUrl.clone();
    url.pathname = config.loginPath;
    url.searchParams.set('error', 'middleware_error');
    return NextResponse.redirect(url);
  }
}
