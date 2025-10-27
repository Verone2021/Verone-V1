/**
 * 📦 Hook: Gestion Expéditions Ventes (Sales Orders)
 *
 * Features:
 * - Chargement items prêts à expédition
 * - Calcul automatique différentiel (quantité restante = commandée - déjà expédiée)
 * - Vérification stock disponible avant expédition
 * - Validation expéditions (partielles/complètes)
 * - Intégration transporteurs (Packlink, Mondial Relay, Chronotruck)
 * - Historique mouvements stock (traçabilité)
 * - Stats dashboard expéditions
 *
 * Workflow:
 * 1. Charger SO confirmé avec items enrichis
 * 2. Calculer quantités restantes (différentiel)
 * 3. Vérifier stock disponible
 * 4. User saisit quantités à expédier + transporteur
 * 5. Validation → Trigger stock + update statut
 */

'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getOrganisationDisplayName } from '@/lib/utils/organisation-helpers'
import type {
  ShipmentItem,
  ValidateShipmentPayload,
  ShipmentHistory,
  ReceptionShipmentStats,
  ShipmentCarrierInfo,
  ShippingAddress
} from '@/types/reception-shipment'

export interface SalesOrderForShipment {
  id: string
  order_number: string
  status: string
  created_at: string
  expected_delivery_date: string | null
  shipped_at: string | null
  shipped_by: string | null

  // Customer (polymorphic)
  customer_id: string
  customer_type: string // 'organization' | 'individual_customer'
  customer_name?: string // Chargé dynamiquement selon customer_type

  // Shipping address (pré-remplir formulaire)
  shipping_address?: any

  // Relations jointes (polymorphiques)
  organisations?: {
    id: string
    legal_name: string
    trade_name: string | null
    email?: string
    phone?: string
  }

  // Items enrichis pour expédition
  sales_order_items: Array<{
    id: string
    product_id: string
    quantity: number
    quantity_shipped: number | null
    unit_price_ht: number
    products: {
      id: string
      name: string
      sku: string
      stock_quantity: number
      stock_real: number
      stock_forecasted_out: number
    }
  }>
}

