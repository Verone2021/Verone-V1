/**
 * 📦 Hook: Statut Commandes Dashboard - Vérone
 *
 * Récupère la répartition des commandes par statut pour affichage
 * dans le widget de suivi des commandes du dashboard.
 */

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Type pour les statuts de commandes
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export interface OrderStatusCount {
  status: OrderStatus
  count: number
  label: string
  color: string
}

export interface OrdersStatusSummary {
  total: number
  byStatus: OrderStatusCount[]
  recentOrders: number // Commandes des 7 derniers jours
  urgentOrders: number // Commandes en attente > 3 jours
}

interface UseOrdersStatusResult {
  summary: OrdersStatusSummary | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

// Configuration des statuts avec labels et couleurs
const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: 'En attente', color: '#ff9b3e' },
  confirmed: { label: 'Confirmées', color: '#3b82f6' },
  processing: { label: 'En préparation', color: '#8b5cf6' },
  shipped: { label: 'Expédiées', color: '#06b6d4' },
  delivered: { label: 'Livrées', color: '#10b981' },
  cancelled: { label: 'Annulées', color: '#ef4444' }
}

/**
 * Hook pour récupérer le résumé des commandes par statut
 * Analyse la table orders pour générer les statistiques
 */
export function useOrdersStatus(): UseOrdersStatusResult {
  const [summary, setSummary] = useState<OrdersStatusSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrdersStatus = async () => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()

      // Récupérer sales_orders et purchase_orders séparément
      const [salesResult, purchaseResult] = await Promise.all([
        supabase.from('sales_orders').select('id, status, created_at'),
        supabase.from('purchase_orders').select('id, status, created_at')
      ])

      if (salesResult.error) {
        console.error('Erreur récupération sales_orders:', salesResult.error)
        throw salesResult.error
      }

      if (purchaseResult.error) {
        console.error('Erreur récupération purchase_orders:', purchaseResult.error)
        throw purchaseResult.error
      }

      const salesOrders = salesResult.data || []
      const purchaseOrders = purchaseResult.data || []

      if (salesOrders.length === 0 && purchaseOrders.length === 0) {
        // Pas de commandes = initialiser à 0
        setSummary({
          total: 0,
          byStatus: Object.entries(STATUS_CONFIG).map(([status, config]) => ({
            status: status as OrderStatus,
            count: 0,
            label: config.label,
            color: config.color
          })),
          recentOrders: 0,
          urgentOrders: 0
        })
        return
      }

      // Mapper les statuts spécifiques aux statuts génériques
      const mapSalesStatus = (status: string): OrderStatus => {
        const mapping: Record<string, OrderStatus> = {
          'draft': 'pending',
          'confirmed': 'confirmed',
          'partially_shipped': 'processing',
          'shipped': 'shipped',
          'delivered': 'delivered',
          'cancelled': 'cancelled'
        }
        return mapping[status] || 'pending'
      }

      const mapPurchaseStatus = (status: string): OrderStatus => {
        const mapping: Record<string, OrderStatus> = {
          'draft': 'pending',
          'sent': 'confirmed',
          'confirmed': 'confirmed',
          'partially_received': 'processing',
          'received': 'delivered',
          'cancelled': 'cancelled'
        }
        return mapping[status] || 'pending'
      }

      // Compter par statut
      const statusCounts = new Map<OrderStatus, number>()
      Object.keys(STATUS_CONFIG).forEach(status => {
        statusCounts.set(status as OrderStatus, 0)
      })

      let recentCount = 0
      let urgentCount = 0
      const now = new Date()
      const sevenDaysAgo = new Date(now)
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const threeDaysAgo = new Date(now)
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

      // Traiter sales_orders
      salesOrders.forEach((order: any) => {
        const mappedStatus = mapSalesStatus(order.status)
        const createdAt = new Date(order.created_at)

        // Incrémenter le compteur du statut
        statusCounts.set(mappedStatus, (statusCounts.get(mappedStatus) || 0) + 1)

        // Commandes récentes (7 derniers jours)
        if (createdAt >= sevenDaysAgo) {
          recentCount++
        }

        // Commandes urgentes (pending/draft > 3 jours)
        if (mappedStatus === 'pending' && createdAt < threeDaysAgo) {
          urgentCount++
        }
      })

      // Traiter purchase_orders
      purchaseOrders.forEach((order: any) => {
        const mappedStatus = mapPurchaseStatus(order.status)
        const createdAt = new Date(order.created_at)

        // Incrémenter le compteur du statut
        statusCounts.set(mappedStatus, (statusCounts.get(mappedStatus) || 0) + 1)

        // Commandes récentes (7 derniers jours)
        if (createdAt >= sevenDaysAgo) {
          recentCount++
        }

        // Commandes urgentes (pending/draft > 3 jours)
        if (mappedStatus === 'pending' && createdAt < threeDaysAgo) {
          urgentCount++
        }
      })

      // Construire le résultat
      const byStatus: OrderStatusCount[] = Object.entries(STATUS_CONFIG).map(([status, config]) => ({
        status: status as OrderStatus,
        count: statusCounts.get(status as OrderStatus) || 0,
        label: config.label,
        color: config.color
      }))

      setSummary({
        total: salesOrders.length + purchaseOrders.length,
        byStatus,
        recentOrders: recentCount,
        urgentOrders: urgentCount
      })

    } catch (err: any) {
      console.error('Erreur chargement statut commandes:', err)
      setError(err.message || 'Erreur lors du chargement des commandes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrdersStatus()
  }, [])

  return {
    summary,
    loading,
    error,
    refresh: fetchOrdersStatus
  }
}
