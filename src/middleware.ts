/**
 * 🚧 Middleware Protection Routes - Déploiement Phase 1
 *
 * Bloque l'accès aux modules désactivés en redirigeant vers page "Module non déployé".
 *
 * ✅ Modules autorisés (Phase 1) :
 * - /dashboard
 * - /profile
 * - /organisation, /contacts-organisations
 * - /admin
 * - /parametres
 * - /login (authentification)
 *
 * ❌ Modules bloqués (Phase 2+) :
 * - /produits (catalogue, sourcing)
 * - /stocks
 * - /commandes
 * - /ventes
 * - /interactions, /consultations
 * - /canaux-vente
 * - /finance, /factures, /tresorerie
 * - /notifications
 * - /tests-essentiels
 *
 * Dernière mise à jour : 2025-10-23 (Stabilisation Phase 1)
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes modules désactivés (Phase 2+)
const INACTIVE_ROUTES = [
  '/produits',
  '/stocks',
  '/commandes',
  '/ventes',
  '/interactions',
  '/consultations',
  '/canaux-vente',
  '/finance',
  '/factures',
  '/tresorerie',
  '/notifications',
  '/tests-essentiels'
]

// Routes toujours autorisées (Phase 1 + routes système)
const ALWAYS_ALLOWED = [
  '/api',           // API Routes toujours accessibles
  '/login',         // Authentification
  '/dashboard',     // Dashboard Phase 1
  '/profile',       // Profil utilisateur Phase 1
  '/organisation',  // Organisations Phase 1
  '/contacts-organisations',  // Organisations Phase 1 (alias)
  '/admin',         // Administration Phase 1
  '/parametres',    // Paramètres Phase 1
  '/_next',         // Next.js static assets
  '/favicon.ico',   // Favicon
  '/module-inactive' // Page module désactivé (ne pas bloquer)
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Vérifier si route toujours autorisée (Phase 1 ou système)
  const isAllowed = ALWAYS_ALLOWED.some(route => pathname.startsWith(route))
  if (isAllowed) {
    return NextResponse.next()
  }

  // 2. Vérifier si route désactivée (Phase 2+)
  const isInactive = INACTIVE_ROUTES.some(route => pathname.startsWith(route))
  if (isInactive) {
    // Extraire nom module pour affichage
    const moduleName = pathname.split('/')[1] || 'inconnu'

    // Rediriger vers page "Module non déployé"
    const url = request.nextUrl.clone()
    url.pathname = '/module-inactive'
    url.searchParams.set('module', moduleName)
    url.searchParams.set('path', pathname)

    return NextResponse.redirect(url)
  }

  // 3. Route racine "/" → rediriger vers dashboard
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // 4. Toutes autres routes → autoriser (ex: pages spécifiques inconnues)
  return NextResponse.next()
}

// Configuration matcher pour appliquer middleware
export const config = {
  matcher: [
    /*
     * Matcher tous chemins sauf :
     * - API routes internes Next.js (_next)
     * - Static assets
     * - Metadata files (favicon, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
