import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Routes protégées nécessitant une authentification
const protectedRoutes = [
  '/dashboard',
  '/catalogue',
  '/commandes',
  '/consultations',
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
  let supabaseResponse = NextResponse.next({
    request,
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
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          supabaseResponse.cookies.set({
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
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          supabaseResponse.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // IMPORTANT: DO NOT REMOVE auth.getUser()
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
  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  return supabaseResponse
}

export const config = {
  // Matcher optimisé Next.js 15 - exclut les assets statiques
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}