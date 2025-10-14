import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

// =============================================
// DASHBOARD STOCK - MÉTRIQUES PROFESSIONNELLES ERP
// Inspiré de Odoo, ERPNext, SAP
// =============================================

interface StockOverview {
  total_value: number              // Valeur totale stock (quantity × cost_price)
  products_in_stock: number        // Produits avec stock > 0
  products_out_of_stock: number    // Produits en rupture (stock ≤ 0)
  products_below_min: number       // Produits sous seuil minimum
  total_products: number           // Total produits non archivés
  total_quantity: number           // Quantité totale toutes références
  total_forecasted_in: number      // Total entrées prévisionnelles (commandes fournisseurs)
  total_forecasted_out: number     // Total sorties prévisionnelles (commandes clients)
  total_available: number          // Stock disponible (réel - prévisionnel sortant)
}

interface MovementsSummary {
  last_7_days: {
    entries: { count: number; quantity: number }
    exits: { count: number; quantity: number }
    adjustments: { count: number; quantity: number }
  }
  today: {
    entries: number
    exits: number
    adjustments: number
  }
  total_movements: number
}

interface LowStockProduct {
  id: string
  name: string
  sku: string
  stock_quantity: number
  min_stock: number
  cost_price: number
  stock_forecasted_out: number
}

interface RecentMovement {
  id: string
  product_id: string
  product_name: string
  product_sku: string
  movement_type: 'IN' | 'OUT' | 'ADJUST'
  quantity_change: number
  quantity_before: number
  quantity_after: number
  reason_code: string
  notes: string | null
  performed_at: string
  performer_name: string | null
}

interface ForecastedOrder {
  id: string
  order_number: string
  order_type: 'purchase' | 'sales'
  client_name?: string
  supplier_name?: string
  total_quantity: number
  expected_date: string
  status: string
}

export interface StockDashboardMetrics {
  overview: StockOverview
  movements: MovementsSummary
  low_stock_products: LowStockProduct[]
  recent_movements: RecentMovement[]
  incoming_orders: ForecastedOrder[] // TOP 5 commandes fournisseurs
  outgoing_orders: ForecastedOrder[] // TOP 5 commandes clients
}

