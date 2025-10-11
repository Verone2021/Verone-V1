/**
 * Hook pour la gestion des commandes clients
 * Gère le workflow : devis → commande → préparation → expédition → livraison
 */

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useStockMovements } from './use-stock-movements'

// Types pour les commandes clients
export type SalesOrderStatus = 'draft' | 'confirmed' | 'partially_shipped' | 'shipped' | 'delivered' | 'cancelled'
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded' | 'overdue'

export interface SalesOrder {
  id: string
  order_number: string
  customer_id: string
  customer_type: 'organization' | 'individual'
  status: SalesOrderStatus
  payment_status?: PaymentStatus
  currency: string
  tax_rate: number
  total_ht: number
  total_ttc: number
  paid_amount?: number
  expected_delivery_date?: string
  shipping_address?: any
  billing_address?: any
  payment_terms?: string
  notes?: string

  // Workflow users et timestamps
  created_by: string
  confirmed_by?: string
  shipped_by?: string
  delivered_by?: string

  confirmed_at?: string
  shipped_at?: string
  delivered_at?: string
  cancelled_at?: string
  paid_at?: string
  warehouse_exit_at?: string
  warehouse_exit_by?: string

  created_at: string
  updated_at: string

  // Relations jointes (polymorphiques selon customer_type)
  organisations?: {
    id: string
    name: string
    email?: string
    phone?: string
    address_line1?: string
    address_line2?: string
    postal_code?: string
    city?: string
  }
  individual_customers?: {
    id: string
    first_name: string
    last_name: string
    email?: string
    phone?: string
    address_line1?: string
    address_line2?: string
    postal_code?: string
    city?: string
  }
  sales_order_items?: SalesOrderItem[]
}

export interface SalesOrderItem {
  id: string
  sales_order_id: string
  product_id: string
  quantity: number
  unit_price_ht: number
  discount_percentage: number
  total_ht: number
  quantity_shipped: number
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
    primary_image_url?: string | null
  }
}

export interface CreateSalesOrderData {
  customer_id: string
  customer_type: 'organization' | 'individual'
  expected_delivery_date?: string
  shipping_address?: any
  billing_address?: any
  payment_terms?: string
  notes?: string
  items: CreateSalesOrderItemData[]
}

export interface CreateSalesOrderItemData {
  product_id: string
  quantity: number
  unit_price_ht: number
  discount_percentage?: number
  expected_delivery_date?: string
  notes?: string
}

export interface UpdateSalesOrderData {
  expected_delivery_date?: string
  shipping_address?: any
  billing_address?: any
  payment_terms?: string
  notes?: string
}

export interface ShipItemData {
  item_id: string
  quantity_shipped: number
  notes?: string
}

interface SalesOrderFilters {
  customer_id?: string
  status?: SalesOrderStatus
  date_from?: string
  date_to?: string
  order_number?: string
}

interface SalesOrderStats {
  total_orders: number
  total_value: number
  pending_orders: number
  shipped_orders: number
  delivered_orders: number
  cancelled_orders: number
}

