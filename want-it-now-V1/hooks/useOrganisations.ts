'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Organisation {
  id: string
  nom: string
  pays: string
  created_at: string
}

interface UseOrganisationsOptions {
  enabled?: boolean
}

interface UseOrganisationsReturn {
  organisations: Organisation[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useOrganisations(options: UseOrganisationsOptions = {}): UseOrganisationsReturn {
  const [organisations, setOrganisations] = useState<Organisation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { enabled = true } = options
  const supabase = createClient()

  const fetchOrganisations = async () => {
    if (!enabled) return
    
    try {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('organisations')
        .select('id, nom, pays, created_at')
        .order('nom', { ascending: true })

      if (fetchError) {
        throw fetchError
      }

      setOrganisations(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des organisations'
      setError(errorMessage)
      console.error('Error fetching organisations:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrganisations()
  }, [enabled])

  return {
    organisations,
    isLoading,
    error,
    refresh: fetchOrganisations
  }
}