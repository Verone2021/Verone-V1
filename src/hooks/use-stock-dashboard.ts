import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useStockUI } from '@/hooks/use-stock-ui'

// =============================================
// DASHBOARD STOCK - MÉTRIQUES PROFESSIONNELLES ERP
// Inspiré de Odoo, ERPNext, SAP
// 🔄 Phase 3.2 - Migration use-stock-ui (Vague 2)
// @since 2025-10-31
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
  product_image_url?: string | null  // ✅ NOUVEAU - URL image principale produit
}

interface RecentMovement {
  id: string
  product_id: string
  product_name: string
  product_sku: string
  movement_type: 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER'
  quantity_change: number
  quantity_before: number
  quantity_after: number
  reason_code: string
  notes: string | null
  performed_at: string
  performer_name: string | null
  channel_id: string | null
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

  // 🆕 Phase 3.2: Utilisation use-stock-ui pour réutiliser cache
  const stock = useStockUI({ autoLoad: true })

  const fetchDashboardMetrics = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // ============================================
      // MIGRATION use-stock-ui (Vague 2)
      // Queries 1, 3, 5 remplacées par use-stock-ui
      // Queries 2, 4 gardées (stock_alerts_view spécialisé)
      // ============================================

      // 🆕 QUERY 1: Vue d'ensemble stock (via use-stock-ui)
      let products = stock.stockItems
      if (products.length === 0) {
        // Forcer chargement si cache vide
        products = await stock.getStockItems({ archived: false })
      }

