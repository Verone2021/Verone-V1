'use client'

import { useMemo, useCallback } from 'react'
import { useSupabaseQuery, useSupabaseMutation, clearQueryCache } from './use-supabase-query'
import { useToast } from './use-toast'

export interface StockMovement {
  id: string
  product_id: string
  movement_type: 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER'
  quantity_change: number
  quantity_before: number
  quantity_after: number
  unit_cost?: number
  reference_type?: string
  reference_id?: string
  notes?: string
  reason_code?: string
  affects_forecast?: boolean
  forecast_type?: 'in' | 'out'
  performed_by: string
  performed_at: string
  created_at: string
  updated_at: string
  // Relations calculées
  product_name?: string
  product_sku?: string
  performer_name?: string
}

export interface StockSummary {
  total_products: number
  total_quantity: number
  total_value: number
  low_stock_count: number
  out_of_stock_count: number
  movements_today: number
  movements_week: number
}

export interface LowStockProduct {
  id: string
  name: string
  sku: string
  stock_real: number
  min_stock: number
  reorder_point: number
  supplier_name?: string
  last_movement_date?: string
}

export interface StockFilters {
  productId?: string
  movementTypes?: string[]
  reasonCodes?: string[]
  performedBy?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
}

export function useStockOptimized(filters: StockFilters = {}) {
  const { toast } = useToast()

  // Query pour le résumé des stocks avec cache long terme
  const stockSummaryQuery = useSupabaseQuery(
    'stock-summary',
    async (supabase) => {
      // Requête optimisée pour éviter les scans de table
      const { data: summaryData, error } = await supabase.rpc('get_stock_summary')

      if (error) throw error

      return { data: summaryData, error: null }
    },
    {
      staleTime: 5 * 60 * 1000,  // 5 minutes
      cacheTime: 10 * 60 * 1000 // 10 minutes
    }
  )

  // Query pour les produits en stock faible
  const lowStockQuery = useSupabaseQuery(
    'low-stock-products',
    (async (supabase: ReturnType<typeof createClient>) => {
      // Requête corrigée : utiliser RPC pour comparaison inter-colonnes
      const { data, error } = await supabase
        .rpc('get_low_stock_products', { limit_count: 50 })

      if (error) {
        // Fallback si la fonction RPC n'existe pas
        console.warn('Fonction get_low_stock_products non disponible, utilisation requête alternative')

        const { data: fallbackData, error: fallbackError } = await supabase
          .from('products')
          .select(`
            id,
            name,
            sku,
            stock_real,
            min_stock,
            reorder_point,
            organisations!supplier_id(legal_name, trade_name)
          `)
          .eq('stock_real', 0)
          .is('archived_at', null)
          .order('stock_real', { ascending: true })
          .limit(25)

        if (fallbackError) throw fallbackError

        return {
          data: (fallbackData || []).map((product: any) => ({
            ...product,
            supplier_name: product.organisations?.trade_name || product.organisations?.legal_name
          })),
          error: null
        }
      }

      return { data: data || [], error: null }
    }) as any,
    {
      staleTime: 2 * 60 * 1000,  // 2 minutes
      cacheTime: 5 * 60 * 1000  // 5 minutes
    }
  )

  // Query pour les mouvements de stock avec filtres
  const stockMovementsQuery = useSupabaseQuery(
    `stock-movements:${JSON.stringify(filters)}`,
    async (supabase) => {
      let query = supabase
        .from('stock_movements')
        .select(`
          *,
          products!inner(id, name, sku),
          user_profiles!performed_by(first_name, last_name)
        `)

      // Appliquer les filtres
      if (filters.productId) {
        query = query.eq('product_id', filters.productId)
      }

      if (filters.movementTypes && filters.movementTypes.length > 0) {
        query = query.in('movement_type', filters.movementTypes as any)
      }

      if (filters.reasonCodes && filters.reasonCodes.length > 0) {
        query = query.in('reason_code', filters.reasonCodes as any)
      }

      if (filters.performedBy) {
        query = query.eq('performed_by', filters.performedBy)
      }

      if (filters.dateFrom) {
        query = query.gte('performed_at', filters.dateFrom)
      }

      if (filters.dateTo) {
        query = query.lte('performed_at', filters.dateTo)
      }

      // Pagination
      const limit = filters.limit || 100
      const offset = filters.offset || 0
      query = query.range(offset, offset + limit - 1)

      // Tri par défaut
      query = query.order('performed_at', { ascending: false })

      const { data, error, count } = await query

      if (error) throw error

      // Enrichir les données
      const enrichedMovements = (data || []).map(movement => ({
        ...movement,
        product_name: movement.products?.name,
        product_sku: movement.products?.sku,
        performer_name: movement.user_profiles
          ? `${movement.user_profiles.first_name} ${movement.user_profiles.last_name}`.trim()
          : 'Système'
      }))

      return { data: enrichedMovements, error: null, count }
    },
    {
      staleTime: 1 * 60 * 1000,  // 1 minute
      cacheTime: 3 * 60 * 1000  // 3 minutes
    }
  )

  // Mutations pour les mouvements de stock
  const createMovementMutation = useSupabaseMutation<StockMovement>(
    (async (supabase: ReturnType<typeof createClient>, movementData: {
      product_id: string
      movement_type: 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER'
      quantity_change: number
      unit_cost?: number
      reference_type?: string
      reference_id?: string
      notes?: string
      reason_code?: string
      affects_forecast?: boolean
      forecast_type?: 'in' | 'out'
    }) => {
      // Obtenir le stock actuel du produit
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock_real')
        .eq('id', movementData.product_id)
        .single()

      if (productError) throw productError

      const currentStock = product.stock_real || 0
      const newStock = currentStock + movementData.quantity_change

      if (newStock < 0) {
        throw new Error('Stock insuffisant pour cette opération')
      }

      // Créer le mouvement
      const { data, error } = await supabase
        .from('stock_movements')
        .insert([{
          ...movementData,
          quantity_before: currentStock,
          quantity_after: newStock,
          performed_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error

      // Mettre à jour le stock du produit
      const { error: updateError } = await supabase
        .from('products')
        .update({
          stock_real: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', movementData.product_id)

      if (updateError) throw updateError

      return { data, error: null }
    }) as any
  )

  const adjustStockMutation = useSupabaseMutation<boolean>(
    async (supabase, { productId, newQuantity, reason, notes }: {
      productId: string
      newQuantity: number
      reason: string
      notes?: string
    }) => {
      // Obtenir le stock actuel
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock_real')
        .eq('id', productId)
        .single()

      if (productError) throw productError

      const currentStock = product.stock_real || 0
      const adjustment = newQuantity - currentStock

      if (adjustment === 0) {
        return { data: true, error: null }
      }

      // Créer le mouvement d'ajustement
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert([{
          product_id: productId,
          movement_type: 'ADJUST',
          quantity_change: adjustment,
          quantity_before: currentStock,
          quantity_after: newQuantity,
          reason_code: reason,
          notes: notes,
          performed_at: new Date().toISOString()
        }])

      if (movementError) throw movementError

      // Mettre à jour le stock
      const { error: updateError } = await supabase
        .from('products')
        .update({
          stock_real: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)

      if (updateError) throw updateError

      return { data: true, error: null }
    }
  )

  // Actions avec feedback utilisateur
  const createMovement = useCallback(async (movementData: Parameters<typeof createMovementMutation.mutate>[0]) => {
    const result = await createMovementMutation.mutate(movementData)

    if (result) {
      toast({
        title: "Succès",
        description: "Mouvement de stock enregistré avec succès"
      })
      clearQueryCache('stock')
    } else {
      toast({
        title: "Erreur",
        description: createMovementMutation.error || "Impossible d'enregistrer le mouvement",
        variant: "destructive"
      })
    }

    return result
  }, [createMovementMutation, toast])

  const adjustStock = useCallback(async (params: Parameters<typeof adjustStockMutation.mutate>[0]) => {
    const result = await adjustStockMutation.mutate(params)

    if (result) {
      toast({
        title: "Succès",
        description: "Stock ajusté avec succès"
      })
      clearQueryCache('stock')
    } else {
      toast({
        title: "Erreur",
        description: adjustStockMutation.error || "Impossible d'ajuster le stock",
        variant: "destructive"
      })
    }

    return result
  }, [adjustStockMutation, toast])

  // Statistiques calculées
  const stats = useMemo(() => {
    const movements = stockMovementsQuery.data || []
    const today = new Date().toDateString()
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    return {
      recent_movements: movements.length,
      recent_entries: movements.filter(m => m.movement_type === 'IN').length,
      recent_exits: movements.filter(m => m.movement_type === 'OUT').length,
      movements_today: movements.filter(m =>
        new Date(m.performed_at).toDateString() === today
      ).length,
      movements_week: movements.filter(m =>
        new Date(m.performed_at) >= weekAgo
      ).length,
      avg_daily_movements: movements.length / 7
    }
  }, [stockMovementsQuery.data])

  // Helpers
  const getMovementsByProduct = useCallback((productId: string) => {
    return (stockMovementsQuery.data || []).filter(m => m.product_id === productId)
  }, [stockMovementsQuery.data])

  const getMovementsByType = useCallback((type: string) => {
    return (stockMovementsQuery.data || []).filter(m => m.movement_type === type)
  }, [stockMovementsQuery.data])

  return {
    // Données
    stockSummary: stockSummaryQuery.data,
    lowStockProducts: lowStockQuery.data || [],
    movements: stockMovementsQuery.data || [],

    // États de chargement
    loading: stockSummaryQuery.loading || lowStockQuery.loading || stockMovementsQuery.loading,
    error: stockSummaryQuery.error || lowStockQuery.error || stockMovementsQuery.error,

    // Actions
    createMovement,
    adjustStock,
    refetch: () => {
      stockSummaryQuery.refetch()
      lowStockQuery.refetch()
      stockMovementsQuery.refetch()
    },

    // Helpers
    getMovementsByProduct,
    getMovementsByType,
    stats,

    // States des mutations pour feedback UI
    mutations: {
      creatingMovement: createMovementMutation.loading,
      adjustingStock: adjustStockMutation.loading
    }
  }
}