import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Routes protégées nécessitant une authentification
const protectedRoutes = [
  '/dashboard',
  '/catalogue',
  '/commandes',
  '/stocks',
  '/clients',
  '/parametres'
]

// Routes publiques
const publicRoutes = [
  '/login',
  '/',
]

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Créer le client Supabase pour le middleware
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Vérifier l'authentification avec Supabase
  const { data: { user }, error } = await supabase.auth.getUser()
  const isAuthenticated = !error && !!user

  // Si route protégée et non authentifié → redirection login
  if (protectedRoutes.some(route => pathname.startsWith(route)) && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Si déjà authentifié et sur page login → redirection dashboard
  if (pathname === '/login' && isAuthenticated) {
    const redirectUrl = request.nextUrl.searchParams.get('redirect') || '/dashboard'
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}