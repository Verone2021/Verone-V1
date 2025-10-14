import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook léger pour compter les alertes stock actives
 * Utilisé par la sidebar pour afficher les badges
 */
export function useStockAlertsCount() {
  const [count, setCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { count: alertCount, error } = await supabase
          .from('stock_alerts_view')
          .select('*', { count: 'exact', head: true })

        if (error) {
          console.error('Erreur comptage alertes:', error)
          setCount(0)
        } else {
          setCount(alertCount || 0)
        }
      } catch (err) {
        console.error('Erreur comptage alertes:', err)
        setCount(0)
      } finally {
        setLoading(false)
      }
    }

    fetchCount()

    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [supabase])

  return { count, loading }
}
