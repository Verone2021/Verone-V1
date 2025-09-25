'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface VariantGroup {
  id: string
  name: string
  description?: string
  base_product_id: string | null
  item_group_id: string
  variant_type: 'color' | 'size' | 'material' | 'pattern'
  is_active: boolean
  created_at: string
  updated_at: string
  // Relations
  base_product?: {
    id: string
    name: string
    sku: string
    price_ht: number
  }
  products?: Array<{
    id: string
    name: string
    sku: string
    price_ht: number
    variant_attributes?: any
  }>
  total_products?: number
  active_products?: number
}

interface VariantGroupFilters {
  search?: string
  variant_type?: 'color' | 'size' | 'material' | 'pattern'
  is_active?: boolean
  has_products?: boolean
}

interface CreateVariantGroupData {
  name: string
  description?: string
  base_product_id?: string
  variant_type: 'color' | 'size' | 'material' | 'pattern'
  is_active?: boolean
}

export function useVariantGroups(filters?: VariantGroupFilters) {
  const [variantGroups, setVariantGroups] = useState<VariantGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  // Génération d'un item_group_id unique pour Google Merchant Center
  const generateItemGroupId = (): string => {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 5)
    return `VG-${timestamp}-${random}`.toUpperCase()
  }

  const fetchVariantGroups = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Version simplifiée pour débogage - sans filtres pour éviter les loops
      const { data: groupsData, error: fetchError } = await supabase
        .from('variant_groups')
        .select('*')
        .limit(10)

      if (fetchError) {
        setError(fetchError.message)
        setVariantGroups([])
      } else {
        // Version simplifiée - juste les données de base
        const simpleGroups = (groupsData || []).map(group => ({
          ...group,
          products: [],
          total_products: 0,
          active_products: 0
        }))
        setVariantGroups(simpleGroups)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setVariantGroups([])
    } finally {
      setLoading(false)
    }
  }, [supabase]) // Seulement supabase comme dépendance

  useEffect(() => {
    fetchVariantGroups()
  }, [fetchVariantGroups])

  // Créer un nouveau groupe de variantes
  const createVariantGroup = async (data: CreateVariantGroupData) => {
    try {
      // Validation Google Merchant Center
      const supportedTypes = ['color', 'size', 'material', 'pattern']
      if (!supportedTypes.includes(data.variant_type)) {
        toast({
          title: "Erreur",
          description: "Type de variante non supporté par Google Merchant Center",
          variant: "destructive"
        })
        return null
      }

      const { data: newGroup, error } = await supabase
        .from('variant_groups')
        .insert([{
          name: data.name,
          description: data.description,
          base_product_id: data.base_product_id,
          item_group_id: generateItemGroupId(),
          variant_type: data.variant_type,
          is_active: data.is_active ?? true
        }])
        .select()
        .single()

      if (error) {
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive"
        })
        return null
      }

      toast({
        title: "Succès",
        description: `Groupe de variantes "${data.name}" créé`
      })

      await fetchVariantGroups()
      return newGroup
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le groupe de variantes",
        variant: "destructive"
      })
      return null
    }
  }

  // Mettre à jour un groupe de variantes
  const updateVariantGroup = async (groupId: string, data: Partial<CreateVariantGroupData>) => {
    try {
      const { error } = await supabase
        .from('variant_groups')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', groupId)

      if (error) {
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive"
        })
        return false
      }

      toast({
        title: "Succès",
        description: "Groupe de variantes mis à jour"
      })

      await fetchVariantGroups()
      return true
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le groupe",
        variant: "destructive"
      })
      return false
    }
  }

  // Supprimer un groupe de variantes
  const deleteVariantGroup = async (groupId: string) => {
    try {
      // Vérifier qu'il n'y a pas de produits associés
      const group = variantGroups.find(g => g.id === groupId)
      if (group && (group.total_products || 0) > 0) {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer un groupe contenant des produits",
          variant: "destructive"
        })
        return false
      }

      const { error } = await supabase
        .from('variant_groups')
        .delete()
        .eq('id', groupId)

      if (error) {
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive"
        })
        return false
      }

      toast({
        title: "Succès",
        description: "Groupe de variantes supprimé"
      })

      await fetchVariantGroups()
      return true
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le groupe",
        variant: "destructive"
      })
      return false
    }
  }

  // Obtenir un groupe spécifique avec ses produits
  const getVariantGroupById = async (groupId: string): Promise<VariantGroup | null> => {
    try {
      const { data: groupData, error } = await supabase
        .from('variant_groups')
        .select(`
          id,
          name,
          description,
          base_product_id,
          item_group_id,
          variant_type,
          is_active,
          created_at,
          updated_at,
          base_product:base_product_id (
            id,
            name,
            sku,
            price_ht
          )
        `)
        .eq('id', groupId)
        .single()

      if (error || !groupData) {
        return null
      }

      // Récupérer les produits du groupe
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, sku, price_ht, variant_attributes, status')
        .eq('variant_group_id', groupId)
        .is('archived_at', null)

      return {
        ...groupData,
        products: productsData || [],
        total_products: productsData?.length || 0,
        active_products: productsData?.filter(p => p.status === 'in_stock').length || 0
      }
    } catch (err) {
      console.error('Error fetching variant group:', err)
      return null
    }
  }

  return {
    variantGroups,
    loading,
    error,
    refetch: fetchVariantGroups,
    createVariantGroup,
    updateVariantGroup,
    deleteVariantGroup,
    getVariantGroupById
  }
}