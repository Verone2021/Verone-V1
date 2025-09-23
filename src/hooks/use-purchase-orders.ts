/**
 * Hook pour la gestion des commandes fournisseurs
 * Gère le workflow complet : création → envoi → confirmation → réception
 */

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useStockMovements } from './use-stock-movements'

// Types pour les commandes fournisseurs
export type PurchaseOrderStatus = 'draft' | 'sent' | 'confirmed' | 'partially_received' | 'received' | 'cancelled'

export interface PurchaseOrder {
  id: string
  po_number: string
  supplier_id: string
  status: PurchaseOrderStatus
  currency: string
  tax_rate: number
  total_ht: number
  total_ttc: number
  expected_delivery_date?: string
  delivery_address?: any
  payment_terms?: string
  notes?: string

  // Workflow users et timestamps
  created_by: string
  validated_by?: string
  sent_by?: string
  received_by?: string

  validated_at?: string
  sent_at?: string
  received_at?: string
  cancelled_at?: string

  created_at: string
  updated_at: string

  // Relations jointes
  organisations?: {
    id: string
    name: string
    email?: string
    phone?: string
    payment_terms?: string
  }
  purchase_order_items?: PurchaseOrderItem[]
}

export interface PurchaseOrderItem {
  id: string
  purchase_order_id: string
  product_id: string
  quantity: number
  unit_price_ht: number
  discount_percentage: number
  total_ht: number
  quantity_received: number
  expected_delivery_date?: string
  notes?: string
  created_at: string
  updated_at: string

  // Relations jointes
  products?: {
    id: string
    name: string
    sku: string
    stock_quantity?: number
    stock_real?: number
    stock_forecasted_in?: number
    stock_forecasted_out?: number
  }
}

export interface CreatePurchaseOrderData {
  supplier_id: string
  expected_delivery_date?: string
  delivery_address?: any
  payment_terms?: string
  notes?: string
  items: CreatePurchaseOrderItemData[]
}

export interface CreatePurchaseOrderItemData {
  product_id: string
  quantity: number
  unit_price_ht: number
  discount_percentage?: number
  expected_delivery_date?: string
  notes?: string
}

export interface UpdatePurchaseOrderData {
  expected_delivery_date?: string
  delivery_address?: any
  payment_terms?: string
  notes?: string
}

export interface ReceiveItemData {
  item_id: string
  quantity_received: number
  unit_cost?: number
  notes?: string
}

interface PurchaseOrderFilters {
  supplier_id?: string
  status?: PurchaseOrderStatus
  date_from?: string
  date_to?: string
  po_number?: string
}

interface PurchaseOrderStats {
  total_orders: number
  total_value: number
  pending_orders: number
  received_orders: number
  cancelled_orders: number
}

