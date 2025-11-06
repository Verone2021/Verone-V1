/**
 * 📊 Activity Tracker Provider - Vérone
 * Provider React pour tracking automatique activité utilisateur
 * S'active uniquement pour utilisateurs authentifiés
 * ⏰ Tracking 24/7 (équipes internationales)
 */

'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useUserActivityTracker } from '@/shared/modules/notifications/hooks'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface ActivityTrackerProviderProps {
  children: React.ReactNode
}

export function ActivityTrackerProvider({ children }: ActivityTrackerProviderProps) {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)

  // Suivre l'authentification utilisateur
  useEffect(() => {
    const supabase = createClient()

    // Obtenir session initiale
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
    }

    getSession()

    // Écouter changements authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Initialiser tracker uniquement si user authentifié
  const {
    trackEvent,
    trackFormSubmit,
    trackSearch,
    trackFilterApplied,
    currentSession,
    flushEvents
  } = useUserActivityTracker()

  // Tracking automatique changement de page (24/7)
  useEffect(() => {
    if (user && pathname) {
      // Ne pas tracker pages publiques/auth
      const publicPaths = ['/login', '/signup', '/forgot-password', '/reset-password']
      const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

      if (!isPublicPath) {
        trackEvent({
          action: 'page_view',
          new_data: {
            page_url: pathname,
            page_title: document.title,
            referrer: document.referrer
          }
        })
      }
    }
    // Seulement pathname et user dans les dépendances pour éviter boucles infinies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, user])

  // Flush événements avant fermeture page
  useEffect(() => {
    const handleBeforeUnload = () => {
      flushEvents()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
    // Pas de dépendances - on veut installer le listener une seule fois
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Rendre provider invisible (ne modifie pas le DOM)
  return <>{children}</>
}
