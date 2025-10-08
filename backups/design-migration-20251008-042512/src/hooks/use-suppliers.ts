'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Supplier {
  id: string
  name: string
  contact_info?: any
  payment_terms?: string
  delivery_time_days?: number
  is_active?: boolean
}

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Utiliser useRef pour créer le client UNE SEULE FOIS
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  useEffect(() => {
    const fetchSuppliers = async () => {
      setLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await supabase
          .from('suppliers')
          .select('id, name, contact_info, payment_terms, delivery_time_days, is_active')
          .eq('is_active', true)
          .order('name', { ascending: true })

        if (fetchError) {
          setError(fetchError.message)
          console.error('Erreur fetch suppliers:', fetchError)
          return
        }

        setSuppliers(data || [])
      } catch (err) {
        console.error('Erreur fetch suppliers:', err)
        setError('Impossible de charger les fournisseurs')
      } finally {
        setLoading(false)
      }
    }

    fetchSuppliers()
  }, [supabase])

  return { suppliers, loading, error }
}
