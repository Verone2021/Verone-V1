'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'

interface DashboardStats {
  totalUsers: number
  totalOrganisations: number
  myOrganisationsCount: number
  loading: boolean
  error: string | null
}

export function useDashboardStats(): DashboardStats {
  const { isAuthenticated, isSuperAdmin, isAdmin } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalOrganisations: 0,
    myOrganisationsCount: 0,
    loading: true,
    error: null
  })

  const supabase = createClient()

  useEffect(() => {
    if (!isAuthenticated) {
      setStats(prev => ({ ...prev, loading: false }))
      return
    }

    const fetchStats = async () => {
      try {
        setStats(prev => ({ ...prev, loading: true, error: null }))

        // Compter le nombre total d'utilisateurs
        const { count: userCount, error: userError } = await supabase
          .from('utilisateurs')
          .select('id', { count: 'exact', head: true })

        if (userError) {
          console.warn('Erreur récupération nombre utilisateurs:', userError)
        }

        // Compter le nombre total d'organisations
        const { count: orgCount, error: orgError } = await supabase
          .from('organisations')
          .select('id', { count: 'exact', head: true })

        if (orgError) {
          console.warn('Erreur récupération nombre organisations:', orgError)
        }

        // Pour les admins non-super, compter leurs organisations spécifiques
        let myOrganisationsCount = 0
        if (isAdmin && !isSuperAdmin) {
          // Pour les admins réguliers, compter les organisations qu'ils gèrent
          // Cette logique peut être étendue selon vos besoins
          myOrganisationsCount = 1 // Placeholder - peut être étendu
        } else if (isSuperAdmin) {
          myOrganisationsCount = orgCount || 0
        }

        setStats({
          totalUsers: userCount || 0,
          totalOrganisations: orgCount || 0,
          myOrganisationsCount,
          loading: false,
          error: null
        })

      } catch (err) {
        console.error('Erreur lors de la récupération des statistiques:', err)
        setStats(prev => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Erreur de récupération des données'
        }))
      }
    }

    fetchStats()
  }, [isAuthenticated, isSuperAdmin, isAdmin])

  return stats
}