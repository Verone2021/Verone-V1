/**
 * Hook unifié pour Dashboard CRM/ERP 2025
 * Combine données réelles Phase 1 + mock intelligent Phase 2
 */

import { useRealDashboardMetrics } from './use-real-dashboard-metrics'
import { useOrganisations } from './use-organisations'

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

  // Phase 2 - Mock intelligent
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

  // Phase 2 - Données réelles (0 pour base vide)
  // TODO Phase 2: Remplacer par vraies requêtes Supabase quand modules activés
  const stocksData = {
    totalValue: 0, // Base de données vide
    lowStockItems: 0,
    recentMovements: 0
  }

  const ordersData = {
    purchaseOrders: 0, // Base de données vide
    salesOrders: 0,
    monthRevenue: 0
  }

  const sourcingData = {
    productsToSource: 0, // Base de données vide
    samplesWaiting: 0
  }

  const metrics: CompleteDashboardMetrics = {
    catalogue: {
      totalProducts: catalogueMetrics?.products.total || 0,
      activeProducts: catalogueMetrics?.products.active || 0,
      publishedProducts: catalogueMetrics?.products.published || 0,
      collections: catalogueMetrics?.collections.total || 0,
      variantGroups: 4, // Mock pour variantes (à remplacer si hook disponible)
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
      total: 4 // Mock pour variantes (à remplacer si hook disponible)
    },
    products: {
      trend: catalogueMetrics?.products.trend || 0
    }
  }

  const isLoading = catalogueLoading || organisationsLoading
  const error = catalogueError

  return {
    metrics,
    isLoading,
    error
  }
}
