/**
 * Next.js Middleware - Verone Back Office
 *
 * Security middleware for:
 * - CSRF protection via SameSite cookies
 * - Security headers enforcement
 * - Authentication routing
 *
 * Note: Rate limiting is applied at the API route level (not middleware)
 * because Edge middleware has limited storage capabilities.
 */

import { type NextRequest, NextResponse } from 'next/server';

import { createServerClient } from '@supabase/ssr';

/**
 * Routes that don't require authentication
 */
const PUBLIC_ROUTES = [
  '/login',  // Seule page publique existante
];

/**
 * API routes that don't require authentication
 */
const PUBLIC_API_ROUTES = [
  '/api/health',
  '/api/csp-report',
  '/api/auth',
];

/**
 * Check if path matches any public route pattern
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Check if path matches any public API route pattern
 */
function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse, request: NextRequest): void {
  // CORS headers for same-origin
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'https://back-office.verone.fr',
    'https://verone.fr',
    'http://localhost:3000',
  ].filter(Boolean);

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );

  // HSTS in production only
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }
}

/**
 * Update session and set secure cookies
 */
async function updateSession(
  request: NextRequest,
  response: NextResponse
): Promise<{ user: { id: string; email?: string } | null; error: Error | null }> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // CSRF Protection: Set secure cookie options
            const secureOptions = {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax' as const, // Lax allows GET redirects but blocks POST CSRF
              path: '/',
            };

            request.cookies.set(name, value);
            response.cookies.set(name, value, secureOptions);
          });
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return { user, error };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // Files with extensions
  ) {
    return NextResponse.next();
  }

  // Create response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Add security headers to all responses
  addSecurityHeaders(response, request);

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400');
    return response;
  }

  // Skip auth check for public routes
  if (isPublicRoute(pathname) || isPublicApiRoute(pathname)) {
    return response;
  }

  // Update session and check authentication
  const { user, error } = await updateSession(request, response);

  // Handle API routes - return 401 for unauthenticated
  if (pathname.startsWith('/api/')) {
    if (error || !user) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized', message: 'Authentication required' }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'WWW-Authenticate': 'Bearer',
          },
        }
      );
    }
    return response;
  }

  // Handle page routes - redirect to login for unauthenticated
  if (error || !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
