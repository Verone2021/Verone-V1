/**
 * Hook pour la gestion des mouvements de stock
 * Gère les entrées, sorties, ajustements et transferts de stock
 */

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

// Types pour les mouvements de stock
export type MovementType = 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER'

export interface StockMovement {
  id: string
  product_id: string
  warehouse_id?: string
  movement_type: MovementType
  quantity_change: number
  quantity_before: number
  quantity_after: number
  unit_cost?: number
  reference_type?: string
  reference_id?: string
  notes?: string
  performed_by: string
  performed_at: string
  created_at: string
  updated_at: string

  // Relations jointes
  products?: {
    id: string
    name: string
    sku: string
    primary_image_url?: string
  }
  user_profiles?: {
    first_name?: string
    last_name?: string
  }
}

export interface CreateStockMovementData {
  product_id: string
  movement_type: MovementType
  quantity_change: number
  unit_cost?: number
  reference_type?: string
  reference_id?: string
  notes?: string
}

export interface StockMovementFilters {
  product_id?: string
  movement_type?: MovementType
  reference_type?: string
  date_from?: string
  date_to?: string
  performed_by?: string
}

interface StockMovementStats {
  total_movements: number
  total_in: number
  total_out: number
  total_adjustments: number
  total_transfers: number
}

export function useStockMovements() {
  const [loading, setLoading] = useState(false)
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [stats, setStats] = useState<StockMovementStats | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  // Récupérer tous les mouvements avec filtres
  const fetchMovements = useCallback(async (filters?: StockMovementFilters) => {
    setLoading(true)
    try {
      let query = supabase
        .from('stock_movements')
        .select(`
          *,
          products (
            id,
            name,
            sku,
            primary_image_url
          ),
          user_profiles!stock_movements_performed_by_fkey (
            first_name,
            last_name
          )
        `)
        .order('performed_at', { ascending: false })

      // Appliquer les filtres
      if (filters?.product_id) {
        query = query.eq('product_id', filters.product_id)
      }
      if (filters?.movement_type) {
        query = query.eq('movement_type', filters.movement_type)
      }
      if (filters?.reference_type) {
        query = query.eq('reference_type', filters.reference_type)
      }
      if (filters?.date_from) {
        query = query.gte('performed_at', filters.date_from)
      }
      if (filters?.date_to) {
        query = query.lte('performed_at', filters.date_to)
      }
      if (filters?.performed_by) {
        query = query.eq('performed_by', filters.performed_by)
      }

      const { data, error } = await query

      if (error) throw error

      setMovements(data || [])
    } catch (error) {
      console.error('Erreur lors de la récupération des mouvements:', error)
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les mouvements de stock",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [supabase, toast])

  // Récupérer les statistiques des mouvements
  const fetchStats = useCallback(async (filters?: StockMovementFilters) => {
    try {
      let query = supabase
        .from('stock_movements')
        .select('movement_type, quantity_change')

      // Appliquer les mêmes filtres que pour les mouvements
      if (filters?.product_id) {
        query = query.eq('product_id', filters.product_id)
      }
      if (filters?.date_from) {
        query = query.gte('performed_at', filters.date_from)
      }
      if (filters?.date_to) {
        query = query.lte('performed_at', filters.date_to)
      }

      const { data, error } = await query

      if (error) throw error

      // Calculer les statistiques
      const statsData = data?.reduce((acc, movement) => {
        acc.total_movements++
        switch (movement.movement_type) {
          case 'IN':
            acc.total_in += Math.abs(movement.quantity_change)
            break
          case 'OUT':
            acc.total_out += Math.abs(movement.quantity_change)
            break
          case 'ADJUST':
            acc.total_adjustments++
            break
          case 'TRANSFER':
            acc.total_transfers++
            break
        }
        return acc
      }, {
        total_movements: 0,
        total_in: 0,
        total_out: 0,
        total_adjustments: 0,
        total_transfers: 0
      })

      setStats(statsData || null)
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
    }
  }, [supabase])

  // Créer un mouvement de stock
  const createMovement = useCallback(async (data: CreateStockMovementData) => {
    setLoading(true)
    try {
      // 1. Récupérer le stock actuel du produit
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', data.product_id)
        .single()

      if (productError) throw productError

      const currentStock = product.stock_quantity || 0

      // 2. Calculer la nouvelle quantité selon le type de mouvement
      let newQuantity: number
      let quantityChange: number

      switch (data.movement_type) {
        case 'IN':
          quantityChange = Math.abs(data.quantity_change)
          newQuantity = currentStock + quantityChange
          break
        case 'OUT':
          quantityChange = -Math.abs(data.quantity_change)
          newQuantity = currentStock + quantityChange
          if (newQuantity < 0) {
            throw new Error('Stock insuffisant pour cette sortie')
          }
          break
        case 'ADJUST':
          // Pour un ajustement, quantity_change représente la nouvelle quantité souhaitée
          newQuantity = Math.abs(data.quantity_change)
          quantityChange = newQuantity - currentStock
          break
        case 'TRANSFER':
          // Pour un transfert, on gère comme une sortie pour l'instant
          quantityChange = -Math.abs(data.quantity_change)
          newQuantity = currentStock + quantityChange
          if (newQuantity < 0) {
            throw new Error('Stock insuffisant pour ce transfert')
          }
          break
        default:
          throw new Error('Type de mouvement invalide')
      }

      // 3. Créer le mouvement de stock
      const { data: movement, error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          product_id: data.product_id,
          movement_type: data.movement_type,
          quantity_change: quantityChange,
          quantity_before: currentStock,
          quantity_after: newQuantity,
          unit_cost: data.unit_cost,
          reference_type: data.reference_type,
          reference_id: data.reference_id,
          notes: data.notes,
          performed_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single()

      if (movementError) throw movementError

      // Le trigger se charge automatiquement de mettre à jour le stock du produit

      toast({
        title: "Succès",
        description: "Mouvement de stock créé avec succès"
      })

      // Rafraîchir les données
      await fetchMovements()

      return movement
    } catch (error: any) {
      console.error('Erreur lors de la création du mouvement:', error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le mouvement de stock",
        variant: "destructive"
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [supabase, toast, fetchMovements])

  // Récupérer le stock disponible d'un produit (physique - réservé)
  const getAvailableStock = useCallback(async (productId: string): Promise<number> => {
    try {
      const { data, error } = await supabase
        .rpc('get_available_stock', { p_product_id: productId })

      if (error) throw error

      return data || 0
    } catch (error) {
      console.error('Erreur lors de la récupération du stock disponible:', error)
      return 0
    }
  }, [supabase])

  // Récupérer l'historique d'un produit spécifique
  const getProductHistory = useCallback(async (productId: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          user_profiles!stock_movements_performed_by_fkey (
            first_name,
            last_name
          )
        `)
        .eq('product_id', productId)
        .order('performed_at', { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error)
      toast({
        title: "Erreur",
        description: "Impossible de récupérer l'historique du produit",
        variant: "destructive"
      })
      return []
    } finally {
      setLoading(false)
    }
  }, [supabase, toast])

  // Fonctions utilitaires pour les mouvements courants
  const addStock = useCallback((productId: string, quantity: number, unitCost?: number, notes?: string) => {
    return createMovement({
      product_id: productId,
      movement_type: 'IN',
      quantity_change: quantity,
      unit_cost: unitCost,
      reference_type: 'manual_entry',
      notes: notes
    })
  }, [createMovement])

  const removeStock = useCallback((productId: string, quantity: number, referenceType?: string, referenceId?: string, notes?: string) => {
    return createMovement({
      product_id: productId,
      movement_type: 'OUT',
      quantity_change: quantity,
      reference_type: referenceType || 'manual_entry',
      reference_id: referenceId,
      notes: notes
    })
  }, [createMovement])

  const adjustStock = useCallback((productId: string, newQuantity: number, notes?: string) => {
    return createMovement({
      product_id: productId,
      movement_type: 'ADJUST',
      quantity_change: newQuantity,
      reference_type: 'inventory_adjustment',
      notes: notes
    })
  }, [createMovement])

  return {
    // État
    loading,
    movements,
    stats,

    // Actions principales
    fetchMovements,
    fetchStats,
    createMovement,
    getAvailableStock,
    getProductHistory,

    // Actions simplifiées
    addStock,
    removeStock,
    adjustStock
  }
}