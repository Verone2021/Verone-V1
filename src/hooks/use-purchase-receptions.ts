/**
 * 📦 Hook: Gestion Réceptions Achats (Purchase Orders)
 *
 * Features:
 * - Chargement items prêts à réception
 * - Calcul automatique différentiel (quantité restante = commandée - déjà reçue)
 * - Validation réceptions (partielles/complètes)
 * - Historique mouvements stock (traçabilité)
 * - Stats dashboard réceptions
 *
 * Workflow:
 * 1. Charger PO confirmé avec items enrichis
 * 2. Calculer quantités restantes (différentiel)
 * 3. User saisit quantités à recevoir
 * 4. Validation → Trigger stock + update statut
 */

'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ReceptionItem, ValidateReceptionPayload, ReceptionHistory, ReceptionShipmentStats } from '@/types/reception-shipment'

export interface PurchaseOrderForReception {
  id: string
  po_number: string
  status: string
  created_at: string
  expected_delivery_date: string | null
  received_at: string | null
  received_by: string | null

  // Supplier
  organisations: {
    id: string
    name: string
  } | null

  // Items enrichis pour réception
  purchase_order_items: Array<{
    id: string
    product_id: string
    quantity: number
    quantity_received: number | null
    unit_price_ht: number
    products: {
      id: string
      name: string
      sku: string
      stock_quantity: number
      stock_forecasted_in: number
    }
  }>
}

