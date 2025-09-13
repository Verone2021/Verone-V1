import { NextRequest, NextResponse } from 'next/server'

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

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Pour le MVP, simulation d'authentification simple
  // TODO: Remplacer par vraie vérification Supabase
  const isAuthenticated = request.cookies.get('verone-auth')?.value === 'authenticated'

  // Si route protégée et non authentifié → redirection login
  if (protectedRoutes.some(route => pathname.startsWith(route)) && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Si déjà authentifié et sur page login → redirection dashboard
  if (pathname === '/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
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