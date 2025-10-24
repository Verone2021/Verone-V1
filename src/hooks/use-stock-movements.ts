/**
 * Hook pour la gestion des mouvements de stock
 * Gère les entrées, sorties, ajustements et transferts de stock
 */

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

// Types pour les mouvements de stock
export type MovementType = 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER'

// Motifs détaillés pour les mouvements (enum de la DB)
export type StockReasonCode =
  // Sorties normales
  | 'sale' | 'transfer_out'
  // Pertes & Dégradations
  | 'damage_transport' | 'damage_handling' | 'damage_storage' | 'theft' | 'loss_unknown'
  // Usage Commercial
  | 'sample_client' | 'sample_showroom' | 'marketing_event' | 'photography'
  // R&D & Production
  | 'rd_testing' | 'prototype' | 'quality_control'
  // Retours & SAV
  | 'return_supplier' | 'return_customer' | 'warranty_replacement'
  // Ajustements & Corrections
  | 'inventory_correction' | 'write_off' | 'obsolete'
  // Entrées spéciales
  | 'purchase_reception' | 'return_from_client' | 'found_inventory' | 'manual_adjustment'

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
  reason_code?: StockReasonCode
  affects_forecast?: boolean
  forecast_type?: 'in' | 'out'
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
  reason_code?: StockReasonCode
  affects_forecast?: boolean
  forecast_type?: 'in' | 'out'
}

export interface StockMovementFilters {
  product_id?: string
  movement_type?: MovementType
  reference_type?: string
  reason_code?: StockReasonCode
  affects_forecast?: boolean
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
            product_images!left (
              public_url,
              is_primary
            )
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
      if (filters?.affects_forecast !== undefined) {
        query = query.eq('affects_forecast', filters.affects_forecast)
      }

      const { data, error } = await query

      if (error) throw error

      // Enrichir les produits avec primary_image_url (BR-TECH-002)
      const enrichedMovements = (data || []).map(movement => ({
        ...movement,
        products: movement.products ? {
          ...movement.products,
          primary_image_url: movement.products.product_images?.[0]?.public_url || null
        } : null
      }))

      setMovements(enrichedMovements)
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
      // 1. Récupérer le stock actuel du produit (priorité stock_real)
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock_real, stock_quantity, stock_forecasted_in, stock_forecasted_out')
        .eq('id', data.product_id)
        .single()

      if (productError) throw productError

      const currentStock = product.stock_real || product.stock_quantity || 0

      // 2. Calculer la nouvelle quantité selon le type de mouvement
      let newQuantity: number
      let quantityChange: number

      switch (data.movement_type) {
        case 'IN':
          quantityChange = Math.abs(data.quantity_change)
          newQuantity = currentStock + quantityChange
          break
        case 'OUT':
          const quantityToRemove = Math.abs(data.quantity_change)

          // Validation stricte ERP : impossible de retirer plus que le stock disponible
          if (quantityToRemove > currentStock) {
            throw new Error(
              `Stock insuffisant. Vous tentez de retirer ${quantityToRemove} unités mais seulement ${currentStock} unité(s) disponible(s) en stock.`
            )
          }

          quantityChange = -quantityToRemove
          newQuantity = currentStock + quantityChange
          break
        case 'ADJUST':
          // Pour un ajustement, quantity_change représente la nouvelle quantité souhaitée
          const newTargetQuantity = Math.abs(data.quantity_change)

          // Validation : quantité cible doit être >= 0
          if (newTargetQuantity < 0) {
            throw new Error('La quantité cible d\'un ajustement doit être supérieure ou égale à 0')
          }

          newQuantity = newTargetQuantity
          quantityChange = newQuantity - currentStock
          break
        case 'TRANSFER':
          // Pour un transfert, on gère comme une sortie pour l'instant
          const quantityToTransfer = Math.abs(data.quantity_change)

          // Validation stricte ERP : impossible de transférer plus que le stock disponible
          if (quantityToTransfer > currentStock) {
            throw new Error(
              `Stock insuffisant pour le transfert. Vous tentez de transférer ${quantityToTransfer} unités mais seulement ${currentStock} unité(s) disponible(s) en stock.`
            )
          }

          quantityChange = -quantityToTransfer
          newQuantity = currentStock + quantityChange
          break
        default:
          throw new Error('Type de mouvement invalide')
      }

      // 3. Créer le mouvement de stock avec nouvelles colonnes
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
          reason_code: data.reason_code,
          affects_forecast: data.affects_forecast || false,
          forecast_type: data.forecast_type,
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

  // Récupérer le stock disponible avancé (réel - prévisionnel)
  const getAvailableStock = useCallback(async (productId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_available_stock_advanced', { p_product_id: productId })

      if (error) throw error

      return data?.[0] || {
        stock_real: 0,
        stock_forecasted_in: 0,
        stock_forecasted_out: 0,
        stock_available: 0,
        stock_total_forecasted: 0
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du stock disponible:', error)
      return {
        stock_real: 0,
        stock_forecasted_in: 0,
        stock_forecasted_out: 0,
        stock_available: 0,
        stock_total_forecasted: 0
      }
    }
  }, [supabase])

