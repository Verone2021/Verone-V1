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
      // Récupérer tous les produits avec leurs stocks
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, sku, stock_real, stock_forecasted_in, stock_forecasted_out, min_stock')
        .is('archived_at', null)

      if (productsError) throw productsError

      const alertsList: StockAlert[] = []

      for (const product of products || []) {
        const stockReal = product.stock_real || 0
        const forecastedOut = product.stock_forecasted_out || 0
        const minStock = product.min_stock || 0

        // Alerte 1 : Stock faible (< min_stock)
        if (stockReal > 0 && stockReal < minStock && (!type || type === 'low_stock')) {
          alertsList.push({
            id: `low_${product.id}`,
            product_id: product.id,
            product_name: product.name,
            sku: product.sku,
            alert_type: 'low_stock',
            severity: 'warning',
            stock_real: stockReal,
            stock_forecasted_out: forecastedOut,
            min_stock: minStock,
            shortage_quantity: minStock - stockReal
          })
        }

        // Alerte 2 : Rupture stock (stock_real <= 0)
        if (stockReal <= 0 && forecastedOut === 0 && (!type || type === 'out_of_stock')) {
          alertsList.push({
            id: `out_${product.id}`,
            product_id: product.id,
            product_name: product.name,
            sku: product.sku,
            alert_type: 'out_of_stock',
            severity: 'critical',
            stock_real: stockReal,
            stock_forecasted_out: forecastedOut,
            min_stock: minStock,
            shortage_quantity: minStock
          })
        }

        // Alerte 3 : Commandé sans stock (CRITIQUE)
        if (stockReal <= 0 && forecastedOut > 0 && (!type || type === 'no_stock_but_ordered')) {
          // Récupérer commandes liées
          const { data: orders } = await supabase
            .from('sales_orders')
            .select('order_number, sales_order_items!inner(quantity)')
            .eq('status', 'confirmed')
            .eq('sales_order_items.product_id', product.id)

          alertsList.push({
            id: `ordered_${product.id}`,
            product_id: product.id,
            product_name: product.name,
            sku: product.sku,
            alert_type: 'no_stock_but_ordered',
            severity: 'critical',
            stock_real: stockReal,
            stock_forecasted_out: forecastedOut,
            min_stock: minStock,
            shortage_quantity: forecastedOut,
            related_orders: orders?.map(o => ({
              order_number: o.order_number,
              quantity: o.sales_order_items[0]?.quantity || 0
            }))
          })
        }
      }

      setAlerts(alertsList)
    } catch (error: any) {
      console.error('Erreur chargement alertes:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les alertes stock",
        variant: "destructive"
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
    // Helpers
    criticalAlerts: alerts.filter(a => a.severity === 'critical'),
    warningAlerts: alerts.filter(a => a.severity === 'warning'),
    getAlertsByType: (type: StockAlertType) => alerts.filter(a => a.alert_type === type)
  }
}
