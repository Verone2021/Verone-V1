import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

// Types d'alertes stock
export type StockAlertType = 'low_stock' | 'out_of_stock' | 'no_stock_but_ordered'

export interface StockAlert {
  id: string
  product_id: string
  product_name: string
  sku: string
  alert_type: StockAlertType
  severity: 'critical' | 'warning' | 'info'
  stock_real: number
  stock_forecasted_out: number
  min_stock: number
  shortage_quantity: number

  // Tracking commandes brouillon
  quantity_in_draft: number | null
  draft_order_id: string | null
  draft_order_number: string | null
  is_in_draft: boolean

  // Validation
  validated: boolean
  validated_at: string | null

  related_orders?: {
    order_number: string
    quantity: number
  }[]
}

export function useStockAlerts() {
  const [loading, setLoading] = useState(false)
  const [alerts, setAlerts] = useState<StockAlert[]>([])
  const { toast } = useToast()
  const supabase = createClient()

  const fetchAlerts = useCallback(async (type?: StockAlertType) => {
    setLoading(true)
    try {
      // Query stock_alert_tracking avec jointures
      let query = supabase
        .from('stock_alert_tracking')
        .select(`
          id,
          product_id,
          alert_type,
          alert_priority,
          stock_real,
          stock_forecasted_out,
          min_stock,
          shortage_quantity,
          quantity_in_draft,
          draft_order_id,
          validated,
          validated_at,
          products (
            name,
            sku
          ),
          purchase_orders:draft_order_id (
            po_number
          )
        `)
        .eq('validated', false) // Seulement alertes non validées
        .order('alert_priority', { ascending: false })
        .order('stock_real', { ascending: true })

      // Filtrer par type si spécifié
      if (type) {
        query = query.eq('alert_type', type)
      }

      const { data, error } = await query

      if (error) throw error

      // Transformer en StockAlert[]
      const alertsList: StockAlert[] = (data || []).map((alert: any) => {
        // Récupérer commandes liées pour type no_stock_but_ordered
        const relatedOrders: { order_number: string; quantity: number }[] = []

        return {
          id: alert.id,
          product_id: alert.product_id,
          product_name: alert.products?.name || 'Produit inconnu',
          sku: alert.products?.sku || 'N/A',
          alert_type: alert.alert_type as StockAlertType,
          severity:
            alert.alert_priority === 3
              ? 'critical'
              : alert.alert_priority === 2
                ? 'warning'
                : 'info',
          stock_real: alert.stock_real,
          stock_forecasted_out: alert.stock_forecasted_out,
          min_stock: alert.min_stock,
          shortage_quantity: alert.shortage_quantity,
          quantity_in_draft: alert.quantity_in_draft,
          draft_order_id: alert.draft_order_id,
          draft_order_number: alert.purchase_orders?.po_number || null,
          is_in_draft: alert.draft_order_id !== null,
          validated: alert.validated,
          validated_at: alert.validated_at,
          related_orders: relatedOrders.length > 0 ? relatedOrders : undefined
        }
      })

      setAlerts(alertsList)
    } catch (error: any) {
      console.error('Erreur chargement alertes:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les alertes stock',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [supabase, toast])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  return {
    loading,
    alerts,
    fetchAlerts,
    // Helpers existants
    criticalAlerts: alerts.filter(a => a.severity === 'critical'),
    warningAlerts: alerts.filter(a => a.severity === 'warning'),
    getAlertsByType: (type: StockAlertType) => alerts.filter(a => a.alert_type === type),
    // Nouveaux helpers pour tracking brouillon
    alertsInDraft: alerts.filter(a => a.is_in_draft),
    alertsNotInDraft: alerts.filter(a => !a.is_in_draft),
    alertsValidated: alerts.filter(a => a.validated),
    // Helper pour vérifier si produit dans brouillon
    isProductInDraft: (productId: string) =>
      alerts.some(a => a.product_id === productId && a.is_in_draft),
    // Helper pour récupérer quantité commandée
    getQuantityInDraft: (productId: string) =>
      alerts.find(a => a.product_id === productId)?.quantity_in_draft || 0
  }
}