export function usePurchaseOrders() {
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [currentOrder, setCurrentOrder] = useState<PurchaseOrder | null>(null)
  const [stats, setStats] = useState<PurchaseOrderStats | null>(null)
  const { toast } = useToast()
  const supabase = createClient()
  const { createMovement } = useStockMovements()

  // Récupérer toutes les commandes avec filtres - Optimisé selon Context7
  const fetchOrders = useCallback(async (filters?: PurchaseOrderFilters) => {
    setLoading(true)
    try {
      let query = supabase
        .from('purchase_orders')
        .select(`
          *,
          organisations (
            id,
            name,
            email,
            phone,
            payment_terms
          ),
          purchase_order_items (
            *,
            products (
              id,
              name,
              sku,
              stock_quantity,
              stock_real,
              stock_forecasted_in,
              stock_forecasted_out
            )
          )
        `)
        .order('created_at', { ascending: false })

      // Appliquer les filtres
      if (filters?.supplier_id) {
        query = query.eq('supplier_id', filters.supplier_id)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from)
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to)
      }
      if (filters?.po_number) {
        query = query.ilike('po_number', `%${filters.po_number}%`)
      }

      const { data, error } = await query

      if (error) throw error

      setOrders(data || [])
    } catch (error) {
      console.error('Erreur lors de la récupération des commandes:', error)
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les commandes",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [supabase, toast])

  // Récupérer une commande spécifique
  const fetchOrder = useCallback(async (orderId: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          organisations (
            id,
            name,
            email,
            phone,
            payment_terms
          ),
          purchase_order_items (
            *,
            products (
              id,
              name,
              sku,
              stock_quantity,
              stock_real,
              stock_forecasted_in,
              stock_forecasted_out
            )
          )
        `)
        .eq('id', orderId)
        .single()

      if (error) throw error

      setCurrentOrder(data)
      return data
    } catch (error) {
      console.error('Erreur lors de la récupération de la commande:', error)
      toast({
        title: "Erreur",
        description: "Impossible de récupérer la commande",
        variant: "destructive"
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [supabase, toast])

  // Récupérer les statistiques
  const fetchStats = useCallback(async (filters?: PurchaseOrderFilters) => {
    try {
      let query = supabase
        .from('purchase_orders')
        .select('status, total_ht')

      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from)
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to)
      }

      const { data, error } = await query

      if (error) throw error

      const statsData = data?.reduce((acc, order) => {
        acc.total_orders++
        acc.total_value += order.total_ht || 0

        switch (order.status) {
          case 'draft':
          case 'sent':
          case 'confirmed':
          case 'partially_received':
            acc.pending_orders++
            break
          case 'received':
            acc.received_orders++
            break
          case 'cancelled':
            acc.cancelled_orders++
            break
        }
        return acc
      }, {
        total_orders: 0,
        total_value: 0,
        pending_orders: 0,
        received_orders: 0,
        cancelled_orders: 0
      })

      setStats(statsData || null)
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
    }
  }, [supabase])

  // Créer une nouvelle commande
  const createOrder = useCallback(async (data: CreatePurchaseOrderData) => {
    setLoading(true)
    try {
      // 1. Générer le numéro de commande
      const { data: poNumber, error: numberError } = await supabase
        .rpc('generate_po_number')

      if (numberError) throw numberError

      // 2. Calculer les totaux
      const totalHT = data.items.reduce((sum, item) => {
        const itemTotal = item.quantity * item.unit_price_ht * (1 - (item.discount_percentage || 0) / 100)
        return sum + itemTotal
      }, 0)

      const totalTTC = totalHT * (1 + 0.2) // TVA par défaut

      // 3. Créer la commande
      const { data: order, error: orderError } = await supabase
        .from('purchase_orders')
        .insert({
          po_number: poNumber,
          supplier_id: data.supplier_id,
          expected_delivery_date: data.expected_delivery_date,
          delivery_address: data.delivery_address,
          payment_terms: data.payment_terms,
          notes: data.notes,
          total_ht: totalHT,
          total_ttc: totalTTC,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single()

      if (orderError) throw orderError

      // 4. Créer les items
      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(
          data.items.map(item => ({
            purchase_order_id: order.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price_ht: item.unit_price_ht,
            discount_percentage: item.discount_percentage || 0,
            expected_delivery_date: item.expected_delivery_date,
            notes: item.notes
          }))
        )

      if (itemsError) throw itemsError

      toast({
        title: "Succès",
        description: `Commande ${poNumber} créée avec succès`
      })

      await fetchOrders()
      return order
    } catch (error: any) {
      console.error('Erreur lors de la création de la commande:', error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la commande",
        variant: "destructive"
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [supabase, toast, fetchOrders])

  // Mettre à jour une commande
  const updateOrder = useCallback(async (orderId: string, data: UpdatePurchaseOrderData) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('purchase_orders')
        .update(data)
        .eq('id', orderId)

      if (error) throw error

      toast({
        title: "Succès",
        description: "Commande mise à jour avec succès"
      })

      await fetchOrders()
      if (currentOrder?.id === orderId) {
        await fetchOrder(orderId)
      }
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour:', error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour la commande",
        variant: "destructive"
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [supabase, toast, fetchOrders, currentOrder, fetchOrder])

  // Changer le statut d'une commande
  const updateStatus = useCallback(async (orderId: string, newStatus: PurchaseOrderStatus) => {
    setLoading(true)
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id
      const updateData: any = { status: newStatus }

      // Mettre à jour les timestamps selon le statut
      switch (newStatus) {
        case 'sent':
          updateData.sent_at = new Date().toISOString()
          updateData.sent_by = userId
          break
        case 'confirmed':
          updateData.validated_at = new Date().toISOString()
          updateData.validated_by = userId
          break
        case 'received':
          updateData.received_at = new Date().toISOString()
          updateData.received_by = userId
          break
        case 'cancelled':
          updateData.cancelled_at = new Date().toISOString()
          break
      }

      const { error } = await supabase
        .from('purchase_orders')
        .update(updateData)
        .eq('id', orderId)

      if (error) throw error

      toast({
        title: "Succès",
        description: `Commande marquée comme ${newStatus}`
      })

      await fetchOrders()
      if (currentOrder?.id === orderId) {
        await fetchOrder(orderId)
      }
    } catch (error: any) {
      console.error('Erreur lors du changement de statut:', error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible de changer le statut",
        variant: "destructive"
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [supabase, toast, fetchOrders, currentOrder, fetchOrder])

  // Réceptionner des items (totalement ou partiellement)
  const receiveItems = useCallback(async (orderId: string, itemsToReceive: ReceiveItemData[]) => {
    setLoading(true)
    try {
      // 1. Mettre à jour les quantités reçues
      for (const item of itemsToReceive) {
        // Récupérer la quantité actuelle
        const { data: currentItem, error: fetchError } = await supabase
          .from('purchase_order_items')
          .select('quantity_received')
          .eq('id', item.item_id)
          .single()

        if (fetchError) throw fetchError

        // Mettre à jour avec la nouvelle quantité
        const newQuantity = (currentItem.quantity_received || 0) + item.quantity_received

        const { error: updateError } = await supabase
          .from('purchase_order_items')
          .update({
            quantity_received: newQuantity
          })
          .eq('id', item.item_id)

        if (updateError) throw updateError

        // 2. Créer un mouvement de stock pour chaque item reçu
        const { data: orderItem, error: itemError } = await supabase
          .from('purchase_order_items')
          .select('product_id')
          .eq('id', item.item_id)
          .single()

        if (itemError) throw itemError

        await createMovement({
          product_id: orderItem.product_id,
          movement_type: 'IN',
          quantity_change: item.quantity_received,
          unit_cost: item.unit_cost,
          reference_type: 'purchase_order',
          reference_id: orderId,
          notes: item.notes
        })
      }

      // 3. Vérifier si la commande est entièrement reçue
      const { data: orderItems, error: checkError } = await supabase
        .from('purchase_order_items')
        .select('quantity, quantity_received')
        .eq('purchase_order_id', orderId)

      if (checkError) throw checkError

      const isFullyReceived = orderItems?.every(item => item.quantity_received >= item.quantity)
      const isPartiallyReceived = orderItems?.some(item => item.quantity_received > 0)

      let newStatus: PurchaseOrderStatus = 'confirmed'
      if (isFullyReceived) {
        newStatus = 'received'
      } else if (isPartiallyReceived) {
        newStatus = 'partially_received'
      }

      // 4. Mettre à jour le statut de la commande
      await updateStatus(orderId, newStatus)

      toast({
        title: "Succès",
        description: "Réception enregistrée avec succès"
      })
    } catch (error: any) {
      console.error('Erreur lors de la réception:', error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'enregistrer la réception",
        variant: "destructive"
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [supabase, toast, createMovement, updateStatus])

  // Supprimer une commande (draft seulement)
  const deleteOrder = useCallback(async (orderId: string) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', orderId)
        .eq('status', 'draft') // Sécurité : seules les commandes draft peuvent être supprimées

      if (error) throw error

      toast({
        title: "Succès",
        description: "Commande supprimée avec succès"
      })

      await fetchOrders()
      if (currentOrder?.id === orderId) {
        setCurrentOrder(null)
      }
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer la commande",
        variant: "destructive"
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [supabase, toast, fetchOrders, currentOrder])

  // Obtenir le stock avec prévisionnel pour les commandes fournisseurs
  const getStockWithForecasted = useCallback(async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('stock_real, stock_forecasted_in, stock_forecasted_out')
        .eq('id', productId)
        .single()

      if (error) throw error

      return {
        stock_real: data?.stock_real || 0,
        stock_forecasted_in: data?.stock_forecasted_in || 0,
        stock_forecasted_out: data?.stock_forecasted_out || 0,
        stock_available: (data?.stock_real || 0) + (data?.stock_forecasted_in || 0) - (data?.stock_forecasted_out || 0),
        stock_future: (data?.stock_real || 0) + (data?.stock_forecasted_in || 0)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du stock:', error)
      return {
        stock_real: 0,
        stock_forecasted_in: 0,
        stock_forecasted_out: 0,
        stock_available: 0,
        stock_future: 0
      }
    }
  }, [supabase])

  // Marquer une commande comme confirmée (déclenche stock prévisionnel)
  const confirmOrder = useCallback(async (orderId: string) => {
    return updateStatus(orderId, 'confirmed')
  }, [updateStatus])

  // Marquer réception complète
  const markAsReceived = useCallback(async (orderId: string) => {
    return updateStatus(orderId, 'received')
  }, [updateStatus])

  return {
    // État
    loading,
    orders,
    currentOrder,
    stats,

    // Actions principales
    fetchOrders,
    fetchOrder,
    fetchStats,
    createOrder,
    updateOrder,
    updateStatus,
    receiveItems,
    deleteOrder,
    confirmOrder,
    markAsReceived,

    // Utilitaires
    getStockWithForecasted,
    setCurrentOrder
  }
}