  // Récupérer l'historique d'un produit spécifique
  const getProductHistory = useCallback(async (productId: string) => {
    setLoading(true)
    try {
      // Première requête : récupérer les mouvements de stock
      const { data: movements, error: movementsError } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('product_id', productId)
        .order('performed_at', { ascending: false })

      if (movementsError) throw movementsError

      if (!movements || movements.length === 0) {
        return []
      }

      // Récupérer les IDs utilisateurs uniques
      const userIds = [...new Set(movements.map(m => m.performed_by).filter(Boolean))]

      // Deuxième requête : récupérer les profils utilisateurs
      const { data: userProfiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds)

      if (profilesError) {
        console.warn('Erreur récupération profils:', profilesError)
      }

      // Combiner les données
      const enrichedMovements = movements.map(movement => ({
        ...movement,
        user_profiles: userProfiles?.find(profile => profile.user_id === movement.performed_by) || null
      }))

      return enrichedMovements
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

  // Obtenir la description d'un motif
  const getReasonDescription = useCallback((reasonCode: StockReasonCode): string => {
    const descriptions: Record<StockReasonCode, string> = {
      // Sorties normales
      'sale': 'Vente client',
      'transfer_out': 'Transfert sortant',
      // Pertes & Dégradations
      'damage_transport': 'Casse transport',
      'damage_handling': 'Casse manipulation',
      'damage_storage': 'Dégradation stockage',
      'theft': 'Vol/Disparition',
      'loss_unknown': 'Perte inexpliquée',
      // Usage Commercial
      'sample_client': 'Échantillon client',
      'sample_showroom': 'Échantillon showroom',
      'marketing_event': 'Événement marketing',
      'photography': 'Séance photo',
      // R&D & Production
      'rd_testing': 'Tests R&D',
      'prototype': 'Prototype',
      'quality_control': 'Contrôle qualité',
      // Retours & SAV
      'return_supplier': 'Retour fournisseur',
      'return_customer': 'Retour client SAV',
      'warranty_replacement': 'Remplacement garantie',
      // Ajustements
      'inventory_correction': 'Correction inventaire',
      'write_off': 'Mise au rebut',
      'obsolete': 'Produit obsolète',
      // Entrées spéciales
      'purchase_reception': 'Réception fournisseur',
      'return_from_client': 'Retour client',
      'found_inventory': 'Trouvaille inventaire',
      'manual_adjustment': 'Ajustement manuel'
    }
    return descriptions[reasonCode] || 'Motif inconnu'
  }, [])

  // Obtenir les motifs groupés par catégorie
  const getReasonsByCategory = useCallback(() => {
    return {
      sorties_normales: [
        { code: 'sale' as StockReasonCode, label: 'Vente client' },
        { code: 'transfer_out' as StockReasonCode, label: 'Transfert sortant' }
      ],
      pertes_degradations: [
        { code: 'damage_transport' as StockReasonCode, label: 'Casse transport' },
        { code: 'damage_handling' as StockReasonCode, label: 'Casse manipulation' },
        { code: 'damage_storage' as StockReasonCode, label: 'Dégradation stockage' },
        { code: 'theft' as StockReasonCode, label: 'Vol/Disparition' },
        { code: 'loss_unknown' as StockReasonCode, label: 'Perte inexpliquée' }
      ],
      usage_commercial: [
        { code: 'sample_client' as StockReasonCode, label: 'Échantillon client' },
        { code: 'sample_showroom' as StockReasonCode, label: 'Échantillon showroom' },
        { code: 'marketing_event' as StockReasonCode, label: 'Événement marketing' },
        { code: 'photography' as StockReasonCode, label: 'Séance photo' }
      ],
      rd_production: [
        { code: 'rd_testing' as StockReasonCode, label: 'Tests R&D' },
        { code: 'prototype' as StockReasonCode, label: 'Prototype' },
        { code: 'quality_control' as StockReasonCode, label: 'Contrôle qualité' }
      ],
      retours_sav: [
        { code: 'return_supplier' as StockReasonCode, label: 'Retour fournisseur' },
        { code: 'return_customer' as StockReasonCode, label: 'Retour client SAV' },
        { code: 'warranty_replacement' as StockReasonCode, label: 'Remplacement garantie' }
      ],
      ajustements: [
        { code: 'inventory_correction' as StockReasonCode, label: 'Correction inventaire' },
        { code: 'write_off' as StockReasonCode, label: 'Mise au rebut' },
        { code: 'obsolete' as StockReasonCode, label: 'Produit obsolète' }
      ],
      entrees_speciales: [
        { code: 'purchase_reception' as StockReasonCode, label: 'Réception fournisseur' },
        { code: 'return_from_client' as StockReasonCode, label: 'Retour client' },
        { code: 'found_inventory' as StockReasonCode, label: 'Trouvaille inventaire' },
        { code: 'manual_adjustment' as StockReasonCode, label: 'Ajustement manuel' }
      ]
    }
  }, [])

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
    adjustStock,

    // Helpers motifs
    getReasonDescription,
    getReasonsByCategory
  }
}