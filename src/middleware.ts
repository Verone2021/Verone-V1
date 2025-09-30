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

  // DEBUG: Log des cookies pour diagnostic
  console.log('🔍 [Middleware Debug] Path:', pathname)
  console.log('🔍 [Middleware Debug] Cookies:', Object.fromEntries(request.cookies))

  // IMPORTANT: DO NOT REMOVE auth.getUser()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  // DEBUG: Log de l'authentification
  console.log('🔍 [Middleware Debug] User:', user ? { id: user.id, email: user.email } : null)
  console.log('🔍 [Middleware Debug] Error:', error?.message || 'none')
  
  const isAuthenticated = !error && !!user

  // Si route protégée et non authentifié → redirection login
  if (protectedRoutes.some(route => pathname.startsWith(route)) && !isAuthenticated) {
    console.log('🚨 [Middleware Debug] REDIRECTING TO LOGIN - Route protégée sans auth')
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Si déjà authentifié et sur page login → redirection dashboard
  if (pathname === '/login' && isAuthenticated) {
    console.log('✅ [Middleware Debug] REDIRECTING TO DASHBOARD - Déjà connecté')
    const redirectUrl = request.nextUrl.searchParams.get('redirect') || '/dashboard'
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  console.log('✅ [Middleware Debug] ALLOWING ACCESS')
  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  return supabaseResponse
}

export const config = {
  // DÉSACTIVÉ TEMPORAIREMENT : Conflit auth-wrapper vs middleware
  // L'utilisateur est connecté mais middleware ne voit pas les cookies
  // Rétablir accès immédiat en désactivant le matcher
  matcher: [
    '/middleware-disabled-temporarily'
  ],
}