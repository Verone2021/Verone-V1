/**
 * Hook pour la gestion des réservations de stock
 * Gère les réservations automatiques et manuelles de stock
 */

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

// Types pour les réservations de stock
export interface StockReservation {
  id: string
  product_id: string
  reserved_quantity: number
  reference_type: string
  reference_id: string
  reserved_by: string
  reserved_at: string
  expires_at?: string
  released_at?: string
  released_by?: string
  notes?: string
  created_at: string
  updated_at: string

  // Relations jointes
  products?: {
    id: string
    name: string
    sku: string
    stock_quantity?: number
  }
  user_profiles?: {
    first_name?: string
    last_name?: string
  }
  released_user_profiles?: {
    first_name?: string
    last_name?: string
  }
}

export interface CreateReservationData {
  product_id: string
  reserved_quantity: number
  reference_type: string
  reference_id: string
  expires_at?: string
  notes?: string
}

export interface ReservationFilters {
  product_id?: string
  reference_type?: string
  reference_id?: string
  is_active?: boolean
  expires_soon?: boolean // Expire dans les 24h
  reserved_by?: string
}

interface ReservationStats {
  total_reservations: number
  active_reservations: number
  expired_reservations: number
  total_reserved_quantity: number
  expiring_soon_count: number
}

export function useStockReservations() {
  const [loading, setLoading] = useState(false)
  const [reservations, setReservations] = useState<StockReservation[]>([])
  const [stats, setStats] = useState<ReservationStats | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  // Récupérer toutes les réservations avec filtres
  const fetchReservations = useCallback(async (filters?: ReservationFilters) => {
    setLoading(true)
    try {
      let query = supabase
        .from('stock_reservations')
        .select(`
          *,
          products (
            id,
            name,
            sku,
            stock_quantity,
            product_images!left (
              public_url,
              is_primary
            )
          )
        `)
        .order('reserved_at', { ascending: false })

      // Appliquer les filtres
      if (filters?.product_id) {
        query = query.eq('product_id', filters.product_id)
      }
      if (filters?.reference_type) {
        query = query.eq('reference_type', filters.reference_type)
      }
      if (filters?.reference_id) {
        query = query.eq('reference_id', filters.reference_id)
      }
      if (filters?.is_active !== undefined) {
        if (filters.is_active) {
          query = query.is('released_at', null)
        } else {
          query = query.not('released_at', 'is', null)
        }
      }
      if (filters?.expires_soon) {
        const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        query = query
          .not('expires_at', 'is', null)
          .lte('expires_at', in24Hours)
          .is('released_at', null)
      }
      if (filters?.reserved_by) {
        query = query.eq('reserved_by', filters.reserved_by)
      }

      const { data, error } = await query

      if (error) throw error

      // Enrichir les produits avec primary_image_url (BR-TECH-002)
      const enrichedReservations = (data || []).map((reservation: any) => ({
        ...reservation,
        products: reservation.products ? {
          ...reservation.products,
          primary_image_url: reservation.products.product_images?.[0]?.public_url || null
        } : null
      }))

      setReservations(enrichedReservations)
    } catch (error) {
      console.error('Erreur lors de la récupération des réservations:', error)
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les réservations",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [supabase, toast])

  // Récupérer les statistiques des réservations
  const fetchStats = useCallback(async (filters?: ReservationFilters) => {
    try {
      let query = supabase
        .from('stock_reservations')
        .select('reserved_quantity, expires_at, released_at')

      // Appliquer les mêmes filtres de base
      if (filters?.product_id) {
        query = query.eq('product_id', filters.product_id)
      }
      if (filters?.reference_type) {
        query = query.eq('reference_type', filters.reference_type)
      }

      const { data, error } = await query

      if (error) throw error

      const now = new Date()
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      const statsData = data?.reduce((acc, reservation) => {
        acc.total_reservations++
        acc.total_reserved_quantity += reservation.reserved_quantity

        // Réservation active
        if (!reservation.released_at) {
          acc.active_reservations++

          // Vérifier si expire bientôt
          if (reservation.expires_at && new Date(reservation.expires_at) <= in24Hours) {
            acc.expiring_soon_count++
          }
        }

        // Réservation expirée (mais pas libérée manuellement)
        if (!reservation.released_at && reservation.expires_at && new Date(reservation.expires_at) <= now) {
          acc.expired_reservations++
        }

        return acc
      }, {
        total_reservations: 0,
        active_reservations: 0,
        expired_reservations: 0,
        total_reserved_quantity: 0,
        expiring_soon_count: 0
      })

      setStats(statsData || null)
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
    }
  }, [supabase])

  // Créer une nouvelle réservation
  const createReservation = useCallback(async (data: CreateReservationData) => {
    setLoading(true)
    try {
      // 1. Vérifier le stock disponible
      const { data: availableStock, error: stockError } = await supabase
        .rpc('get_available_stock', { p_product_id: data.product_id })

      if (stockError) throw stockError

      if (availableStock < data.reserved_quantity) {
        throw new Error(`Stock insuffisant. Disponible: ${availableStock}, Demandé: ${data.reserved_quantity}`)
      }

      // 2. Créer la réservation
      const { data: reservation, error: reservationError } = await supabase
        .from('stock_reservations')
        .insert({
          product_id: data.product_id,
          reserved_quantity: data.reserved_quantity,
          reference_type: data.reference_type,
          reference_id: data.reference_id,
          expires_at: data.expires_at,
          notes: data.notes,
          reserved_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single()

      if (reservationError) throw reservationError

      toast({
        title: "Succès",
        description: `${data.reserved_quantity} unité(s) réservée(s) avec succès`
      })

      await fetchReservations()
      return reservation
    } catch (error: any) {
      console.error('Erreur lors de la création de la réservation:', error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la réservation",
        variant: "destructive"
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [supabase, toast, fetchReservations])

  // Libérer une réservation
  const releaseReservation = useCallback(async (reservationId: string, notes?: string) => {
    setLoading(true)
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id

      const { error } = await supabase
        .from('stock_reservations')
        .update({
          released_at: new Date().toISOString(),
          released_by: userId,
          notes: notes || null
        })
        .eq('id', reservationId)
        .is('released_at', null) // Sécurité : ne libérer que les réservations actives

      if (error) throw error

      toast({
        title: "Succès",
        description: "Réservation libérée avec succès"
      })

      await fetchReservations()
    } catch (error: any) {
      console.error('Erreur lors de la libération:', error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible de libérer la réservation",
        variant: "destructive"
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [supabase, toast, fetchReservations])

  // Libérer toutes les réservations d'une référence
  const releaseReservationsForReference = useCallback(async (referenceType: string, referenceId: string, notes?: string) => {
    setLoading(true)
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id

      const { data, error } = await supabase
        .from('stock_reservations')
        .update({
          released_at: new Date().toISOString(),
          released_by: userId,
          notes: notes || null
        })
        .eq('reference_type', referenceType)
        .eq('reference_id', referenceId)
        .is('released_at', null)
        .select()

      if (error) throw error

      const releasedCount = data?.length || 0

      if (releasedCount > 0) {
        toast({
          title: "Succès",
          description: `${releasedCount} réservation(s) libérée(s) avec succès`
        })
      }

      await fetchReservations()
      return releasedCount
    } catch (error: any) {
      console.error('Erreur lors de la libération des réservations:', error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible de libérer les réservations",
        variant: "destructive"
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [supabase, toast, fetchReservations])

  // Étendre l'expiration d'une réservation
  const extendReservation = useCallback(async (reservationId: string, newExpiresAt: string) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('stock_reservations')
        .update({
          expires_at: newExpiresAt
        })
        .eq('id', reservationId)
        .is('released_at', null)

      if (error) throw error

      toast({
        title: "Succès",
        description: "Date d'expiration mise à jour avec succès"
      })

      await fetchReservations()
    } catch (error: any) {
      console.error('Erreur lors de l\'extension:', error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour l'expiration",
        variant: "destructive"
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [supabase, toast, fetchReservations])

  // Nettoyer les réservations expirées
  const cleanupExpiredReservations = useCallback(async () => {
    setLoading(true)
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id
      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from('stock_reservations')
        .update({
          released_at: now,
          released_by: userId,
          notes: 'Libération automatique - expiration'
        })
        .lt('expires_at', now)
        .is('released_at', null)
        .select()

      if (error) throw error

      const cleanedCount = data?.length || 0

      if (cleanedCount > 0) {
        toast({
          title: "Nettoyage effectué",
          description: `${cleanedCount} réservation(s) expirée(s) libérée(s)`
        })
      }

      await fetchReservations()
      return cleanedCount
    } catch (error: any) {
      console.error('Erreur lors du nettoyage:', error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible de nettoyer les réservations expirées",
        variant: "destructive"
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [supabase, toast, fetchReservations])

  // Récupérer les réservations actives d'un produit
  const getActiveReservationsForProduct = useCallback(async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('stock_reservations')
        .select('*')
        .eq('product_id', productId)
        .is('released_at', null)
        .order('reserved_at', { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Erreur lors de la récupération des réservations produit:', error)
      return []
    }
  }, [supabase])

  // Calculer le stock réellement disponible pour un produit
  const getAvailableStockForProduct = useCallback(async (productId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_available_stock', { p_product_id: productId })

      if (error) throw error

      return data || 0
    } catch (error) {
      console.error('Erreur lors du calcul du stock disponible:', error)
      return 0
    }
  }, [supabase])

  // Fonctions utilitaires pour les réservations courantes
  const reserveForSalesOrder = useCallback((productId: string, quantity: number, salesOrderId: string, expiresAt?: string) => {
    return createReservation({
      product_id: productId,
      reserved_quantity: quantity,
      reference_type: 'sales_order',
      reference_id: salesOrderId,
      expires_at: expiresAt,
      notes: 'Réservation automatique pour commande client'
    })
  }, [createReservation])

  const reserveForProduction = useCallback((productId: string, quantity: number, productionOrderId: string, expiresAt?: string) => {
    return createReservation({
      product_id: productId,
      reserved_quantity: quantity,
      reference_type: 'production_order',
      reference_id: productionOrderId,
      expires_at: expiresAt,
      notes: 'Réservation pour ordre de production'
    })
  }, [createReservation])

  const reserveManual = useCallback((productId: string, quantity: number, reason: string, expiresAt?: string) => {
    return createReservation({
      product_id: productId,
      reserved_quantity: quantity,
      reference_type: 'manual',
      reference_id: 'manual-' + Date.now(),
      expires_at: expiresAt,
      notes: reason
    })
  }, [createReservation])

  return {
    // État
    loading,
    reservations,
    stats,

    // Actions principales
    fetchReservations,
    fetchStats,
    createReservation,
    releaseReservation,
    releaseReservationsForReference,
    extendReservation,
    cleanupExpiredReservations,

    // Utilitaires
    getActiveReservationsForProduct,
    getAvailableStockForProduct,

    // Actions simplifiées
    reserveForSalesOrder,
    reserveForProduction,
    reserveManual
  }
}