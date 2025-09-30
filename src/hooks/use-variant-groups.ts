'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import type {
  VariantGroup,
  VariantProduct,
  CreateVariantGroupData,
  AddProductsToGroupData,
  VariantGroupFilters
} from '@/types/variant-groups'

export function useVariantGroups(filters?: VariantGroupFilters) {
  const [variantGroups, setVariantGroups] = useState<VariantGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  // Récupérer tous les groupes de variantes
  const fetchVariantGroups = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('variant_groups')
        .select(`
          *,
          subcategory:subcategories (
            id,
            name,
            category:categories (
              id,
              name
            )
          )
        `)
        .order('created_at', { ascending: false })

      // Appliquer les filtres
      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`)
      }
      if (filters?.subcategory_id) {
        query = query.eq('subcategory_id', filters.subcategory_id)
      }
      if (filters?.variant_type) {
        query = query.eq('variant_type', filters.variant_type)
      }
      if (filters?.is_active !== undefined) {
        // Filtre par statut actif (groupes avec produits)
        if (filters.is_active) {
          query = query.gt('product_count', 0)
        }
      }
      if (filters?.has_products) {
        query = query.gt('product_count', 0)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        setError(fetchError.message)
        console.error('Erreur fetch variant groups:', fetchError)
        return
      }

      // Pour chaque groupe, récupérer les produits associés
      const groupsWithProducts = await Promise.all(
        (data || []).map(async (group) => {
          const { data: products } = await supabase
            .from('products')
            .select('id, name, sku, status, price_ht:cost_price, variant_position')
            .eq('variant_group_id', group.id)
            .order('variant_position', { ascending: true })

          // Récupérer les images
          const productsWithImages = await Promise.all(
            (products || []).map(async (product) => {
              const { data: images } = await supabase
                .from('product_images')
                .select('public_url, alt_text, display_order')
                .eq('product_id', product.id)
                .order('display_order', { ascending: true })
                .limit(1)

              return {
                ...product,
                image_url: images?.[0]?.public_url
              }
            })
          )

          return {
            ...group,
            products: productsWithImages,
            product_count: productsWithImages.length
          }
        })
      )

      setVariantGroups(groupsWithProducts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase, filters])

  useEffect(() => {
    fetchVariantGroups()
  }, [fetchVariantGroups])

  // Créer un nouveau groupe de variantes
  const createVariantGroup = async (data: CreateVariantGroupData): Promise<boolean> => {
    try {
      const { data: newGroup, error: createError } = await supabase
        .from('variant_groups')
        .insert({
          name: data.name,
          subcategory_id: data.subcategory_id,
          variant_type: data.variant_type || 'color', // Type de variante (color/size/material/pattern)
          product_count: 0
        })
        .select()
        .single()

      if (createError) {
        toast({
          title: "Erreur",
          description: createError.message,
          variant: "destructive"
        })
        return false
      }

      toast({
        title: "Succès",
        description: `Groupe de variantes "${data.name}" créé`
      })

      await fetchVariantGroups()
      return true
    } catch (err) {
      console.error('Erreur création groupe:', err)
      toast({
        title: "Erreur",
        description: "Impossible de créer le groupe",
        variant: "destructive"
      })
      return false
    }
  }

  // Ajouter des produits à un groupe
  const addProductsToGroup = async (data: AddProductsToGroupData): Promise<boolean> => {
    try {
      // Vérifier que les produits ne sont pas déjà dans un groupe
      const { data: existingProducts, error: checkError } = await supabase
        .from('products')
        .select('id, name, variant_group_id')
        .in('id', data.product_ids)
        .not('variant_group_id', 'is', null)

      if (checkError) {
        toast({
          title: "Erreur",
          description: checkError.message,
          variant: "destructive"
        })
        return false
      }

      if (existingProducts && existingProducts.length > 0) {
        toast({
          title: "Attention",
          description: `${existingProducts.length} produit(s) déjà dans un groupe`,
          variant: "destructive"
        })
        return false
      }

      // Récupérer le nombre actuel de produits dans le groupe
      const { data: groupData, error: groupError } = await supabase
        .from('variant_groups')
        .select('product_count')
        .eq('id', data.variant_group_id)
        .single()

      if (groupError) {
        toast({
          title: "Erreur",
          description: groupError.message,
          variant: "destructive"
        })
        return false
      }

      const currentCount = groupData?.product_count || 0

      // Assigner les produits au groupe avec leur position
      const updates = data.product_ids.map((productId, index) => ({
        id: productId,
        variant_group_id: data.variant_group_id,
        variant_position: currentCount + index + 1
      }))

      // Mettre à jour les produits par batch
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('products')
          .update({
            variant_group_id: update.variant_group_id,
            variant_position: update.variant_position
          })
          .eq('id', update.id)

        if (updateError) {
          console.error('Erreur update produit:', updateError)
          toast({
            title: "Erreur",
            description: `Impossible d'ajouter le produit`,
            variant: "destructive"
          })
          return false
        }
      }

      // Mettre à jour le compteur du groupe
      const { error: countError } = await supabase
        .from('variant_groups')
        .update({
          product_count: currentCount + data.product_ids.length,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.variant_group_id)

      if (countError) {
        console.error('Erreur update count:', countError)
      }

      toast({
        title: "Succès",
        description: `${data.product_ids.length} produit(s) ajouté(s) au groupe`
      })

      await fetchVariantGroups()
      return true
    } catch (err) {
      console.error('Erreur ajout produits:', err)
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter les produits",
        variant: "destructive"
      })
      return false
    }
  }

  // Retirer un produit d'un groupe
  const removeProductFromGroup = async (productId: string): Promise<boolean> => {
    try {
      // Récupérer le groupe actuel du produit
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('variant_group_id, variant_position')
        .eq('id', productId)
        .single()

      if (fetchError || !product?.variant_group_id) {
        toast({
          title: "Erreur",
          description: "Produit non trouvé ou pas dans un groupe",
          variant: "destructive"
        })
        return false
      }

      // Retirer le produit du groupe
      const { error: updateError } = await supabase
        .from('products')
        .update({
          variant_group_id: null,
          variant_position: null
        })
        .eq('id', productId)

      if (updateError) {
        toast({
          title: "Erreur",
          description: updateError.message,
          variant: "destructive"
        })
        return false
      }

      // Réorganiser les positions des autres produits
      const { data: remainingProducts } = await supabase
        .from('products')
        .select('id')
        .eq('variant_group_id', product.variant_group_id)
        .order('variant_position', { ascending: true })

      if (remainingProducts) {
        for (let i = 0; i < remainingProducts.length; i++) {
          await supabase
            .from('products')
            .update({ variant_position: i + 1 })
            .eq('id', remainingProducts[i].id)
        }
      }

      // Mettre à jour le compteur du groupe
      const { error: countError } = await supabase
        .from('variant_groups')
        .update({
          product_count: remainingProducts?.length || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.variant_group_id)

      if (countError) {
        console.error('Erreur update count:', countError)
      }

      toast({
        title: "Succès",
        description: "Produit retiré du groupe"
      })

      await fetchVariantGroups()
      return true
    } catch (err) {
      console.error('Erreur retrait produit:', err)
      toast({
        title: "Erreur",
        description: "Impossible de retirer le produit",
        variant: "destructive"
      })
      return false
    }
  }

  // Supprimer un groupe de variantes
  const deleteVariantGroup = async (groupId: string): Promise<boolean> => {
    try {
      // D'abord retirer tous les produits du groupe
      const { error: updateError } = await supabase
        .from('products')
        .update({
          variant_group_id: null,
          variant_position: null
        })
        .eq('variant_group_id', groupId)

      if (updateError) {
        toast({
          title: "Erreur",
          description: updateError.message,
          variant: "destructive"
        })
        return false
      }

      // Supprimer le groupe
      const { error: deleteError } = await supabase
        .from('variant_groups')
        .delete()
        .eq('id', groupId)

      if (deleteError) {
        toast({
          title: "Erreur",
          description: deleteError.message,
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
      console.error('Erreur suppression groupe:', err)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le groupe",
        variant: "destructive"
      })
      return false
    }
  }

  // Récupérer les produits disponibles (pas encore dans un groupe)
  const getAvailableProducts = async (subcategoryId?: string) => {
    let query = supabase
      .from('products')
      .select('id, name, sku, status')
      .is('variant_group_id', null)
      .eq('status', 'active')
      .order('name', { ascending: true })

    if (subcategoryId) {
      query = query.eq('subcategory_id', subcategoryId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erreur fetch produits disponibles:', error)
      return []
    }

    return data || []
  }

  return {
    variantGroups,
    loading,
    error,
    createVariantGroup,
    addProductsToGroup,
    removeProductFromGroup,
    deleteVariantGroup,
    getAvailableProducts,
    refetch: fetchVariantGroups
  }
}