export function useSalesShipments() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Charger un SO avec items pour formulaire expédition
   */
  const loadSalesOrderForShipment = useCallback(async (soId: string): Promise<SalesOrderForShipment | null> => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('sales_orders')
        .select(`
          id,
          order_number,
          status,
          created_at,
          expected_delivery_date,
          shipped_at,
          shipped_by,
          shipping_address,
          customer_id,
          customer_type,
          sales_order_items (
            id,
            product_id,
            quantity,
            quantity_shipped,
            unit_price_ht,
            products (
              id,
              name,
              sku,
              stock_quantity,
              stock_real,
              stock_forecasted_out
            )
          )
        `)
        .eq('id', soId)
        .single()

      if (fetchError) {
        console.error('Erreur chargement SO pour expédition:', fetchError)
        setError(fetchError.message)
        return null
      }

      if (!data) {
        return null
      }

      // Charger nom client selon customer_type (relation polymorphique)
      let customerName = 'Client inconnu'
      let organisationData = null

      if (data.customer_type === 'organization') {
        const { data: org } = await supabase
          .from('organisations')
          .select('id, legal_name, trade_name, email, phone')
          .eq('id', data.customer_id)
          .single()

        if (org) {
          customerName = getOrganisationDisplayName(org)
          organisationData = org
        }
      } else if (data.customer_type === 'individual_customer') {
        const { data: indiv } = await supabase
          .from('individual_customers')
          .select('first_name, last_name')
          .eq('id', data.customer_id)
          .single()

        if (indiv) {
          customerName = `${indiv.first_name} ${indiv.last_name}`
        }
      }

      return {
        ...data,
        customer_name: customerName,
        organisations: organisationData
      } as SalesOrderForShipment
    } catch (err) {
      console.error('Exception chargement SO:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      return null
    } finally {
      setLoading(false)
    }
  }, [supabase])

  /**
   * Transformer items SO en ShipmentItems avec calculs
   */
  const prepareShipmentItems = useCallback((
    salesOrder: SalesOrderForShipment
  ): ShipmentItem[] => {
    return salesOrder.sales_order_items.map(item => {
      const quantityOrdered = item.quantity
      const quantityAlreadyShipped = item.quantity_shipped || 0
      const quantityRemaining = quantityOrdered - quantityAlreadyShipped
      const stockAvailable = item.products.stock_real || 0

      return {
        sales_order_item_id: item.id,
        product_id: item.product_id,
        product_name: item.products.name,
        product_sku: item.products.sku,
        quantity_ordered: quantityOrdered,
        quantity_already_shipped: quantityAlreadyShipped,
        quantity_remaining: quantityRemaining,
        quantity_to_ship: Math.min(quantityRemaining, stockAvailable), // Défaut: minimum entre restant et stock
        stock_available: stockAvailable,
        unit_price_ht: item.unit_price_ht
      }
    })
  }, [])

  /**
   * Valider expédition (workflow simplifié Phase 1 - client-side)
   *
   * Workflow:
   * 1. Update quantity_shipped pour chaque item (calcul différentiel)
   * 2. Calcul nouveau statut SO (partially_shipped / shipped)
   * 3. Update sales_orders (status, shipped_at, shipped_by)
   * 4. Le trigger handle_sales_order_stock() s'exécute automatiquement
   *    → Crée mouvements stock OUT (différentiel)
   *    → Décrémente stock_real
   */
  const validateShipment = useCallback(async (
    payload: ValidateShipmentPayload
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setValidating(true)
      setError(null)

      // Validation payload (Phase 1: adresse et transporteur optionnels)
      if (!payload.sales_order_id || !payload.items || payload.items.length === 0) {
        throw new Error('Données invalides: sales_order_id et items requis')
      }

      // Vérifier que le SO existe et est confirmé
      const { data: salesOrder, error: soError } = await supabase
        .from('sales_orders')
        .select('id, order_number, status')
        .eq('id', payload.sales_order_id)
        .single()

      if (soError || !salesOrder) {
        throw new Error('Commande client introuvable')
      }

      if (!['confirmed', 'partially_shipped'].includes(salesOrder.status)) {
        throw new Error(`Impossible d'expédier: commande au statut "${salesOrder.status}"`)
      }

      // ÉTAPE 1: Update quantity_shipped pour chaque item (différentiel)
      for (const item of payload.items) {
        if (item.quantity_to_ship <= 0) {
          continue // Skip items avec quantité 0
        }

        // Récupérer quantité actuelle
        const { data: currentItem, error: itemError } = await supabase
          .from('sales_order_items')
          .select('id, quantity, quantity_shipped')
          .eq('id', item.sales_order_item_id)
          .single()

        if (itemError || !currentItem) {
          console.error(`Item ${item.sales_order_item_id} introuvable`)
          continue
        }

        const currentShipped = currentItem.quantity_shipped || 0
        const newShipped = currentShipped + item.quantity_to_ship

        // Vérifier cohérence
        if (newShipped > currentItem.quantity) {
          throw new Error(
            `Quantité expédiée incohérente pour item ${item.sales_order_item_id}: ` +
            `${newShipped} > ${currentItem.quantity} commandée`
          )
        }

        // Update quantity_shipped
        const { error: updateError } = await supabase
          .from('sales_order_items')
          .update({ quantity_shipped: newShipped })
          .eq('id', item.sales_order_item_id)

        if (updateError) {
          console.error('Erreur update item:', updateError)
          throw new Error(`Erreur mise à jour item: ${updateError.message}`)
        }
      }

      // ÉTAPE 2: Calculer nouveau statut SO
      // Si tous les items sont totalement expédiés → 'shipped'
      // Sinon → 'partially_shipped'
      const { data: allItems, error: allItemsError } = await supabase
        .from('sales_order_items')
        .select('quantity, quantity_shipped')
        .eq('sales_order_id', payload.sales_order_id)

      if (allItemsError) {
        console.error('Erreur récupération items:', allItemsError)
        throw new Error('Erreur calcul statut')
      }

      const allFullyShipped = allItems?.every(
        item => (item.quantity_shipped || 0) >= item.quantity
      )

      const newStatus = allFullyShipped ? 'shipped' : 'partially_shipped'

      // ÉTAPE 3: Update sales_orders
      const updateData: any = {
        status: newStatus
      }

      // Si c'était la première expédition, set shipped_at et shipped_by
      if (salesOrder.status === 'confirmed') {
        updateData.shipped_at = payload.shipped_at || new Date().toISOString()
        updateData.shipped_by = payload.shipped_by
      }

      const { error: updateSOError } = await supabase
        .from('sales_orders')
        .update(updateData)
        .eq('id', payload.sales_order_id)

      if (updateSOError) {
        console.error('Erreur update SO:', updateSOError)
        throw new Error(`Erreur mise à jour commande: ${updateSOError.message}`)
      }

      // SUCCESS!
      // Le trigger handle_sales_order_stock() s'est exécuté automatiquement
      // lors de l'UPDATE status → Il a créé les mouvements stock OUT

      return { success: true }

    } catch (err) {
      console.error('Erreur validation expédition:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setValidating(false)
    }
  }, [supabase])

  /**
   * Charger historique expéditions (table shipments)
   */
  const loadShipmentHistory = useCallback(async (
    soId: string
  ): Promise<ShipmentHistory[]> => {
    try {
      // Récupérer shipments pour ce SO
      const { data: shipments, error: shipmentsError } = await supabase
        .from('shipments')
        .select(`
          id,
          shipped_at,
          delivered_at,
          carrier_type,
          carrier_name,
          service_name,
          tracking_number,
          tracking_url,
          cost_paid_eur,
          cost_charged_eur,
          delivery_status,
          shipment_items (
            quantity_shipped,
            product_id,
            products (
              name,
              sku
            )
          )
        `)
        .eq('sales_order_id', soId)
        .order('shipped_at', { ascending: false })

      if (shipmentsError) {
        console.error('Erreur chargement historique:', shipmentsError)
        return []
      }

      return (shipments || []).map(shipment => ({
        shipment_id: shipment.id,
        shipped_at: shipment.shipped_at,
        delivered_at: shipment.delivered_at || undefined,
        carrier_name: shipment.carrier_name || shipment.carrier_type,
        service_name: shipment.service_name || undefined,
        tracking_number: shipment.tracking_number || undefined,
        tracking_url: shipment.tracking_url || undefined,
        items: (shipment.shipment_items || []).map((item: any) => ({
          product_name: item.products?.name || 'Produit inconnu',
          product_sku: item.products?.sku || '',
          quantity_shipped: item.quantity_shipped
        })),
        total_quantity: (shipment.shipment_items || []).reduce(
          (sum: number, item: any) => sum + item.quantity_shipped,
          0
        ),
        cost_paid_eur: shipment.cost_paid_eur || undefined,
        cost_charged_eur: shipment.cost_charged_eur || undefined,
        delivery_status: shipment.delivery_status || 'in_transit'
      }))
    } catch (err) {
      console.error('Exception historique expéditions:', err)
      return []
    }
  }, [supabase])

  /**
   * Charger stats dashboard expéditions
   */
  const loadShipmentStats = useCallback(async (): Promise<ReceptionShipmentStats> => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // SOs confirmés en attente expédition
      const { count: pending } = await supabase
        .from('sales_orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'confirmed')

      // SOs partiellement expédiés
      const { count: partial } = await supabase
        .from('sales_orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'partially_shipped')

      // SOs complètement expédiés aujourd'hui
      const { count: completedToday } = await supabase
        .from('sales_orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'shipped')
        .gte('shipped_at', today.toISOString())

      // SOs en retard (expected_delivery_date < today)
      const { count: overdue } = await supabase
        .from('sales_orders')
        .select('id', { count: 'exact', head: true })
        .in('status', ['confirmed', 'partially_shipped'])
        .not('expected_delivery_date', 'is', null)
        .lt('expected_delivery_date', today.toISOString().split('T')[0])

      // SOs urgents (expected_delivery_date < today + 3 jours)
      const threeDays = new Date(today)
      threeDays.setDate(threeDays.getDate() + 3)

      const { count: urgent } = await supabase
        .from('sales_orders')
        .select('id', { count: 'exact', head: true })
        .in('status', ['confirmed', 'partially_shipped'])
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
      console.error('Erreur chargement stats expéditions:', err)
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
   * Charger liste SOs prêts à expédition (pour page /stocks/expeditions)
   */
  const loadSalesOrdersReadyForShipment = useCallback(async (filters?: {
    status?: string
    search?: string
    urgent_only?: boolean
    overdue_only?: boolean
  }) => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('sales_orders')
        .select(`
          id,
          order_number,
          status,
          created_at,
          expected_delivery_date,
          shipped_at,
          customer_id,
          customer_type,
          sales_order_items (
            quantity,
            quantity_shipped
          )
        `)
        .in('status', ['confirmed', 'partially_shipped'])
        .order('expected_delivery_date', { ascending: true, nullsFirst: false })

      // Filtres
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.search) {
        // TODO: Recherche client après implémentation RPC get_customer_name()
        query = query.ilike('order_number', `%${filters.search}%`)
      }

      const { data: orders, error: fetchError } = await query

      if (fetchError) {
        console.error('Erreur chargement SOs:', fetchError)
        setError(fetchError.message)
        return []
      }

      if (!orders || orders.length === 0) {
        return []
      }

      // Charger noms clients selon customer_type (relation polymorphique)
      const orgIds = orders
        .filter((o: any) => o.customer_type === 'organization')
        .map((o: any) => o.customer_id)

      const indivIds = orders
        .filter((o: any) => o.customer_type === 'individual_customer')
        .map((o: any) => o.customer_id)

      // Query organisations si nécessaire
      let organisationsMap = new Map()
      if (orgIds.length > 0) {
        const { data: orgs } = await supabase
          .from('organisations')
          .select('id, legal_name, trade_name')
          .in('id', orgIds)

        if (orgs) {
          orgs.forEach((org: any) => organisationsMap.set(org.id, org.trade_name || org.legal_name))
        }
      }

      // Query individual_customers si nécessaire
      let individualsMap = new Map()
      if (indivIds.length > 0) {
        const { data: indivs } = await supabase
          .from('individual_customers')
          .select('id, first_name, last_name')
          .in('id', indivIds)

        if (indivs) {
          indivs.forEach((indiv: any) =>
            individualsMap.set(indiv.id, `${indiv.first_name} ${indiv.last_name}`)
          )
        }
      }

      // Enrichir orders avec customer_name
      const enrichedOrders = orders.map((order: any) => ({
        ...order,
        customer_name: order.customer_type === 'organization'
          ? organisationsMap.get(order.customer_id) || 'Organisation inconnue'
          : individualsMap.get(order.customer_id) || 'Client inconnu'
      }))

      return enrichedOrders
    } catch (err) {
      console.error('Exception chargement SOs:', err)
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
    loadSalesOrderForShipment,
    prepareShipmentItems,
    validateShipment,
    loadShipmentHistory,
    loadShipmentStats,
    loadSalesOrdersReadyForShipment
  }
}