export function useSalesOrders() {
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState<SalesOrder[]>([])
  const [currentOrder, setCurrentOrder] = useState<SalesOrder | null>(null)
  const [stats, setStats] = useState<SalesOrderStats | null>(null)
  const { toast } = useToast()
  const supabase = createClient()
  const { createMovement, getAvailableStock } = useStockMovements()

  // Récupérer toutes les commandes avec filtres
  const fetchOrders = useCallback(async (filters?: SalesOrderFilters) => {
    setLoading(true)
    try {
      let query = supabase
        .from('sales_orders')
        .select(`
          *,
          sales_order_items (
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
      if (filters?.customer_id) {
        query = query.eq('customer_id', filters.customer_id)
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
      if (filters?.order_number) {
        query = query.ilike('order_number', `%${filters.order_number}%`)
      }

      const { data: ordersData, error } = await query

      if (error) throw error

      // Fetch manuel des données clients pour chaque commande (relations polymorphiques)
      const ordersWithCustomers = await Promise.all(
        (ordersData || []).map(async order => {
          let customerData = null

          if (order.customer_type === 'organization' && order.customer_id) {
            const { data: org } = await supabase
              .from('organisations')
              .select('id, name, email, phone, address_line1, address_line2, postal_code, city')
              .eq('id', order.customer_id)
              .single()
            customerData = { organisations: org }
          } else if (order.customer_type === 'individual' && order.customer_id) {
            const { data: individual } = await supabase
              .from('individual_customers')
              .select('id, first_name, last_name, email, phone, address_line1, address_line2, postal_code, city')
              .eq('id', order.customer_id)
              .single()
            customerData = { individual_customers: individual }
          }

          return {
            ...order,
            ...customerData
          }
        })
      )

      setOrders(ordersWithCustomers)
    } catch (error: any) {
      console.error('Erreur lors de la récupération des commandes:', error?.message || 'Erreur inconnue')
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
      const { data: orderData, error } = await supabase
        .from('sales_orders')
        .select(`
          *,
          sales_order_items (
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

      // Fetch manuel des données client selon le type (relation polymorphique)
      let customerData = null

      if (orderData.customer_type === 'organization' && orderData.customer_id) {
        const { data: org } = await supabase
          .from('organisations')
          .select('id, name, email, phone, address_line1, address_line2, postal_code, city')
          .eq('id', orderData.customer_id)
          .single()
        customerData = { organisations: org }
      } else if (orderData.customer_type === 'individual' && orderData.customer_id) {
        const { data: individual } = await supabase
          .from('individual_customers')
          .select('id, first_name, last_name, email, phone, address_line1, address_line2, postal_code, city')
          .eq('id', orderData.customer_id)
          .single()
        customerData = { individual_customers: individual }
      }

      const orderWithCustomer = {
        ...orderData,
        ...customerData
      }

      setCurrentOrder(orderWithCustomer)
      return orderWithCustomer
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
  const fetchStats = useCallback(async (filters?: SalesOrderFilters) => {
    try {
      let query = supabase
        .from('sales_orders')
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
          case 'confirmed':
          case 'partially_shipped':
            acc.pending_orders++
            break
          case 'shipped':
            acc.shipped_orders++
            break
          case 'delivered':
            acc.delivered_orders++
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
        shipped_orders: 0,
        delivered_orders: 0,
        cancelled_orders: 0
      })

      setStats(statsData || null)
    } catch (error: any) {
      console.error('Erreur lors de la récupération des statistiques:', error?.message || 'Erreur inconnue')
    }
  }, [supabase])

  // Vérifier la disponibilité du stock pour une commande
  const checkStockAvailability = useCallback(async (items: CreateSalesOrderItemData[]) => {
    const availabilityCheck = []

    for (const item of items) {
      const availableStock = await getAvailableStock(item.product_id)
      availabilityCheck.push({
        product_id: item.product_id,
        requested_quantity: item.quantity,
        available_stock: availableStock,
        is_available: availableStock >= item.quantity
      })
    }

    return availabilityCheck
  }, [getAvailableStock])

  // Obtenir le stock disponible avec prévisionnel
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

  // Marquer une commande comme payée
  const markAsPaid = useCallback(async (orderId: string, amount?: number) => {
    setLoading(true)
    try {
      const { data: order } = await supabase
        .from('sales_orders')
        .select('total_ttc')
        .eq('id', orderId)
        .single()

      if (!order) throw new Error('Commande non trouvée')

      const paidAmount = amount || order.total_ttc

      const { error } = await supabase
        .rpc('mark_payment_received', {
          p_order_id: orderId,
          p_amount: paidAmount
        })

      if (error) throw error

      toast({
        title: "Succès",
        description: "Paiement enregistré avec succès"
      })

      await fetchOrders()
      if (currentOrder?.id === orderId) {
        await fetchOrder(orderId)
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'enregistrement du paiement:', error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'enregistrer le paiement",
        variant: "destructive"
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [supabase, toast, fetchOrders, currentOrder, fetchOrder])

  // Marquer la sortie entrepôt
  const markWarehouseExit = useCallback(async (orderId: string) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .rpc('mark_warehouse_exit', {
          p_order_id: orderId
        })

      if (error) throw error

      toast({
        title: "Succès",
        description: "Sortie entrepôt enregistrée avec succès"
      })

      await fetchOrders()
      if (currentOrder?.id === orderId) {
        await fetchOrder(orderId)
      }
    } catch (error: any) {
      console.error('Erreur lors de la sortie entrepôt:', error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'enregistrer la sortie entrepôt",
        variant: "destructive"
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [supabase, toast, fetchOrders, currentOrder, fetchOrder])

  // Créer une nouvelle commande avec vérification de stock
  const createOrder = useCallback(async (data: CreateSalesOrderData, autoReserve = false) => {
    setLoading(true)
    try {
      // 1. Vérifier la disponibilité du stock
      const stockCheck = await checkStockAvailability(data.items)
      const unavailableItems = stockCheck.filter(item => !item.is_available)

      if (unavailableItems.length > 0) {
        const itemNames = await Promise.all(
          unavailableItems.map(async (item) => {
            const { data: product } = await supabase
              .from('products')
              .select('name')
              .eq('id', item.product_id)
              .single()
            return product?.name || item.product_id
          })
        )

        throw new Error(`Stock insuffisant pour: ${itemNames.join(', ')}`)
      }

      // 2. Générer le numéro de commande
      const { data: soNumber, error: numberError } = await supabase
        .rpc('generate_so_number')

      if (numberError) throw numberError

      // 3. Calculer les totaux
      const totalHT = data.items.reduce((sum, item) => {
        const itemTotal = item.quantity * item.unit_price_ht * (1 - (item.discount_percentage || 0) / 100)
        return sum + itemTotal
      }, 0)

      const totalTTC = totalHT * (1 + 0.2) // TVA par défaut

      // 4. Créer la commande
      const { data: order, error: orderError } = await supabase
        .from('sales_orders')
        .insert({
          order_number: soNumber,
          customer_id: data.customer_id,
          customer_type: data.customer_type,
          expected_delivery_date: data.expected_delivery_date,
          shipping_address: data.shipping_address,
          billing_address: data.billing_address,
          payment_terms: data.payment_terms,
          notes: data.notes,
          total_ht: totalHT,
          total_ttc: totalTTC,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single()

      if (orderError) throw orderError

      // 5. Créer les items
      const { error: itemsError } = await supabase
        .from('sales_order_items')
        .insert(
          data.items.map(item => ({
            sales_order_id: order.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price_ht: item.unit_price_ht,
            discount_percentage: item.discount_percentage || 0,
            expected_delivery_date: item.expected_delivery_date,
            notes: item.notes
          }))
        )

      if (itemsError) throw itemsError

      // 6. Réserver le stock automatiquement si demandé
      if (autoReserve) {
        try {
          const userId = (await supabase.auth.getUser()).data.user?.id

          for (const item of data.items) {
            await supabase
              .from('stock_reservations')
              .insert({
                product_id: item.product_id,
                reserved_quantity: item.quantity,
                reference_type: 'sales_order',
                reference_id: order.id,
                reserved_by: userId,
                expires_at: data.expected_delivery_date ? new Date(new Date(data.expected_delivery_date).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() : null // 7 jours après la livraison prévue
              })
          }
        } catch (reservationError) {
          console.warn('Erreur lors de la réservation automatique:', reservationError)
          // Ne pas faire échouer la création de commande pour une erreur de réservation
        }
      }

      toast({
        title: "Succès",
        description: `Commande ${soNumber} créée avec succès`
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
  }, [supabase, toast, fetchOrders, checkStockAvailability, getAvailableStock])

  // Mettre à jour une commande (métadonnées uniquement)
  const updateOrder = useCallback(async (orderId: string, data: UpdateSalesOrderData) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('sales_orders')
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

  // Mettre à jour une commande avec ses items (édition complète)
  const updateOrderWithItems = useCallback(async (
    orderId: string,
    data: UpdateSalesOrderData,
    items: CreateSalesOrderItemData[]
  ) => {
    setLoading(true)
    try {
      // 1. Vérifier que la commande n'est pas payée (règle métier stricte)
      const { data: existingOrder, error: fetchError } = await supabase
        .from('sales_orders')
        .select('payment_status, status, order_number')
        .eq('id', orderId)
        .single()

      if (fetchError) throw fetchError
      if (!existingOrder) throw new Error('Commande non trouvée')

      if (existingOrder.payment_status === 'paid') {
        throw new Error('Impossible de modifier une commande déjà payée')
      }

      // 2. Vérifier la disponibilité du stock pour les nouveaux items
      const stockCheck = await checkStockAvailability(items)
      const unavailableItems = stockCheck.filter(item => !item.is_available)

      if (unavailableItems.length > 0) {
        const itemNames = await Promise.all(
          unavailableItems.map(async (item) => {
            const { data: product } = await supabase
              .from('products')
              .select('name')
              .eq('id', item.product_id)
              .single()
            return product?.name || item.product_id
          })
        )

        throw new Error(`Stock insuffisant pour: ${itemNames.join(', ')}`)
      }

      // 3. Récupérer les items existants pour faire le diff
      const { data: existingItems, error: itemsError } = await supabase
        .from('sales_order_items')
        .select('id, product_id, quantity, unit_price_ht, discount_percentage')
        .eq('sales_order_id', orderId)

      if (itemsError) throw itemsError

      // 4. Calculer le diff des items
      const existingItemsMap = new Map(
        (existingItems || []).map(item => [item.product_id, item])
      )

      const newItemsMap = new Map(
        items.map(item => [item.product_id, item])
      )

      // Items à supprimer (présents dans existing mais pas dans new)
      const itemsToDelete = (existingItems || []).filter(
        item => !newItemsMap.has(item.product_id)
      )

      // Items à ajouter (présents dans new mais pas dans existing)
      const itemsToAdd = items.filter(
        item => !existingItemsMap.has(item.product_id)
      )

      // Items à mettre à jour (présents dans les deux, mais modifiés)
      const itemsToUpdate = items.filter(newItem => {
        const existingItem = existingItemsMap.get(newItem.product_id)
        if (!existingItem) return false

        return (
          existingItem.quantity !== newItem.quantity ||
          existingItem.unit_price_ht !== newItem.unit_price_ht ||
          (existingItem.discount_percentage || 0) !== (newItem.discount_percentage || 0)
        )
      })

      // 5. Supprimer les items obsolètes
      if (itemsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('sales_order_items')
          .delete()
          .in('id', itemsToDelete.map(item => item.id))

        if (deleteError) throw deleteError
      }

      // 6. Ajouter les nouveaux items
      if (itemsToAdd.length > 0) {
        const { error: insertError } = await supabase
          .from('sales_order_items')
          .insert(
            itemsToAdd.map(item => ({
              sales_order_id: orderId,
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price_ht: item.unit_price_ht,
              discount_percentage: item.discount_percentage || 0,
              expected_delivery_date: item.expected_delivery_date,
              notes: item.notes
            }))
          )

        if (insertError) throw insertError
      }

      // 7. Mettre à jour les items modifiés
      for (const itemToUpdate of itemsToUpdate) {
        const existingItem = existingItemsMap.get(itemToUpdate.product_id)
        if (!existingItem) continue

        const { error: updateItemError } = await supabase
          .from('sales_order_items')
          .update({
            quantity: itemToUpdate.quantity,
            unit_price_ht: itemToUpdate.unit_price_ht,
            discount_percentage: itemToUpdate.discount_percentage || 0,
            expected_delivery_date: itemToUpdate.expected_delivery_date,
            notes: itemToUpdate.notes
          })
          .eq('id', existingItem.id)

        if (updateItemError) throw updateItemError
      }

      // 8. Recalculer les totaux de la commande
      const totalHT = items.reduce((sum, item) => {
        const itemTotal = item.quantity * item.unit_price_ht * (1 - (item.discount_percentage || 0) / 100)
        return sum + itemTotal
      }, 0)

      const totalTTC = totalHT * (1 + 0.2) // TVA par défaut

      // 9. Mettre à jour les métadonnées et les totaux de la commande
      const { error: updateOrderError } = await supabase
        .from('sales_orders')
        .update({
          ...data,
          total_ht: totalHT,
          total_ttc: totalTTC
        })
        .eq('id', orderId)

      if (updateOrderError) throw updateOrderError

      toast({
        title: "Succès",
        description: `Commande ${existingOrder.order_number} mise à jour avec succès`
      })

      await fetchOrders()
      if (currentOrder?.id === orderId) {
        await fetchOrder(orderId)
      }

      return true
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour de la commande:', error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour la commande",
        variant: "destructive"
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [supabase, toast, fetchOrders, currentOrder, fetchOrder, checkStockAvailability])

  // Changer le statut d'une commande
  const updateStatus = useCallback(async (orderId: string, newStatus: SalesOrderStatus) => {
    setLoading(true)
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id
      const updateData: any = { status: newStatus }

      // Mettre à jour les timestamps selon le statut
      switch (newStatus) {
        case 'confirmed':
          updateData.confirmed_at = new Date().toISOString()
          updateData.confirmed_by = userId
          break
        case 'shipped':
        case 'partially_shipped':
          updateData.shipped_at = new Date().toISOString()
          updateData.shipped_by = userId
          break
        case 'delivered':
          updateData.delivered_at = new Date().toISOString()
          updateData.delivered_by = userId
          break
        case 'cancelled':
          updateData.cancelled_at = new Date().toISOString()

          // Libérer les réservations de stock en cas d'annulation
          await supabase
            .from('stock_reservations')
            .update({
              released_at: new Date().toISOString(),
              released_by: userId
            })
            .eq('reference_type', 'sales_order')
            .eq('reference_id', orderId)
            .is('released_at', null)
          break
      }

      const { error } = await supabase
        .from('sales_orders')
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

  // Expédier des items (totalement ou partiellement)
  const shipItems = useCallback(async (orderId: string, itemsToShip: ShipItemData[]) => {
    setLoading(true)
    try {
      // 1. Mettre à jour les quantités expédiées
      for (const item of itemsToShip) {
        // Récupérer la quantité actuelle
        const { data: currentItem, error: fetchError } = await supabase
          .from('sales_order_items')
          .select('quantity_shipped')
          .eq('id', item.item_id)
          .single()

        if (fetchError) throw fetchError

        // Mettre à jour avec la nouvelle quantité
        const newQuantity = (currentItem.quantity_shipped || 0) + item.quantity_shipped

        const { error: updateError } = await supabase
          .from('sales_order_items')
          .update({
            quantity_shipped: newQuantity
          })
          .eq('id', item.item_id)

        if (updateError) throw updateError

        // 2. Créer un mouvement de stock sortant pour chaque item expédié
        const { data: orderItem, error: itemError } = await supabase
          .from('sales_order_items')
          .select('product_id')
          .eq('id', item.item_id)
          .single()

        if (itemError) throw itemError

        await createMovement({
          product_id: orderItem.product_id,
          movement_type: 'OUT',
          quantity_change: item.quantity_shipped,
          reference_type: 'sales_order',
          reference_id: orderId,
          notes: item.notes
        })

        // 3. Libérer les réservations correspondantes
        const userId = (await supabase.auth.getUser()).data.user?.id
        await supabase
          .from('stock_reservations')
          .update({
            released_at: new Date().toISOString(),
            released_by: userId
          })
          .eq('reference_type', 'sales_order')
          .eq('reference_id', orderId)
          .eq('product_id', orderItem.product_id)
          .is('released_at', null)
          .limit(1) // Libérer une réservation à la fois
      }

      // 4. Vérifier si la commande est entièrement expédiée
      const { data: orderItems, error: checkError } = await supabase
        .from('sales_order_items')
        .select('quantity, quantity_shipped')
        .eq('sales_order_id', orderId)

      if (checkError) throw checkError

      const isFullyShipped = orderItems?.every(item => item.quantity_shipped >= item.quantity)
      const isPartiallyShipped = orderItems?.some(item => item.quantity_shipped > 0)

      let newStatus: SalesOrderStatus = 'confirmed'
      if (isFullyShipped) {
        newStatus = 'shipped'
      } else if (isPartiallyShipped) {
        newStatus = 'partially_shipped'
      }

      // 5. Mettre à jour le statut de la commande
      await updateStatus(orderId, newStatus)

      toast({
        title: "Succès",
        description: "Expédition enregistrée avec succès"
      })
    } catch (error: any) {
      console.error('Erreur lors de l\'expédition:', error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'enregistrer l'expédition",
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
      // Libérer les réservations en premier
      const userId = (await supabase.auth.getUser()).data.user?.id
      await supabase
        .from('stock_reservations')
        .update({
          released_at: new Date().toISOString(),
          released_by: userId
        })
        .eq('reference_type', 'sales_order')
        .eq('reference_id', orderId)
        .is('released_at', null)

      // Supprimer la commande
      const { error } = await supabase
        .from('sales_orders')
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
    updateOrderWithItems,
    updateStatus,
    shipItems,
    deleteOrder,
    markAsPaid,
    markWarehouseExit,

    // Utilitaires
    checkStockAvailability,
    getStockWithForecasted,
    setCurrentOrder
  }
}