import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl
  console.log('🔀 Middleware: Traitement de la requête pour', pathname)

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Define public routes (accessible without authentication)
  const publicRoutes = [
    '/',           // Landing page
    '/auth',       // Auth callback routes
    '/login',      // Login page  
    '/register',   // Registration page
    '/legal',      // Legal pages (if they exist)
    '/test-associes'  // Test page for components
  ]

  // Define protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/profile', 
    '/utilisateurs',
    '/organisations',
    '/admin',
    '/proprietaires',  // Future routes
    '/proprietes',     // Future routes  
    '/contrats'        // Future routes
  ]

  // Define auth routes (should redirect away if already authenticated)
  const authRoutes = ['/login', '/register']

  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )

  // Check if current path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )

  // Check if current path is auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  )

  console.log('🔐 Middleware: État d\'authentification', {
    pathname,
    userId: user?.id || 'non connecté',
    userEmail: user?.email || 'N/A',
    isPublic: isPublicRoute,
    isProtected: isProtectedRoute,
    isAuth: isAuthRoute
  })

  // Redirect logic
  if (!user && isProtectedRoute) {
    // User not authenticated but trying to access protected route
    console.log('🚫 Middleware: Redirection vers /login - utilisateur non authentifié tentant d\'accéder à', pathname)
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (user && isAuthRoute) {
    // User authenticated but trying to access auth pages (login/register)
    console.log('✅ Middleware: Redirection vers /dashboard - utilisateur connecté tentant d\'accéder à', pathname)
    const redirectUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // NOTE: Removed automatic redirect from homepage to dashboard
  // This was causing race conditions with the client-side auth provider
  // The homepage now handles redirection client-side after auth state is fully loaded
  console.log('➡️ Middleware: Aucune redirection requise pour', pathname, user ? '(connecté)' : '(non connecté)')

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}