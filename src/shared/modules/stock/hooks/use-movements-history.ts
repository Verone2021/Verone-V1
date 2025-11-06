/**
 * Hook spécialisé pour la gestion de l'historique des mouvements de stock
 * Page dédiée avec filtres avancés, pagination et exports
 */

'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/shared/modules/common/hooks'
import { useStockMovements } from './use-stock-movements'

// Types pour l'historique des mouvements
export interface MovementHistoryFilters {
  dateRange?: {
    from: Date
    to: Date
  }
  movementTypes?: string[]
  reasonCodes?: string[]
  userIds?: string[]
  productSearch?: string
  affects_forecast?: boolean
  forecast_type?: 'in' | 'out'
  channelId?: string | null  // Filtre par canal de vente (accepte null et undefined)
  limit?: number
  offset?: number
}

export interface MovementWithDetails {
  id: string
  product_id: string
  movement_type: 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER'
  quantity_change: number
  quantity_before: number
  quantity_after: number
  unit_cost?: number
  reference_type?: string
  reference_id?: string
  notes?: string
  reason_code?: string
  affects_forecast: boolean
  forecast_type?: 'in' | 'out'
  performed_by: string
  performed_at: string
  created_at: string

  // Données enrichies
  product_name?: string
  product_sku?: string
  product_image_url?: string | null  // ✅ NOUVEAU - URL image principale produit
  user_name?: string
  user_first_name?: string
  user_last_name?: string
  reason_description?: string

  // Données canal de vente (pour mouvements liés aux commandes clients)
  channel_id?: string | null
  channel_name?: string | null
  channel_code?: string | null
}

export interface MovementsStats {
  totalMovements: number
  movementsToday: number
  movementsThisWeek: number
  movementsThisMonth: number

  byType: {
    IN: number
    OUT: number
    ADJUST: number
    TRANSFER: number
  }

  realMovements?: number
  forecastMovements?: number

  topReasons: Array<{
    code: string
    description: string
    count: number
  }>

  topUsers: Array<{
    user_id: string
    user_name: string
    count: number
  }>
}

