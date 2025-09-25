/**
 * Hook unifié pour la gestion du stock (réel + prévisionnel)
 * Intègre toute la logique de stock avancée pour Vérone
 */

import { useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import type { StockReasonCode } from './use-stock-movements'

// Types pour le stock unifié
export interface StockData {
  product_id: string
  stock_real: number
  stock_forecasted_in: number
  stock_forecasted_out: number
  stock_available: number
  stock_total_forecasted: number
  min_stock: number

  // Méta-données
  product_name?: string
  product_sku?: string
  last_movement_at?: string
}

export interface StockSummary {
  total_products: number
  total_stock_value: number
  low_stock_count: number
  out_of_stock_count: number
  forecasted_shortage_count: number
  total_real: number
  total_forecasted_in: number
  total_forecasted_out: number
}

export interface ManualMovementData {
  product_id: string
  movement_type: 'add' | 'remove' | 'adjust'
  quantity: number
  reason_code: StockReasonCode
  notes?: string
  unit_cost?: number
}

export function useStock() {
  const [loading, setLoading] = useState(false)
  const [stockData, setStockData] = useState<StockData[]>([])
  const [summary, setSummary] = useState<StockSummary | null>(null)
  const { toast } = useToast()
  const supabase = useMemo(() => createClient(), [])

  // Récupérer le stock de tous les produits
  const fetchAllStock = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          sku,
          stock_real,
          stock_forecasted_in,
          stock_forecasted_out,
          min_stock,
          cost_price,
          updated_at
        `)
        .order('name')

      if (error) throw error

      // Calculer le stock disponible pour chaque produit
      const enrichedData: StockData[] = await Promise.all(
        (data || []).map(async (product) => {
          const stockAdvanced = await getProductStockAdvanced(product.id)

          return {
            product_id: product.id,
            product_name: product.name,
            product_sku: product.sku,
            stock_real: stockAdvanced.stock_real,
            stock_forecasted_in: stockAdvanced.stock_forecasted_in,
            stock_forecasted_out: stockAdvanced.stock_forecasted_out,
            stock_available: stockAdvanced.stock_available,
            stock_total_forecasted: stockAdvanced.stock_total_forecasted,
            min_stock: product.min_stock || 5,
            last_movement_at: undefined // TODO: Récupérer le dernier mouvement si nécessaire
          }
        })
      )

      setStockData(enrichedData)

      // Calculer le résumé
      const summaryData = calculateStockSummary(enrichedData)
      setSummary(summaryData)

    } catch (error) {
      console.error('Erreur lors de la récupération du stock:', error)
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les données de stock",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [supabase, toast])

  // Récupérer le stock avancé d'un produit spécifique
  const getProductStockAdvanced = useCallback(async (productId: string) => {
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
      console.error('Erreur stock avancé:', error)
      return {
        stock_real: 0,
        stock_forecasted_in: 0,
        stock_forecasted_out: 0,
        stock_available: 0,
        stock_total_forecasted: 0
      }
    }
  }, [supabase])

  // Calculer résumé stock
  const calculateStockSummary = useCallback((data: StockData[]): StockSummary => {
    return data.reduce((acc, item) => {
      acc.total_products++
      acc.total_real += item.stock_real
      acc.total_forecasted_in += item.stock_forecasted_in
      acc.total_forecasted_out += item.stock_forecasted_out

      // Alertes stock
      if (item.stock_real <= 0) {
        acc.out_of_stock_count++
      } else if (item.stock_real <= item.min_stock) {
        acc.low_stock_count++
      }

      // Prévision rupture stock
      if (item.stock_available <= item.min_stock) {
        acc.forecasted_shortage_count++
      }

      return acc
    }, {
      total_products: 0,
      total_stock_value: 0,
      low_stock_count: 0,
      out_of_stock_count: 0,
      forecasted_shortage_count: 0,
      total_real: 0,
      total_forecasted_in: 0,
      total_forecasted_out: 0
    })
  }, [])

  // Mouvement manuel de stock
  const createManualMovement = useCallback(async (movementData: ManualMovementData) => {
    setLoading(true)
    try {
      // Récupérer l'utilisateur actuel
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('Utilisateur non authentifié')

      // Récupérer le stock actuel
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock_real, name')
        .eq('id', movementData.product_id)
        .single()

      if (productError) {
        console.error('Erreur récupération produit:', productError)
        throw new Error('Produit introuvable')
      }

      const currentStock = product.stock_real || 0
      let quantityChange: number
      let newQuantity: number

      // Calculer le mouvement selon le type
      switch (movementData.movement_type) {
        case 'add':
          quantityChange = Math.abs(movementData.quantity)
          newQuantity = currentStock + quantityChange
          break

        case 'remove':
          quantityChange = Math.abs(movementData.quantity) // Positive value - trigger handles subtraction
          newQuantity = currentStock - quantityChange
          if (newQuantity < 0) {
            throw new Error(`Stock insuffisant. Disponible: ${currentStock}, Demandé: ${movementData.quantity}`)
          }
          break

        case 'adjust':
          newQuantity = Math.abs(movementData.quantity)
          quantityChange = newQuantity - currentStock
          break

        default:
          throw new Error('Type de mouvement invalide')
      }

      console.log('Création mouvement:', {
        product_id: movementData.product_id,
        movement_type: movementData.movement_type,
        quantity_change: quantityChange,
        quantity_before: currentStock,
        quantity_after: newQuantity,
        reason_code: movementData.reason_code
      })

      // Créer le mouvement - le trigger mettra à jour stock_real automatiquement
      const { data: insertedMovement, error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          product_id: movementData.product_id,
          movement_type: movementData.movement_type === 'add' ? 'IN' :
                        movementData.movement_type === 'remove' ? 'OUT' : 'ADJUST',
          quantity_change: quantityChange,
          quantity_before: currentStock,
          quantity_after: newQuantity,
          unit_cost: movementData.unit_cost || null,
          reference_type: 'manual_adjustment',
          reference_id: crypto.randomUUID(),
          notes: movementData.notes || null,
          reason_code: movementData.reason_code || 'manual_adjustment',
          affects_forecast: false, // Mouvement manuel = stock réel uniquement
          performed_by: user.id
        })
        .select()
        .single()

      if (movementError) {
        // Logging détaillé pour debugging
        console.error('❌ Erreur insertion mouvement:', {
          message: movementError.message,
          details: movementError.details,
          hint: movementError.hint,
          code: movementError.code,
          data: movementError
        })

        // Gérer les erreurs spécifiques de validation
        if (movementError.message?.includes('Incohérence dans le calcul')) {
          throw new Error('Erreur de calcul du stock. Veuillez réessayer.')
        } else if (movementError.message?.includes('Stock insuffisant')) {
          throw new Error(`Stock insuffisant. Stock actuel: ${currentStock}`)
        } else if (movementError.message?.includes('ne peut pas être négatif')) {
          throw new Error('Le stock ne peut pas devenir négatif')
        } else if (movementError.message?.includes('row-level security policy')) {
          throw new Error('Permissions insuffisantes pour créer un mouvement de stock')
        } else if (movementError.code === 'PGRST301' || movementError.code === '42501') {
          throw new Error('Vous n\'avez pas les permissions nécessaires pour cette opération')
        } else {
          throw new Error(movementError.message || 'Erreur lors de la création du mouvement')
        }
      }

      console.log('Mouvement créé avec succès:', insertedMovement)

      // Message de succès personnalisé
      const actionText = movementData.movement_type === 'add' ? 'ajoutées' :
                        movementData.movement_type === 'remove' ? 'retirées' : 'ajusté à'

      toast({
        title: "✅ Stock mis à jour",
        description: movementData.movement_type === 'adjust'
          ? `Stock ajusté à ${newQuantity} unités pour ${product.name}`
          : `${Math.abs(movementData.quantity)} unités ${actionText} pour ${product.name}. Nouveau stock: ${newQuantity}`
      })

      // Rafraîchir les données après un court délai pour laisser le trigger s'exécuter
      setTimeout(async () => {
        // Éviter la boucle infinie en appelant directement au lieu d'utiliser la dépendance
        setLoading(true)
        try {
          const { data, error } = await supabase
            .from('products')
            .select(`
              id,
              name,
              sku,
              stock_real,
              stock_forecasted_in,
              stock_forecasted_out,
              min_stock,
              cost_price,
              updated_at
            `)
            .order('name')

          if (error) throw error

          // Calculer le stock disponible pour chaque produit
          const enrichedData: StockData[] = await Promise.all(
            (data || []).map(async (product) => {
              const stockAdvanced = await getProductStockAdvanced(product.id)

              return {
                product_id: product.id,
                product_name: product.name,
                product_sku: product.sku,
                stock_real: stockAdvanced.stock_real,
                stock_forecasted_in: stockAdvanced.stock_forecasted_in,
                stock_forecasted_out: stockAdvanced.stock_forecasted_out,
                stock_available: stockAdvanced.stock_available,
                stock_total_forecasted: stockAdvanced.stock_total_forecasted,
                min_stock: product.min_stock || 5,
                last_movement_at: undefined
              }
            })
          )

          setStockData(enrichedData)

          // Calculer le résumé
          const summaryData = calculateStockSummary(enrichedData)
          setSummary(summaryData)

        } catch (error) {
          console.error('Erreur refresh stock après mouvement:', error)
        } finally {
          setLoading(false)
        }
      }, 500)

      return insertedMovement

    } catch (error: any) {
      console.error('❌ Erreur mouvement manuel:', error)
      toast({
        title: "❌ Erreur",
        description: error.message || "Impossible d'effectuer le mouvement de stock",
        variant: "destructive"
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [supabase, toast, fetchAllStock])

  // Mouvement prévisionnel (commandes)
  const createForecastMovement = useCallback(async (
    productId: string,
    quantity: number,
    type: 'in' | 'out',
    referenceType: string,
    referenceId: string,
    notes?: string
  ) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('Utilisateur non authentifié')

      // Créer mouvement prévisionnel
      const { error } = await supabase
        .from('stock_movements')
        .insert({
          product_id: productId,
          movement_type: type === 'in' ? 'IN' : 'OUT',
          quantity_change: type === 'in' ? quantity : -quantity,
          quantity_before: 0, // N'affecte pas le stock réel
          quantity_after: 0,  // N'affecte pas le stock réel
          reference_type: referenceType,
          reference_id: referenceId,
          notes: notes,
          reason_code: type === 'in' ? 'purchase_reception' : 'sale',
          affects_forecast: true,
          forecast_type: type,
          performed_by: user.id
        })

      if (error) throw error

      // Rafraîchir données
      await fetchAllStock()

    } catch (error) {
      console.error('Erreur mouvement prévisionnel:', error)
      throw error
    }
  }, [supabase, fetchAllStock])

  // Alertes stock
  const getStockAlerts = useCallback(() => {
    return stockData.filter(item => {
      // Stock critique (épuisé)
      if (item.stock_real <= 0) return true

      // Stock faible
      if (item.stock_real <= item.min_stock) return true

      // Prévision rupture
      if (item.stock_available <= item.min_stock) return true

      return false
    }).map(item => ({
      ...item,
      alert_type: item.stock_real <= 0 ? 'critical' :
                 item.stock_real <= item.min_stock ? 'low' : 'forecast',
      alert_message: item.stock_real <= 0 ? 'Stock épuisé' :
                    item.stock_real <= item.min_stock ? 'Stock faible' :
                    'Rupture prévisionnelle'
    }))
  }, [stockData])

  // Produits avec stock disponible
  const getAvailableProducts = useCallback((minQuantity = 1) => {
    return stockData.filter(item => item.stock_available >= minQuantity)
  }, [stockData])

  // Recherche produit par stock
  const findProductsByStock = useCallback((filters: {
    minReal?: number
    maxReal?: number
    hasForecasted?: boolean
    lowStock?: boolean
  }) => {
    return stockData.filter(item => {
      if (filters.minReal !== undefined && item.stock_real < filters.minReal) return false
      if (filters.maxReal !== undefined && item.stock_real > filters.maxReal) return false
      if (filters.hasForecasted && (item.stock_forecasted_in + item.stock_forecasted_out) === 0) return false
      if (filters.lowStock && item.stock_real > item.min_stock) return false
      return true
    })
  }, [stockData])

  return {
    // État
    loading,
    stockData,
    summary,

    // Actions principales
    fetchAllStock,
    getProductStockAdvanced,
    createManualMovement,
    createForecastMovement,

    // Helpers & Analytics
    getStockAlerts,
    getAvailableProducts,
    findProductsByStock,
    calculateStockSummary
  }
}