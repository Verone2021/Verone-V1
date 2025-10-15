/**
 * 🔔 Hook: Notifications Dashboard - Vérone
 *
 * Agrège les notifications et alertes critiques pour affichage
 * dans le dashboard : stocks bas, commandes urgentes, erreurs système.
 */

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type NotificationType = 'stock' | 'order' | 'system' | 'activity'
export type NotificationSeverity = 'info' | 'warning' | 'error' | 'critical'

export interface DashboardNotification {
  id: string
  type: NotificationType
  severity: NotificationSeverity
  title: string
  message: string
  timestamp: Date
  actionUrl?: string
  actionLabel?: string
  commanderUrl?: string  // URL pour créer une commande fournisseur directement
  isRead?: boolean
}

interface UseDashboardNotificationsResult {
  notifications: DashboardNotification[]
  unreadCount: number
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
}

/**
 * Hook pour récupérer les notifications dashboard
 * Analyse plusieurs sources : stocks, commandes, logs activité
 */
export function useDashboardNotifications(limit = 10): UseDashboardNotificationsResult {
  const [notifications, setNotifications] = useState<DashboardNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()
      const allNotifications: DashboardNotification[] = []

      // 1. STOCKS BAS (stock_real < 10 ou stock_quantity < 10)
      const { data: lowStockProducts } = await supabase
        .from('products')
        .select('id, name, sku, stock_real, stock_quantity, supplier_id')
        .or('stock_real.lt.10,stock_quantity.lt.10')
        .limit(5)

      if (lowStockProducts && lowStockProducts.length > 0) {
        lowStockProducts.forEach((product: any) => {
          const stock = product.stock_real ?? product.stock_quantity ?? 0
          allNotifications.push({
            id: `stock-${product.id}`,
            type: 'stock',
            severity: stock < 5 ? 'critical' : 'warning',
            title: 'Stock bas',
            message: `${product.name} - ${stock} unités restantes`,
            timestamp: new Date(),
            actionUrl: `/catalogue/${product.id}`,
            actionLabel: 'Voir le produit',
            commanderUrl: product.supplier_id
              ? `/commandes/fournisseurs/create?product_id=${product.id}&supplier_id=${product.supplier_id}`
              : undefined
          })
        })
      }

      // 2. COMMANDES URGENTES (draft > 3 jours pour sales et purchase)
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

      const [urgentSalesOrders, urgentPurchaseOrders] = await Promise.all([
        supabase
          .from('sales_orders')
          .select('id, order_number, created_at')
          .eq('status', 'draft')
          .lt('created_at', threeDaysAgo.toISOString())
          .limit(3),
        supabase
          .from('purchase_orders')
          .select('id, po_number, created_at')
          .eq('status', 'draft')
          .lt('created_at', threeDaysAgo.toISOString())
          .limit(3)
      ])

      // Sales orders urgentes
      if (urgentSalesOrders.data && urgentSalesOrders.data.length > 0) {
        urgentSalesOrders.data.forEach((order: any) => {
          const daysWaiting = Math.floor(
            (Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60 * 24)
          )

          allNotifications.push({
            id: `sales-order-${order.id}`,
            type: 'order',
            severity: daysWaiting > 7 ? 'critical' : 'warning',
            title: 'Commande vente en attente',
            message: `${order.order_number || 'Sans référence'} - en attente depuis ${daysWaiting} jours`,
            timestamp: new Date(order.created_at),
            actionUrl: `/commandes/ventes?id=${order.id}`,
            actionLabel: 'Voir la commande'
          })
        })
      }

      // Purchase orders urgentes
      if (urgentPurchaseOrders.data && urgentPurchaseOrders.data.length > 0) {
        urgentPurchaseOrders.data.forEach((order: any) => {
          const daysWaiting = Math.floor(
            (Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60 * 24)
          )

          allNotifications.push({
            id: `purchase-order-${order.id}`,
            type: 'order',
            severity: daysWaiting > 7 ? 'critical' : 'warning',
            title: 'Commande achat en attente',
            message: `${order.po_number || 'Sans référence'} - en attente depuis ${daysWaiting} jours`,
            timestamp: new Date(order.created_at),
            actionUrl: `/commandes/achats?id=${order.id}`,
            actionLabel: 'Voir la commande'
          })
        })
      }

      // 3. ERREURS SYSTÈME RÉCENTES (logs avec severity error/critical dans les 24h)
      const oneDayAgo = new Date()
      oneDayAgo.setHours(oneDayAgo.getHours() - 24)

      const { data: errorLogs } = await supabase
        .from('user_activity_logs')
        .select('id, action, severity, created_at, metadata')
        .in('severity', ['error', 'critical'])
        .gte('created_at', oneDayAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(3)

      if (errorLogs && errorLogs.length > 0) {
        errorLogs.forEach((log: any) => {
          allNotifications.push({
            id: `error-${log.id}`,
            type: 'system',
            severity: log.severity as NotificationSeverity,
            title: 'Erreur système',
            message: log.action.replace(/_/g, ' '),
            timestamp: new Date(log.created_at)
          })
        })
      }

      // 4. ACTIVITÉ IMPORTANTE (nouvelles commandes dans les 2 dernières heures)
      const twoHoursAgo = new Date()
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2)

      const [recentSalesOrders, recentPurchaseOrders] = await Promise.all([
        supabase
          .from('sales_orders')
          .select('id, order_number, created_at')
          .gte('created_at', twoHoursAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(2),
        supabase
          .from('purchase_orders')
          .select('id, po_number, created_at')
          .gte('created_at', twoHoursAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(2)
      ])

      // Nouvelles sales orders
      if (recentSalesOrders.data && recentSalesOrders.data.length > 0) {
        recentSalesOrders.data.forEach((order: any) => {
          allNotifications.push({
            id: `activity-sales-${order.id}`,
            type: 'activity',
            severity: 'info',
            title: 'Nouvelle commande vente',
            message: `${order.order_number || 'Sans référence'}`,
            timestamp: new Date(order.created_at),
            actionUrl: `/commandes/ventes?id=${order.id}`,
            actionLabel: 'Voir la commande'
          })
        })
      }

      // Nouvelles purchase orders
      if (recentPurchaseOrders.data && recentPurchaseOrders.data.length > 0) {
        recentPurchaseOrders.data.forEach((order: any) => {
          allNotifications.push({
            id: `activity-purchase-${order.id}`,
            type: 'activity',
            severity: 'info',
            title: 'Nouvelle commande achat',
            message: `${order.po_number || 'Sans référence'}`,
            timestamp: new Date(order.created_at),
            actionUrl: `/commandes/achats?id=${order.id}`,
            actionLabel: 'Voir la commande'
          })
        })
      }

      // Trier par timestamp décroissant et limiter
      allNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      const limited = allNotifications.slice(0, limit)

      setNotifications(limited)

    } catch (err: any) {
      console.error('Erreur chargement notifications:', err)
      setError(err.message || 'Erreur lors du chargement des notifications')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    // TODO: Implémenter le marquage comme lu
    // Pour l'instant, juste filtrer localement
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    )
  }

  useEffect(() => {
    fetchNotifications()

    // Rafraîchir les notifications toutes les 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [limit])

  const unreadCount = notifications.filter(n => !n.isRead).length

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refresh: fetchNotifications,
    markAsRead
  }
}