export function useMovementsHistory() {
  const [loading, setLoading] = useState(false)
  const [movements, setMovements] = useState<MovementWithDetails[]>([])
  const [stats, setStats] = useState<MovementsStats | null>(null)
  const [total, setTotal] = useState(0)
  // ✅ Phase 3.6 : INITIALISATION par défaut affects_forecast = false (mouvements RÉELS uniquement)
  const [filters, setFilters] = useState<MovementHistoryFilters>({
    affects_forecast: false,  // ✅ Par défaut = mouvements réels uniquement
    forecast_type: undefined
  })
  const { toast } = useToast()
  const { getReasonDescription } = useStockMovements()

  const supabase = useMemo(() => createClient(), [])

  // Récupérer les mouvements avec filtres
  const fetchMovements = useCallback(async (appliedFilters: MovementHistoryFilters = {}) => {
    setLoading(true)
    try {
      let query = supabase
        .from('stock_movements')
        .select('*', { count: 'exact' })

      // Filtres de date
      if (appliedFilters.dateRange) {
        query = query
          .gte('performed_at', appliedFilters.dateRange.from.toISOString())
          .lte('performed_at', appliedFilters.dateRange.to.toISOString())
      }

      // Filtres par type de mouvement
      if (appliedFilters.movementTypes && appliedFilters.movementTypes.length > 0) {
        query = query.in('movement_type', appliedFilters.movementTypes as any)
      }

      // Filtres par motifs
      if (appliedFilters.reasonCodes && appliedFilters.reasonCodes.length > 0) {
        query = query.in('reason_code', appliedFilters.reasonCodes as any)
      }

      // Filtres par utilisateurs
      if (appliedFilters.userIds && appliedFilters.userIds.length > 0) {
        query = query.in('performed_by', appliedFilters.userIds)
      }

      // Filtre par type de mouvement (réel vs prévisionnel)
      // ✅ FIX Phase 3.6: .eq() exclut NULL, utiliser .or() pour inclure données historiques
      if (appliedFilters.affects_forecast !== undefined) {
        if (appliedFilters.affects_forecast === false) {
          // Mouvements RÉELS : NULL ou false (inclut données historiques)
          query = query.or('affects_forecast.is.null,affects_forecast.eq.false')
        } else {
          // Mouvements PRÉVISIONNELS : strictement true
          query = query.eq('affects_forecast', true)
        }
      }

      // Filtre par direction prévisionnel
      if (appliedFilters.forecast_type) {
        query = query.eq('forecast_type', appliedFilters.forecast_type)
      }

      // Recherche produit
      if (appliedFilters.productSearch) {
        // Recherche dans les produits liés
        const productQuery = supabase
          .from('products')
          .select('id')
          .or(`name.ilike.%${appliedFilters.productSearch}%,sku.ilike.%${appliedFilters.productSearch}%`)

        const { data: matchingProducts } = await productQuery
        if (matchingProducts && matchingProducts.length > 0) {
          const productIds = matchingProducts.map(p => p.id)
          query = query.in('product_id', productIds)
        } else {
          // Aucun produit trouvé, retourner résultat vide
          setMovements([])
          setTotal(0)
          return
        }
      }

      // Pagination
      const limit = appliedFilters.limit || 50
      const offset = appliedFilters.offset || 0
      query = query.range(offset, offset + limit - 1)

      // Tri par date décroissante
      query = query.order('performed_at', { ascending: false })

      const { data, error, count } = await query

      if (error) throw error

      // Enrichir les données avec jointures réelles
      if (!data || data.length === 0) {
        setMovements([])
        setTotal(count || 0)
        return
      }

      // Récupérer les IDs utilisateurs et produits uniques
      const userIds = [...new Set(data.map(m => m.performed_by).filter(Boolean))]
      const productIds = [...new Set(data.map(m => m.product_id).filter(Boolean))]

      // Récupérer les profils utilisateurs en parallèle
      const [userProfilesResult, productsResult] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', userIds),
        supabase
          .from('products')
          .select('id, name, sku, product_images!left(public_url)')
          .eq('product_images.is_primary', true)
          .limit(1, { foreignTable: 'product_images' })
          .in('id', productIds)
      ])

      const userProfiles = userProfilesResult.data || []
      const products = productsResult.data || []

      // Enrichir les mouvements avec les données jointes
      const enrichedMovements = data.map(movement => {
        const userProfile = userProfiles.find(profile => profile.user_id === movement.performed_by)
        const product = products.find(prod => prod.id === movement.product_id)

        const userName = userProfile
          ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()
          : 'Utilisateur inconnu'

        return {
          ...movement,
          product_name: product?.name || 'Produit supprimé',
          product_sku: product?.sku || 'SKU inconnu',
          product_image_url: (product as any)?.product_images?.[0]?.public_url || null,  // ✅ NOUVEAU - Image produit
          user_name: userName,
          user_first_name: userProfile?.first_name,
          user_last_name: userProfile?.last_name,
          reason_description: movement.reason_code ? getReasonDescription(movement.reason_code as any) : undefined
        }
      })

      setMovements(enrichedMovements as any)
      setTotal(count || 0)

    } catch (error) {
      console.error('Erreur lors de la récupération des mouvements:', error)
      toast({
        title: "Erreur",
        description: "Impossible de récupérer l'historique des mouvements",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [supabase, toast, getReasonDescription])

  // Récupérer les statistiques
  const fetchStats = useCallback(async () => {
    try {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekStart = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000))
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      // Compter tous les mouvements RÉELS uniquement
      // ✅ FIX Phase 3.6: .or() inclut NULL (données historiques)
      const { count: totalCount } = await supabase
        .from('stock_movements')
        .select('*', { count: 'exact', head: true })
        .or('affects_forecast.is.null,affects_forecast.eq.false')

      // Mouvements du jour (RÉELS uniquement)
      // ✅ FIX Phase 3.6: .or() inclut NULL (données historiques)
      const { count: todayCount } = await supabase
        .from('stock_movements')
        .select('*', { count: 'exact', head: true })
        .or('affects_forecast.is.null,affects_forecast.eq.false')
        .gte('performed_at', today.toISOString())

      // Mouvements de la semaine (RÉELS uniquement)
      // ✅ FIX Phase 3.6: .or() inclut NULL (données historiques)
      const { count: weekCount } = await supabase
        .from('stock_movements')
        .select('*', { count: 'exact', head: true })
        .or('affects_forecast.is.null,affects_forecast.eq.false')
        .gte('performed_at', weekStart.toISOString())

      // Mouvements du mois (RÉELS uniquement)
      // ✅ FIX Phase 3.6: .or() inclut NULL (données historiques)
      const { count: monthCount } = await supabase
        .from('stock_movements')
        .select('*', { count: 'exact', head: true })
        .or('affects_forecast.is.null,affects_forecast.eq.false')
        .gte('performed_at', monthStart.toISOString())

      // Répartition par type (RÉELS uniquement)
      // ✅ FIX Phase 3.6: .or() inclut NULL (données historiques)
      const { data: typeStats } = await supabase
        .from('stock_movements')
        .select('movement_type')
        .or('affects_forecast.is.null,affects_forecast.eq.false')
        .gte('performed_at', monthStart.toISOString())

      const byType = {
        IN: typeStats?.filter(m => m.movement_type === 'IN').length || 0,
        OUT: typeStats?.filter(m => m.movement_type === 'OUT').length || 0,
        ADJUST: typeStats?.filter(m => m.movement_type === 'ADJUST').length || 0,
        TRANSFER: typeStats?.filter(m => m.movement_type === 'TRANSFER').length || 0
      }

      // Comptage mouvements réels vs prévisionnels
      const { count: realCount } = await supabase
        .from('stock_movements')
        .select('*', { count: 'exact', head: true })
        .or('affects_forecast.is.null,affects_forecast.is.false')

      const { count: forecastCount } = await supabase
        .from('stock_movements')
        .select('*', { count: 'exact', head: true })
        .eq('affects_forecast', true)

      // Top motifs du mois (RÉELS uniquement)
      // ✅ FIX Phase 3.6: .or() inclut NULL (données historiques)
      const { data: reasonStats } = await supabase
        .from('stock_movements')
        .select('reason_code')
        .or('affects_forecast.is.null,affects_forecast.eq.false')
        .gte('performed_at', monthStart.toISOString())
        .not('reason_code', 'is', null)

      const reasonCounts = reasonStats?.reduce((acc, item) => {
        if (item.reason_code) {
          acc[item.reason_code] = (acc[item.reason_code] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>) || {}

      const topReasons = Object.entries(reasonCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([code, count]) => ({
          code,
          description: getReasonDescription(code as any),
          count
        }))

      // Top utilisateurs du mois (RÉELS uniquement)
      // ✅ FIX Phase 3.6: .or() inclut NULL (données historiques)
      const { data: userStats } = await supabase
        .from('stock_movements')
        .select('performed_by')
        .or('affects_forecast.is.null,affects_forecast.eq.false')
        .gte('performed_at', monthStart.toISOString())

      // Récupérer les utilisateurs uniques
      const statsUserIds = [...new Set(userStats?.map(m => m.performed_by).filter(Boolean) || [])]

      let statsUserProfiles: any[] = []
      if (statsUserIds.length > 0) {
        const { data } = await supabase
          .from('user_profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', statsUserIds)
        statsUserProfiles = data || []
      }

      const userCounts = userStats?.reduce((acc, item) => {
        const userId = item.performed_by
        const userProfile = statsUserProfiles.find(profile => profile.user_id === userId)
        const userName = userProfile ?
          `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() :
          'Utilisateur inconnu'

        if (!acc[userId]) {
          acc[userId] = { user_id: userId, user_name: userName, count: 0 }
        }
        acc[userId].count++
        return acc
      }, {} as Record<string, { user_id: string, user_name: string, count: number }>) || {}

      const topUsers = Object.values(userCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      setStats({
        totalMovements: totalCount || 0,
        movementsToday: todayCount || 0,
        movementsThisWeek: weekCount || 0,
        movementsThisMonth: monthCount || 0,
        byType,
        realMovements: realCount || 0,
        forecastMovements: forecastCount || 0,
        topReasons,
        topUsers
      })

    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
    }
  }, [supabase, getReasonDescription])

  // Chargement initial - ÉVITER BOUCLE INFINIE
  useEffect(() => {
    fetchMovements(filters)
    fetchStats()
  }, []) // Chargement initial uniquement - éviter boucle infinie avec filters

  // Effet séparé pour les changements de filtres
  useEffect(() => {
    fetchMovements(filters)
  }, [JSON.stringify(filters)]) // Stabiliser avec JSON.stringify

  // Appliquer les filtres
  const applyFilters = useCallback((newFilters: MovementHistoryFilters) => {
    setFilters(newFilters)
  }, [])

  // Reset des filtres
  const resetFilters = useCallback(() => {
    setFilters({})
  }, [])

  // Export des données
  const exportMovements = useCallback(async (format: 'csv' | 'excel' = 'csv') => {
    try {
      // Récupérer tous les mouvements avec les filtres actuels (sans pagination)
      const exportFilters = { ...filters, limit: undefined, offset: undefined }

      let query = supabase
        .from('stock_movements')
        .select('*')

      // Appliquer les mêmes filtres
      if (exportFilters.dateRange) {
        query = query
          .gte('performed_at', exportFilters.dateRange.from.toISOString())
          .lte('performed_at', exportFilters.dateRange.to.toISOString())
      }

      if (exportFilters.movementTypes && exportFilters.movementTypes.length > 0) {
        query = query.in('movement_type', exportFilters.movementTypes as any)
      }

      if (exportFilters.reasonCodes && exportFilters.reasonCodes.length > 0) {
        query = query.in('reason_code', exportFilters.reasonCodes as any)
      }

      if (exportFilters.userIds && exportFilters.userIds.length > 0) {
        query = query.in('performed_by', exportFilters.userIds)
      }

      // ✅ FIX Phase 3.6: .eq() exclut NULL, utiliser .or() pour inclure données historiques
      if (exportFilters.affects_forecast !== undefined) {
        if (exportFilters.affects_forecast === false) {
          // Mouvements RÉELS : NULL ou false (inclut données historiques)
          query = query.or('affects_forecast.is.null,affects_forecast.eq.false')
        } else {
          // Mouvements PRÉVISIONNELS : strictement true
          query = query.eq('affects_forecast', true)
        }
      }

      if (exportFilters.forecast_type) {
        query = query.eq('forecast_type', exportFilters.forecast_type)
      }

      if (exportFilters.productSearch) {
        const productQuery = supabase
          .from('products')
          .select('id')
          .or(`name.ilike.%${exportFilters.productSearch}%,sku.ilike.%${exportFilters.productSearch}%`)

        const { data: matchingProducts } = await productQuery
        if (matchingProducts && matchingProducts.length > 0) {
          const productIds = matchingProducts.map(p => p.id)
          query = query.in('product_id', productIds)
        }
      }

      query = query.order('performed_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error

      if (!data || data.length === 0) {
        toast({
          title: "Aucune donnée",
          description: "Aucun mouvement à exporter avec les filtres actuels"
        })
        return
      }

      // Récupérer les IDs utilisateurs et produits uniques pour l'export
      const exportUserIds = [...new Set(data.map(m => m.performed_by).filter(Boolean))]
      const exportProductIds = [...new Set(data.map(m => m.product_id).filter(Boolean))]

      // Récupérer les profils utilisateurs et produits en parallèle
      const [exportUserProfiles, exportProducts] = await Promise.all([
        exportUserIds.length > 0
          ? supabase.from('user_profiles').select('user_id, first_name, last_name').in('user_id', exportUserIds)
          : { data: [] },
        exportProductIds.length > 0
          ? supabase.from('products').select('id, name, sku').in('id', exportProductIds)
          : { data: [] }
      ])

      // Formater les données pour l'export
      const formattedData = data.map(movement => {
        const userProfile = exportUserProfiles.data?.find(profile => profile.user_id === movement.performed_by)
        const product = exportProducts.data?.find(prod => prod.id === movement.product_id)

        const userName = userProfile
          ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()
          : 'Utilisateur inconnu'

        return {
          'Date/Heure': new Date(movement.performed_at).toLocaleString('fr-FR'),
          'Produit': product?.name || 'Produit supprimé',
          'SKU': product?.sku || 'N/A',
          'Type': movement.movement_type,
          'Quantité': movement.movement_type === 'OUT' ? -movement.quantity_change : movement.quantity_change,
          'Stock Avant': movement.quantity_before,
          'Stock Après': movement.quantity_after,
          'Coût Unitaire': movement.unit_cost || '',
          'Motif': movement.reason_code ? getReasonDescription(movement.reason_code as any) : '',
          'Utilisateur': userName,
          'Notes': movement.notes || '',
          'Référence': movement.reference_type || '',
          'Prévisionnel': movement.affects_forecast ? 'Oui' : 'Non'
        }
      })

      // Générer le fichier (simplifié pour le moment - CSV)
      if (format === 'csv') {
        const headers = Object.keys(formattedData[0] || {})
        const csvContent = [
          headers.join(','),
          ...formattedData.map(row =>
            headers.map(header => `"${row[header as keyof typeof row] || ''}"`).join(',')
          )
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `historique-mouvements-${new Date().toISOString().split('T')[0]}.csv`
        link.click()
      }

      toast({
        title: "Export réussi",
        description: `${formattedData.length} mouvements exportés en ${format.toUpperCase()}`
      })

    } catch (error) {
      console.error('Erreur lors de l\'export:', error)
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les données",
        variant: "destructive"
      })
    }
  }, [supabase, filters, getReasonDescription, toast])

  return {
    // État
    loading,
    movements,
    stats,
    total,
    filters,

    // Actions
    fetchMovements,
    fetchStats,
    applyFilters,
    resetFilters,
    exportMovements,

    // Helpers
    hasFilters: Object.keys(filters).length > 0,
    pagination: {
      currentPage: Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1,
      totalPages: Math.ceil(total / (filters.limit || 50)),
      pageSize: filters.limit || 50
    }
  }
}