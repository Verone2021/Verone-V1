/**
 * Hook unifié pour Dashboard CRM/ERP 2025
 * Combine données réelles Phase 1 + données réelles Phase 2 (Stock/Commandes)
 */

import { useRealDashboardMetrics } from './use-real-dashboard-metrics'
import { useOrganisations } from './use-organisations'
import { useStockOrdersMetrics } from './use-stock-orders-metrics'

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
    salesOrders: 0, // TODO #VERONE-ORDERS-001: Implémenter comptage commandes vente
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

  const isLoading = catalogueLoading || organisationsLoading || stockOrdersLoading
  const error = catalogueError

  return {
    metrics,
    isLoading,
    error
  }
}