      // Mapper vers format attendu (compatibilité)
      const productsWithLegacyFields = products.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        stock_quantity: p.stock_real, // Alias legacy
        stock_real: p.stock_real,
        stock_forecasted_in: p.stock_forecasted_in,
        stock_forecasted_out: p.stock_forecasted_out,
        min_stock: p.min_stock,
        cost_price: 0, // TODO: Ajouter cost_price dans use-stock-core
        product_image_url: (p as any).product_image_url || null  // ✅ NOUVEAU - Image produit
      }))

      // 🆕 QUERY 3: Mouvements 7 derniers jours (via use-stock-ui)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const movements7d = await stock.getMovements({
        affects_forecast: false,
        date_from: sevenDaysAgo.toISOString(),
        limit: 500 // Limiter pour performance
      })

      // 🆕 QUERY 5: 5 derniers mouvements (cache use-stock-ui)
      const recentMovs = stock.movements.slice(0, 5) // Cache déjà chargé

      // QUERY 2 & 4: Garder queries stock_alerts_view (vue spécialisée)
      const [
        { data: allAlerts, error: allAlertsError },
        { data: alertsData, error: alertsError }
      ] = await Promise.all([
        // QUERY 2: Toutes les alertes
        supabase
          .from('stock_alerts_view')
          .select('alert_status, alert_priority'),

        // QUERY 4: Top 5 produits stock faible
        supabase
          .from('stock_alerts_view')
          .select('product_id, product_name, sku, stock_quantity, min_stock, alert_status, alert_priority')
          .order('alert_priority', { ascending: false })
          .order('stock_quantity', { ascending: true })
          .limit(5)
      ])

      if (allAlertsError) throw allAlertsError
      if (alertsError) throw alertsError

      const alertsCount = {
        out_of_stock: (allAlerts || []).filter((a: any) => a.alert_status === 'out_of_stock').length,
        low_stock: (allAlerts || []).filter((a: any) => a.alert_status === 'low_stock').length
      }

      // Calculs agrégés en JS (plus rapide que COUNT() multiples)
      const overview: StockOverview = {
        total_products: productsWithLegacyFields.length,
        total_quantity: productsWithLegacyFields.reduce((sum, p) => sum + (p.stock_real || p.stock_quantity || 0), 0),
        total_value: productsWithLegacyFields.reduce((sum, p) => sum + ((p.stock_real || p.stock_quantity || 0) * (p.cost_price || 0)), 0),
        products_in_stock: productsWithLegacyFields.filter(p => (p.stock_real || p.stock_quantity || 0) > 0).length,
        products_out_of_stock: alertsCount.out_of_stock,  // Seulement produits commandés en rupture
        products_below_min: alertsCount.low_stock,  // Seulement produits commandés sous seuil
        // NOUVEAUX CALCULS PRÉVISIONNELS
        total_forecasted_in: productsWithLegacyFields.reduce((sum, p) => sum + (p.stock_forecasted_in || 0), 0),
        total_forecasted_out: productsWithLegacyFields.reduce((sum, p) => sum + (p.stock_forecasted_out || 0), 0),
        total_available: productsWithLegacyFields.reduce((sum, p) => sum + Math.max((p.stock_real || 0) - (p.stock_forecasted_out || 0), 0), 0)
      }

      // ============================================
      // CALCULS AGRÉGÉS: Mouvements 7 derniers jours
      // ============================================

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
      // AGRÉGATION: Top 5 produits stock faible
      // (Déjà chargés dans alertsData depuis Promise.all)
      // ============================================

      // Enrichir avec stock_forecasted_out + product_image_url depuis productsWithLegacyFields
      const lowStockProducts: LowStockProduct[] = []
      for (const alert of ((alertsData || []) as any[])) {
        const product = productsWithLegacyFields.find(p => p.id === alert.product_id)
        lowStockProducts.push({
          id: alert.product_id,
          name: alert.product_name,
          sku: alert.sku,
          stock_quantity: alert.stock_quantity,
          min_stock: alert.min_stock,
          cost_price: 0, // Pas besoin ici
          stock_forecasted_out: product?.stock_forecasted_out || 0,
          product_image_url: product?.product_image_url || null  // ✅ NOUVEAU - Image produit
        })
      }

      // ============================================
      // PERFORMANCE FIX #1: Batch Query Products (+500ms gain)
      // Utiliser products déjà chargés au lieu de N+1 queries
      // ============================================

      // Créer Map pour lookup O(1) des produits
      const productsMap = new Map(productsWithLegacyFields.map(p => [p.id, { name: p.name, sku: p.sku }]))

      // Enrichir mouvements avec noms produits (0 query supplémentaire!)
      const recentMovements: RecentMovement[] = (recentMovs || []).map(mov => {
        const product = productsMap.get(mov.product_id)

        return {
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
          performer_name: 'Admin', // TODO: Récupérer depuis auth.users ou profiles quand disponible
          channel_id: mov.channel_id
        }
      })

      // ============================================
      // QUERY 5 & 6: Commandes Prévisionnelles
      // Récupération des commandes fournisseurs et clients en cours
      // ============================================

      // QUERY 5: Purchase Orders (commandes fournisseurs)
      const { data: purchaseOrders, error: poError } = await supabase
        .from('purchase_orders')
        .select(`
          id,
          po_number,
          expected_delivery_date,
          status,
          supplier_id,
          purchase_order_items(quantity)
        `)
        .in('status', ['draft', 'sent', 'confirmed', 'partially_received'])
        .order('expected_delivery_date', { ascending: true })
        .limit(5)

      if (poError) throw poError

      // QUERY 6: Sales Orders (commandes clients)
      const { data: salesOrders, error: soError } = await supabase
        .from('sales_orders')
        .select(`
          id,
          order_number,
          expected_delivery_date,
          status,
          customer_id,
          customer_type,
          sales_order_items(quantity)
        `)
        .in('status', ['confirmed', 'partially_shipped'])
        .order('expected_delivery_date', { ascending: true })
        .limit(5)

      if (soError) throw soError

      // Mapper Purchase Orders avec supplier names
      const incomingOrders: ForecastedOrder[] = []
      for (const po of (purchaseOrders || [])) {
        let supplierName = 'Fournisseur inconnu'

        if (po.supplier_id) {
          const { data: supplier } = await supabase
            .from('organisations')
            .select('legal_name, trade_name')
            .eq('id', po.supplier_id)
            .single()

          supplierName = (supplier?.trade_name || supplier?.legal_name) || 'Fournisseur inconnu'
        }

        incomingOrders.push({
          id: po.id,
          order_number: po.po_number,
          order_type: 'purchase',
          supplier_name: supplierName,
          total_quantity: (po.purchase_order_items || []).reduce((sum: number, item: any) => sum + (item.quantity || 0), 0),
          expected_date: po.expected_delivery_date || '',
          status: po.status
        })
      }

      // Mapper Sales Orders avec customer names (gestion polymorphe)
      const outgoingOrders: ForecastedOrder[] = []
      for (const so of (salesOrders || [])) {
        let customerName = 'Client inconnu'

        if (so.customer_type === 'organization' && so.customer_id) {
          const { data: org } = await supabase
            .from('organisations')
            .select('legal_name, trade_name')
            .eq('id', so.customer_id)
            .single()

          customerName = (org?.trade_name || org?.legal_name) || 'Organisation inconnue'
        } else if (so.customer_type === 'individual' && so.customer_id) {
          const { data: individual } = await supabase
            .from('individual_customers')
            .select('first_name, last_name')
            .eq('id', so.customer_id)
            .single()

          customerName = individual ? `${individual.first_name} ${individual.last_name}` : 'Particulier inconnu'
        }

        outgoingOrders.push({
          id: so.id,
          order_number: so.order_number,
          order_type: 'sales',
          client_name: customerName,
          total_quantity: (so.sales_order_items || []).reduce((sum: number, item: any) => sum + (item.quantity || 0), 0),
          expected_date: so.expected_delivery_date || '',
          status: so.status
        })
      }

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
  }, [supabase, toast]) // ✅ FIX: Retirer `stock` pour éviter boucle infinie

  // ✅ FIX: Chargement unique au montage (pas de re-trigger en boucle)
  useEffect(() => {
    fetchDashboardMetrics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Charge une seule fois au montage

  return {
    metrics,
    loading,
    error,
    refetch: fetchDashboardMetrics
  }
}
