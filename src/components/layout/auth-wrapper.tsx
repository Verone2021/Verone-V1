/**
 * 🔐 Auth Wrapper - Layout Conditionnel
 *
 * Détermine quel layout utiliser selon l'état d'authentification
 */

"use client"

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AppSidebar } from './app-sidebar'
import { AppHeader } from './app-header'
import { PublicLayout } from './public-layout'

interface AuthWrapperProps {
  children: React.ReactNode
}

// Pages publiques qui n'utilisent pas le layout authentifié
const PUBLIC_PAGES = ['/', '/login']

export function AuthWrapper({ children }: AuthWrapperProps) {
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Vérification authentification côté client
  useEffect(() => {
    const checkAuth = () => {
      // Pour MVP : vérification simple du cookie
      const authCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('verone-auth='))
        ?.split('=')[1]

      setIsAuthenticated(authCookie === 'authenticated')
      setIsLoading(false)
    }

    checkAuth()

    // Écouter les changements de cookies (pour déconnexion)
    const interval = setInterval(checkAuth, 1000)
    return () => clearInterval(interval)
  }, [])

  // Pendant le chargement, affichage minimal
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="font-logo text-2xl font-light tracking-wider text-black">
          VÉRONE
        </div>
      </div>
    )
  }

  // Page publique OU utilisateur non authentifié
  const isPublicPage = PUBLIC_PAGES.includes(pathname)
  const shouldUsePublicLayout = isPublicPage || !isAuthenticated

  if (shouldUsePublicLayout) {
    return <PublicLayout>{children}</PublicLayout>
  }

  // Layout authentifié avec sidebar/header
  return (
    <div className="flex h-full">
      {/* Sidebar fixe */}
      <AppSidebar />

      {/* Contenu principal */}
      <div className="flex flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}