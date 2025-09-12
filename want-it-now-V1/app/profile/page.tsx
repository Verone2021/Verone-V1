'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Loader2 } from 'lucide-react'

export default function ProfileRouterPage() {
  const router = useRouter()
  const { loading, isAuthenticated, isSuperAdmin, isAdmin } = useAuth()

  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (isSuperAdmin) {
        router.replace('/profile/super-admin')
      } else if (isAdmin) {
        router.replace('/profile/admin')
      } else {
        // Pour l'instant, rediriger vers admin en attendant la page utilisateur
        router.replace('/profile/admin')
      }
    } else if (!loading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [loading, isAuthenticated, isSuperAdmin, isAdmin, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-brand-copper" />
      <p className="ml-3 text-gray-600">Redirection en cours...</p>
    </div>
  )
}