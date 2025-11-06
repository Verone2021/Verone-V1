/**
 * Hook unifié pour Dashboard CRM/ERP 2025
 * Combine données réelles Phase 1 + données réelles Phase 2 (Stock/Commandes)
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRealDashboardMetrics } from './use-real-dashboard-metrics'
import { useOrganisations } from '@/hooks/use-organisations'
import { useStockOrdersMetrics } from '@/hooks/use-stock-orders-metrics'

export interface CompleteDashboardMetrics {
  // Phase 1 - Données RÉELLES
  catalogue: {
    totalProducts: number
    activeProducts: number
    publishedProducts: number
    collections: number
    variantGroups: number
    trend: number
  }

  organisations: {
    totalOrganisations: number
    suppliers: number
    customersB2B: number
    partners: number
  }

  // Phase 2 - Données RÉELLES (Stock/Commandes/Sourcing)
  stocks: {
    totalValue: number
    lowStockItems: number
    recentMovements: number
  }

  orders: {
    purchaseOrders: number
    salesOrders: number
    monthRevenue: number
  }

  sourcing: {
    productsToSource: number
    samplesWaiting: number
  }

  // Compatibilité avec sections de détail du dashboard
  collections: {
    total: number
    active: number
  }

  variantGroups: {
    total: number
  }

  products: {
    trend: number
  }
}

export function useCompleteDashboardMetrics() {
  // Phase 1 - Données réelles
  const {
    metrics: catalogueMetrics,
    isLoading: catalogueLoading,
    error: catalogueError
  } = useRealDashboardMetrics()

  const {
    organisations,
    loading: organisationsLoading
  } = useOrganisations()

  // Phase 2 - Données réelles Stock/Commandes/Sourcing
  const {
    metrics: stockOrdersMetrics,
    isLoading: stockOrdersLoading
  } = useStockOrdersMetrics()

  // État pour salesOrders
  const [salesOrdersCount, setSalesOrdersCount] = useState<number>(0)
  const [salesOrdersLoading, setSalesOrdersLoading] = useState(true)

  // Charger le comptage des commandes de vente
  useEffect(() => {
    const fetchSalesOrders = async () => {
      try {
        setSalesOrdersLoading(true)
        const supabase = createClient()

        const { count, error } = await supabase
          .from('sales_orders')
          .select('id', { count: 'exact', head: true })

        if (error) {
          console.error('Erreur comptage sales_orders:', error)
        } else {
          setSalesOrdersCount(count || 0)
        }
      } catch (err) {
        console.error('Erreur chargement sales_orders:', err)
      } finally {
        setSalesOrdersLoading(false)
      }
    }

    fetchSalesOrders()
  }, [])

  // Calcul statistiques organisations (excluant particuliers)
  const organisationsOnly = organisations.filter(o =>
    o.type !== 'customer' || (o.type === 'customer' && o.customer_type !== 'individual')
  )

  const organisationsStats = {
    totalOrganisations: organisationsOnly.length,
    suppliers: organisations.filter(o => o.type === 'supplier').length,
    customersB2B: organisations.filter(o =>
      o.type === 'customer' && (!o.customer_type || o.customer_type === 'professional')
    ).length,
    partners: organisations.filter(o => o.type === 'partner').length
  }

  // Phase 2 - Données réelles depuis Supabase
  const stocksData = {
    totalValue: stockOrdersMetrics?.stock_value || 0,
    lowStockItems: 0, // TODO #VERONE-STOCK-001: Implémenter seuil stock minimum
    recentMovements: 0 // TODO #VERONE-STOCK-002: Implémenter tracking mouvements
  }

  const ordersData = {
    purchaseOrders: stockOrdersMetrics?.purchase_orders_count || 0,
    salesOrders: salesOrdersCount, // ✅ Données réelles depuis Supabase
    monthRevenue: stockOrdersMetrics?.month_revenue || 0
  }

  const sourcingData = {
    productsToSource: stockOrdersMetrics?.products_to_source || 0,
    samplesWaiting: 0 // TODO #VERONE-SOURCING-001: Implémenter tracking échantillons en attente
  }

  const metrics: CompleteDashboardMetrics = {
    catalogue: {
      totalProducts: catalogueMetrics?.products.total || 0,
      activeProducts: catalogueMetrics?.products.active || 0,
      publishedProducts: catalogueMetrics?.products.published || 0,
      collections: catalogueMetrics?.collections.total || 0,
      variantGroups: catalogueMetrics?.variantGroups.total || 0,
      trend: catalogueMetrics?.products.trend || 0
    },
    organisations: organisationsStats,
    stocks: stocksData,
    orders: ordersData,
    sourcing: sourcingData,
    // Compatibilité avec sections de détail du dashboard
    collections: {
      total: catalogueMetrics?.collections.total || 0,
      active: catalogueMetrics?.collections.active || 0
    },
    variantGroups: {
      total: catalogueMetrics?.variantGroups.total || 0
    },
    products: {
      trend: catalogueMetrics?.products.trend || 0
    }
  }

  const isLoading = catalogueLoading || organisationsLoading || stockOrdersLoading || salesOrdersLoading
  const error = catalogueError

  return {
    metrics,
    isLoading: isLoading,
    error
  }
}