export function usePurchaseReceptions() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Charger un PO avec items pour formulaire réception
   */
  const loadPurchaseOrderForReception = useCallback(async (poId: string): Promise<PurchaseOrderForReception | null> => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('purchase_orders')
        .select(`
          id,
          po_number,
          status,
          created_at,
          expected_delivery_date,
          received_at,
          received_by,
          organisations (
            id,
            name
          ),
          purchase_order_items (
            id,
            product_id,
            quantity,
            quantity_received,
            unit_price_ht,
            products (
              id,
              name,
              sku,
              stock_quantity,
              stock_forecasted_in
            )
          )
        `)
        .eq('id', poId)
        .single()

      if (fetchError) {
        console.error('Erreur chargement PO pour réception:', fetchError)
        setError(fetchError.message)
        return null
      }

      return data as PurchaseOrderForReception
    } catch (err) {
      console.error('Exception chargement PO:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      return null
    } finally {
      setLoading(false)
    }
  }, [supabase])

  /**
   * Transformer items PO en ReceptionItems avec calculs
   */
  const prepareReceptionItems = useCallback((
    purchaseOrder: PurchaseOrderForReception
  ): ReceptionItem[] => {
    return purchaseOrder.purchase_order_items.map(item => {
      const quantityOrdered = item.quantity
      const quantityAlreadyReceived = item.quantity_received || 0
      const quantityRemaining = quantityOrdered - quantityAlreadyReceived

      return {
        purchase_order_item_id: item.id,
        product_id: item.product_id,
        product_name: item.products.name,
        product_sku: item.products.sku,
        quantity_ordered: quantityOrdered,
        quantity_already_received: quantityAlreadyReceived,
        quantity_remaining: quantityRemaining,
        quantity_to_receive: quantityRemaining, // Défaut: tout recevoir
        stock_forecast_impact: quantityRemaining, // Impact si tout reçu
        unit_price_ht: item.unit_price_ht
      }
    })
  }, [])

  /**
   * Valider réception (appel action server)
   */
  const validateReception = useCallback(async (
    payload: ValidateReceptionPayload
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setValidating(true)
      setError(null)

      // Appeler action server
      const response = await fetch('/api/purchase-receptions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur validation réception')
      }

      const result = await response.json()
      return { success: true }
    } catch (err) {
      console.error('Erreur validation réception:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setValidating(false)
    }
  }, [])

  /**
   * Charger historique réceptions (mouvements stock liés)
   */
  const loadReceptionHistory = useCallback(async (
    poId: string
  ): Promise<ReceptionHistory[]> => {
    try {
      // Récupérer mouvements stock IN (affects_forecast=false) pour ce PO
      const { data: movements, error: movementsError } = await supabase
        .from('stock_movements')
        .select(`
          id,
          quantity_change,
          quantity_before,
          quantity_after,
          performed_at,
          notes,
          performed_by,
          product_id,
          products (
            name,
            sku
          )
        `)
        .eq('reference_type', 'purchase_order')
        .eq('reference_id', poId)
        .eq('affects_forecast', false)
        .eq('movement_type', 'IN')
        .order('performed_at', { ascending: false })

      if (movementsError) {
        console.error('Erreur chargement historique:', movementsError)
        return []
      }

      // Grouper par performed_at (même réception)
      const grouped = new Map<string, ReceptionHistory>()

      movements?.forEach(movement => {
        const key = movement.performed_at

        if (!grouped.has(key)) {
          grouped.set(key, {
            movement_id: movement.id,
            received_at: movement.performed_at,
            received_by: movement.performed_by,
            received_by_name: 'Utilisateur', // TODO: Join user_profiles
            items: [],
            notes: movement.notes || undefined,
            total_quantity: 0
          })
        }

        const history = grouped.get(key)!
        history.items.push({
          product_name: (movement.products as any).name,
          product_sku: (movement.products as any).sku,
          quantity_received: movement.quantity_change,
          stock_before: movement.quantity_before,
          stock_after: movement.quantity_after
        })
        history.total_quantity += movement.quantity_change
      })

      return Array.from(grouped.values())
    } catch (err) {
      console.error('Exception historique réceptions:', err)
      return []
    }
  }, [supabase])

  /**
   * Charger stats dashboard réceptions
   */
  const loadReceptionStats = useCallback(async (): Promise<ReceptionShipmentStats> => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // POs confirmés en attente réception
      const { count: pending } = await supabase
        .from('purchase_orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'confirmed')

      // POs partiellement reçus
      const { count: partial } = await supabase
        .from('purchase_orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'partially_received')

      // POs complètement reçus aujourd'hui
      const { count: completedToday } = await supabase
        .from('purchase_orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'received')
        .gte('received_at', today.toISOString())

      // POs en retard (expected_delivery_date < today)
      const { count: overdue } = await supabase
        .from('purchase_orders')
        .select('id', { count: 'exact', head: true })
        .in('status', ['confirmed', 'partially_received'])
        .not('expected_delivery_date', 'is', null)
        .lt('expected_delivery_date', today.toISOString().split('T')[0])

      // POs urgents (expected_delivery_date < today + 3 jours)
      const threeDays = new Date(today)
      threeDays.setDate(threeDays.getDate() + 3)

      const { count: urgent } = await supabase
        .from('purchase_orders')
        .select('id', { count: 'exact', head: true })
        .in('status', ['confirmed', 'partially_received'])
        .not('expected_delivery_date', 'is', null)
        .gte('expected_delivery_date', today.toISOString().split('T')[0])
        .lte('expected_delivery_date', threeDays.toISOString().split('T')[0])

      return {
        total_pending: pending || 0,
        total_partial: partial || 0,
        total_completed_today: completedToday || 0,
        total_overdue: overdue || 0,
        total_urgent: urgent || 0
      }
    } catch (err) {
      console.error('Erreur chargement stats réceptions:', err)
      return {
        total_pending: 0,
        total_partial: 0,
        total_completed_today: 0,
        total_overdue: 0,
        total_urgent: 0
      }
    }
  }, [supabase])

  /**
   * Charger liste POs prêts à réception (pour page /stocks/receptions)
   */
  const loadPurchaseOrdersReadyForReception = useCallback(async (filters?: {
    status?: string
    search?: string
    urgent_only?: boolean
    overdue_only?: boolean
  }) => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('purchase_orders')
        .select(`
          id,
          po_number,
          status,
          created_at,
          expected_delivery_date,
          received_at,
          organisations (
            id,
            name
          ),
          purchase_order_items (
            quantity,
            quantity_received
          )
        `)
        .in('status', ['confirmed', 'partially_received'])
        .order('expected_delivery_date', { ascending: true, nullsFirst: false })

      // Filtres
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.search) {
        query = query.or(`po_number.ilike.%${filters.search}%,organisations.name.ilike.%${filters.search}%`)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        console.error('Erreur chargement POs:', fetchError)
        setError(fetchError.message)
        return []
      }

      return data || []
    } catch (err) {
      console.error('Exception chargement POs:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      return []
    } finally {
      setLoading(false)
    }
  }, [supabase])

  return {
    loading,
    validating,
    error,
    loadPurchaseOrderForReception,
    prepareReceptionItems,
    validateReception,
    loadReceptionHistory,
    loadReceptionStats,
    loadPurchaseOrdersReadyForReception
  }
}
