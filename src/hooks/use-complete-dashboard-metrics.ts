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

  // Phase 2 - Mock data intelligent basé sur données réelles
  const stocksMock = {
    totalValue: catalogueMetrics ? catalogueMetrics.products.total * 500 : 14500, // ~500€ par produit
    lowStockItems: Math.floor((catalogueMetrics?.products.total || 29) * 0.27), // ~27% en rupture
    recentMovements: Math.floor((catalogueMetrics?.products.total || 29) * 1.2) // ~1.2 mouvements par produit/mois
  }

  const ordersMock = {
    purchaseOrders: Math.floor(organisationsStats.suppliers * 0.33), // ~33% fournisseurs ont commande active
    salesOrders: Math.floor(organisationsStats.customersB2B * 1.5), // ~1.5 commande par client
    monthRevenue: catalogueMetrics ? catalogueMetrics.products.published * 980 : 28420 // ~980€ par produit publié
  }

  const sourcingMock = {
    productsToSource: Math.floor((catalogueMetrics?.products.total || 29) * 0.52), // ~52% à sourcer
    samplesWaiting: Math.floor(organisationsStats.suppliers * 0.47) // ~47% fournisseurs ont échantillon en attente
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
    stocks: stocksMock,
    orders: ordersMock,
    sourcing: sourcingMock,
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
