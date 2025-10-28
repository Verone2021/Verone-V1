/**
 * Hook Dashboard avec VRAIES données Supabase
 * Version optimisée pour remplacer les mocks
 */

'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'

export interface RealDashboardMetrics {
  products: {
    total: number
    active: number      // in_stock + preorder + coming_soon + pret_a_commander
    published: number   // tous sauf sourcing/echantillon_a_commander
    archived: number    // discontinued
    trend: number       // Pourcentage nouveaux produits (7 derniers jours)
  }
  variantGroups: {
    total: number
  }
  collections: {
    total: number
    active: number      // is_active = true
  }
}

// 📊 Fetcher optimisé - Query unique avec agrégations
const metricsFetcher = async () => {
  const supabase = createClient()

  // 🎯 Query 1: Métriques produits (avec statuts enum réels)
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, status, created_at')

  if (productsError) throw productsError

  // 🎯 Query 2: Métriques variant groups
  const { data: variantGroups, error: variantGroupsError } = await supabase
    .from('variant_groups')
    .select('id')

  if (variantGroupsError) throw variantGroupsError

  // 🎯 Query 3: Métriques collections
  const { data: collections, error: collectionsError } = await supabase
    .from('collections')
    .select('id, is_active')

  if (collectionsError) throw collectionsError

  // 📈 Calculs côté client (rapide)
  const totalProducts = products?.length || 0

  // Produits actifs: disponibles à la vente
  const activeProducts = products?.filter(p =>
    (['in_stock', 'preorder', 'coming_soon', 'pret_a_commander'] as any).includes(p.status)
  )?.length || 0

  // Produits publiés: tous sauf sourcing
  const publishedProducts = products?.filter(p =>
    !(['sourcing', 'echantillon_a_commander'] as any).includes(p.status)
  )?.length || 0

  // Produits archivés
  const archivedProducts = products?.filter(p => p.status === 'discontinued')?.length || 0

  // Trend: nouveaux produits derniers 7 jours
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const recentProducts = products?.filter(p =>
    new Date(p.created_at) >= weekAgo
  )?.length || 0
  const trend = totalProducts > 0 ? Math.round((recentProducts / totalProducts) * 100) : 0

  // Variant groups metrics (pas de filtre published car colonne inexistante)
  const totalVariantGroups = variantGroups?.length || 0

  // Collections metrics
  const totalCollections = collections?.length || 0
  const activeCollections = collections?.filter(c => c.is_active)?.length || 0

  return {
    products: {
      total: totalProducts,
      active: activeProducts,
      published: publishedProducts,
      archived: archivedProducts,
      trend
    },
    variantGroups: {
      total: totalVariantGroups
    },
    collections: {
      total: totalCollections,
      active: activeCollections
    }
  }
}

export function useRealDashboardMetrics() {
  const { data, error, isLoading, mutate } = useSWR(
    'real-dashboard-metrics',
    metricsFetcher,
    {
      refreshInterval: 60000,         // Refresh toutes les 60s
      revalidateOnFocus: false,        // Pas de re-fetch au focus
      revalidateOnReconnect: true,
      dedupingInterval: 10000,         // Dédupe 10s
      keepPreviousData: true           // Garde données pendant refresh
    }
  )

  return {
    metrics: data || null,
    isLoading,
    error,
    refetch: () => mutate()
  }
}