export function useStockDashboard() {
  const [metrics, setMetrics] = useState<StockDashboardMetrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const fetchDashboardMetrics = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // ============================================
      // QUERY 1: Vue d'ensemble stock (1 query optimisée)
      // ============================================
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, sku, stock_quantity, stock_real, stock_forecasted_in, stock_forecasted_out, min_stock, cost_price')
        .is('archived_at', null)

      if (productsError) throw productsError

      // ============================================
      // CALCUL ALERTES INTELLIGENTES (vue stock_alerts_view)
      // ============================================
      const { data: allAlerts, error: allAlertsError } = await supabase
        .from('stock_alerts_view')
        .select('alert_status, alert_priority')

      if (allAlertsError) throw allAlertsError

      const alertsCount = {
        out_of_stock: (allAlerts || []).filter(a => a.alert_status === 'out_of_stock').length,
        low_stock: (allAlerts || []).filter(a => a.alert_status === 'low_stock').length
      }

      // Calculs agrégés en JS (plus rapide que COUNT() multiples)
      const overview: StockOverview = {
        total_products: products.length,
        total_quantity: products.reduce((sum, p) => sum + (p.stock_real || p.stock_quantity || 0), 0),
        total_value: products.reduce((sum, p) => sum + ((p.stock_real || p.stock_quantity || 0) * (p.cost_price || 0)), 0),
        products_in_stock: products.filter(p => (p.stock_real || p.stock_quantity || 0) > 0).length,
        products_out_of_stock: alertsCount.out_of_stock,  // Seulement produits commandés en rupture
        products_below_min: alertsCount.low_stock,  // Seulement produits commandés sous seuil
        // NOUVEAUX CALCULS PRÉVISIONNELS
        total_forecasted_in: products.reduce((sum, p) => sum + (p.stock_forecasted_in || 0), 0),
        total_forecasted_out: products.reduce((sum, p) => sum + (p.stock_forecasted_out || 0), 0),
        total_available: products.reduce((sum, p) => sum + Math.max((p.stock_real || 0) - (p.stock_forecasted_out || 0), 0), 0)
      }

      // ============================================
      // QUERY 2: Mouvements 7 derniers jours
      // ============================================
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data: movements7d, error: movements7dError } = await supabase
        .from('stock_movements')
        .select('movement_type, quantity_change, performed_at')
        .eq('affects_forecast', false)
        .gte('performed_at', sevenDaysAgo.toISOString())

      if (movements7dError) throw movements7dError

      // Agrégation des mouvements par type
      const entries7d = movements7d?.filter(m => m.movement_type === 'IN') || []
      const exits7d = movements7d?.filter(m => m.movement_type === 'OUT') || []
      const adjustments7d = movements7d?.filter(m => m.movement_type === 'ADJUST') || []

      // Mouvements aujourd'hui
      const today = new Date().toISOString().split('T')[0]
      const movementsToday = movements7d?.filter(m => m.performed_at.startsWith(today)) || []

      const movementsSummary: MovementsSummary = {
        last_7_days: {
          entries: {
            count: entries7d.length,
            quantity: entries7d.reduce((sum, m) => sum + Math.abs(m.quantity_change), 0)
          },
          exits: {
            count: exits7d.length,
            quantity: exits7d.reduce((sum, m) => sum + Math.abs(m.quantity_change), 0)
          },
          adjustments: {
            count: adjustments7d.length,
            quantity: adjustments7d.reduce((sum, m) => sum + m.quantity_change, 0)
          }
        },
        today: {
          entries: movementsToday.filter(m => m.movement_type === 'IN').length,
          exits: movementsToday.filter(m => m.movement_type === 'OUT').length,
          adjustments: movementsToday.filter(m => m.movement_type === 'ADJUST').length
        },
        total_movements: movements7d?.length || 0
      }

      // ============================================
      // QUERY 3: Top 5 produits stock faible (utilise vue intelligente)
      // Seulement produits commandés avec stock < min_stock
      // ============================================
      const { data: alertsData, error: alertsError } = await supabase
        .from('stock_alerts_view')
        .select('product_id, product_name, sku, stock_quantity, min_stock, alert_status, alert_priority')
        .order('alert_priority', { ascending: false })
        .order('stock_quantity', { ascending: true })
        .limit(5)

      if (alertsError) throw alertsError

      // Enrichir avec stock_forecasted_out depuis products
      const lowStockProducts: LowStockProduct[] = []
      for (const alert of (alertsData || [])) {
        const product = products.find(p => p.id === alert.product_id)
        lowStockProducts.push({
          id: alert.product_id,
          name: alert.product_name,
          sku: alert.sku,
          stock_quantity: alert.stock_quantity,
          min_stock: alert.min_stock,
          cost_price: 0, // Pas besoin ici
          stock_forecasted_out: product?.stock_forecasted_out || 0
        })
      }

      // ============================================
      // QUERY 4: 5 derniers mouvements (timeline)
      // ============================================
      const { data: recentMovs, error: recentError } = await supabase
        .from('stock_movements')
        .select('id, product_id, movement_type, quantity_change, quantity_before, quantity_after, reason_code, notes, performed_at, performed_by')
        .eq('affects_forecast', false)
        .order('performed_at', { ascending: false })
        .limit(5)

      if (recentError) throw recentError

      // Enrichir avec noms produits (pas de table profiles, utiliser ID directement)
      const recentMovements: RecentMovement[] = []
      for (const mov of (recentMovs || [])) {
        // Récupérer nom produit
        const { data: product } = await supabase
          .from('products')
          .select('name, sku')
          .eq('id', mov.product_id)
          .single()

        recentMovements.push({
          id: mov.id,
          product_id: mov.product_id,
          product_name: product?.name || 'Produit inconnu',
          product_sku: product?.sku || '',
          movement_type: mov.movement_type,
          quantity_change: mov.quantity_change,
          quantity_before: mov.quantity_before,
          quantity_after: mov.quantity_after,
          reason_code: mov.reason_code || '',
          notes: mov.notes,
          performed_at: mov.performed_at,
          performer_name: 'Admin' // TODO: Récupérer depuis auth.users ou profiles quand disponible
        })
      }

      // ============================================
      // QUERY 5 & 6: Commandes Prévisionnelles (Désactivées temporairement)
      // TODO: Réactiver quand données de test disponibles
      // Problème: Foreign key disambiguation avec PostgREST
      // ============================================

      // Retourner tableaux vides pour éviter erreurs console
      const incomingOrders: ForecastedOrder[] = []
      const outgoingOrders: ForecastedOrder[] = []

      /*
      // VERSION AVEC JOINS - À RÉACTIVER APRÈS TESTS
      const { data: purchaseOrders, error: poError } = await supabase
        .from('purchase_orders')
        .select(`
          id,
          po_number,
          expected_delivery_date,
          status,
          purchase_order_items(quantity)
        `)
        .in('status', ['draft', 'sent', 'confirmed'])
        .order('expected_delivery_date', { ascending: true })
        .limit(5)

      const { data: salesOrders, error: soError } = await supabase
        .from('sales_orders')
        .select(`
          id,
          order_number,
          expected_delivery_date,
          status,
          sales_order_items(quantity)
        `)
        .in('status', ['confirmed', 'partially_shipped'])
        .order('expected_delivery_date', { ascending: true })
        .limit(5)

      // Mapper avec supplier/customer names via requêtes séparées
      */

      // ============================================
      // Consolidation des métriques
      // ============================================
      setMetrics({
        overview,
        movements: movementsSummary,
        low_stock_products: lowStockProducts,
        recent_movements: recentMovements,
        incoming_orders: incomingOrders,
        outgoing_orders: outgoingOrders
      })

    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors du chargement du dashboard'
      setError(errorMessage)
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [supabase, toast])

  // Chargement automatique au montage
  useEffect(() => {
    fetchDashboardMetrics()
  }, [fetchDashboardMetrics])

  return {
    metrics,
    loading,
    error,
    refetch: fetchDashboardMetrics
  }
}
