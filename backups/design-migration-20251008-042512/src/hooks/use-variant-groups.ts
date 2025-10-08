'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { generateProductSKU } from '@/lib/sku-generator'
import type {
  VariantGroup,
  VariantProduct,
  CreateVariantGroupData,
  AddProductsToGroupData,
  VariantGroupFilters,
  VariantType,
  EditableProductFields
} from '@/types/variant-groups'

export function useVariantGroups(filters?: VariantGroupFilters) {
  const [variantGroups, setVariantGroups] = useState<VariantGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Utiliser useRef pour créer le client UNE SEULE FOIS
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  // Récupérer tous les groupes de variantes
  const fetchVariantGroups = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('variant_groups')
        .select('*')
        .is('archived_at', null) // IMPORTANT : Exclure les groupes archivés par défaut
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

      // Récupérer tous les produits des groupes en une seule requête
      const groupIds = (data || []).map(g => g.id)
      let allProducts: any[] = []

      if (groupIds.length > 0) {
        const { data: productsData } = await supabase
          .from('products')
          .select('id, name, sku, status, variant_group_id, variant_position, cost_price, weight, variant_attributes')
          .in('variant_group_id', groupIds)
          .order('variant_position', { ascending: true })

        allProducts = productsData || []
      }

      // Récupérer les images des produits en une requête
      const productIds = allProducts.map(p => p.id)
      let allImages: any[] = []

      if (productIds.length > 0) {
        const { data: imagesData } = await supabase
          .from('product_images')
          .select('product_id, public_url')
          .in('product_id', productIds)
          .order('display_order', { ascending: true })

        allImages = imagesData || []
      }

      // Associer les images aux produits
      const productsWithImages = allProducts.map(product => ({
        ...product,
        image_url: allImages.find(img => img.product_id === product.id)?.public_url
      }))

      // Grouper les produits par variant_group_id
      const groupsWithProducts = (data || []).map(group => ({
        ...group,
        products: productsWithImages.filter(p => p.variant_group_id === group.id),
        product_count: productsWithImages.filter(p => p.variant_group_id === group.id).length
      }))

      setVariantGroups(groupsWithProducts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchVariantGroups()
  }, [fetchVariantGroups])

  // Créer un nouveau groupe de variantes
  const createVariantGroup = async (data: CreateVariantGroupData): Promise<boolean> => {
    try {
      const { data: newGroup, error: createError} = await supabase
        .from('variant_groups')
        .insert({
          name: data.name,
          base_sku: data.base_sku, // SKU de base pour génération automatique
          subcategory_id: data.subcategory_id,
          variant_type: data.variant_type || 'color', // Type de variante (color/material)
          // Dimensions en colonnes séparées (aligné avec schéma SQL)
          dimensions_length: data.dimensions_length || null,
          dimensions_width: data.dimensions_width || null,
          dimensions_height: data.dimensions_height || null,
          dimensions_unit: data.dimensions_unit || 'cm',
          // Poids commun
          common_weight: data.common_weight || null,
          // Catégorisation
          style: data.style || null,
          suitable_rooms: data.suitable_rooms || null,
          // Fournisseur commun
          supplier_id: data.supplier_id || null, // Fournisseur commun (si has_common_supplier = true)
          has_common_supplier: data.has_common_supplier || false, // Flag fournisseur commun
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

      // Récupérer le nombre actuel de produits dans le groupe + tous les attributs à propager
      const { data: groupData, error: groupError } = await supabase
        .from('variant_groups')
        .select('name, base_sku, product_count, dimensions_length, dimensions_width, dimensions_height, dimensions_unit, style, suitable_rooms, subcategory_id, variant_type')
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

      // Préparer les dimensions et poids du groupe pour propagation
      const hasDimensions = groupData?.dimensions_length || groupData?.dimensions_width || groupData?.dimensions_height
      const dimensions = hasDimensions ? {
        length: groupData?.dimensions_length || null,
        width: groupData?.dimensions_width || null,
        height: groupData?.dimensions_height || null,
        unit: groupData?.dimensions_unit || 'cm'
      } : null

      // Assigner les produits au groupe avec leur position
      const updates = data.product_ids.map((productId, index) => ({
        id: productId,
        variant_group_id: data.variant_group_id,
        variant_position: currentCount + index + 1
      }))

      // Mettre à jour les produits par batch avec propagation complète
      for (const update of updates) {
        // Récupérer les variant_attributes du produit pour construire le nom et SKU
        const { data: productData } = await supabase
          .from('products')
          .select('variant_attributes')
          .eq('id', update.id)
          .single()

        // Construire le nom et SKU basés sur le groupe et les attributs variantes
        let productName = groupData?.name || 'Produit'
        let productSKU = ''

        if (productData?.variant_attributes) {
          const attrs = productData.variant_attributes as Record<string, any>
          const variantType = groupData?.variant_type || 'color'
          const variantValue = attrs[variantType]
          if (variantValue) {
            productName = `${groupData?.name} - ${variantValue}`
            productSKU = generateProductSKU(groupData?.base_sku || '', variantValue)
          }
        }

        const { error: updateError } = await supabase
          .from('products')
          .update({
            variant_group_id: update.variant_group_id,
            variant_position: update.variant_position,
            // Propager SEULEMENT les attributs qui existent dans products
            name: productName,
            ...(productSKU && { sku: productSKU }), // Générer SKU automatiquement
            subcategory_id: groupData?.subcategory_id,
            ...(dimensions && { dimensions })
            // ❌ RETIRÉ: style, suitable_rooms, common_weight (n'existent PAS dans products, seulement dans variant_groups)
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

  // Créer un nouveau produit directement dans le groupe avec auto-naming
  const createProductInGroup = useCallback(async (
    groupId: string,
    variantValue: string, // Ex: "Rouge", "L", "Coton"
    variantType: VariantType
  ): Promise<boolean> => {
    try {
      // 1. Récupérer le groupe pour avoir le nom, base_sku et les attributs communs
      const { data: group, error: groupError } = await supabase
        .from('variant_groups')
        .select('name, base_sku, product_count, subcategory_id, common_dimensions, style, suitable_rooms')
        .eq('id', groupId)
        .single()

      if (groupError || !group) {
        throw new Error('Groupe introuvable')
      }

      // 2. Générer le nom du produit : "{group_name} - {variant_value}"
      const productName = `${group.name} - ${variantValue}`

      // 3. Générer automatiquement le SKU : "{BASE_SKU}-{VARIANT_VALUE}"
      const sku = generateProductSKU(group.base_sku, variantValue)

      // 4. Vérifier l'unicité des attributs variantes dans le groupe
      const { data: existingProducts } = await supabase
        .from('products')
        .select('variant_attributes')
        .eq('variant_group_id', groupId)

      if (existingProducts && existingProducts.length > 0) {
        // Vérifier si un produit avec ces attributs existe déjà
        // La validation dépend du variant_type du groupe
        for (const existingProduct of existingProducts) {
          const existing = existingProduct.variant_attributes as Record<string, any>

          // Si le groupe est de type COLOR, bloquer si même couleur
          if (variantType === 'color') {
            if (existing?.color === variantValue) {
              throw new Error(`Un produit avec la couleur "${variantValue}" existe déjà dans ce groupe. Chaque produit doit avoir une couleur unique.`)
            }
          }
          // Si le groupe est de type MATERIAL, bloquer si même matériau
          else if (variantType === 'material') {
            if (existing?.material === variantValue) {
              throw new Error(`Un produit avec le matériau "${variantValue}" existe déjà dans ce groupe. Chaque produit doit avoir un matériau unique.`)
            }
          }
        }
      }

      // 5. Préparer les dimensions si elles existent
      const commonDims = group.common_dimensions as any
      const hasDimensions = commonDims?.length || commonDims?.width || commonDims?.height

      // 6. Créer le produit avec les attributs hérités du groupe
      const newProduct = {
        name: productName,
        sku,
        subcategory_id: group.subcategory_id,
        variant_group_id: groupId,
        variant_position: (group.product_count || 0) + 1,
        variant_attributes: { [variantType]: variantValue },
        status: 'pret_a_commander' as const, // Statut initial pour compléter plus tard
        creation_mode: 'complete' as const, // Contrainte: 'sourcing' ou 'complete' uniquement
        cost_price: 0.01, // Contrainte: cost_price > 0 (pas >= 0), valeur minimale symbolique
        // ❌ RETIRÉ: style, suitable_rooms, common_weight (n'existent PAS dans products, seulement dans variant_groups)
        ...(hasDimensions && {
          dimensions: {
            length: commonDims.length || null,
            width: commonDims.width || null,
            height: commonDims.height || null,
            unit: commonDims.unit || 'cm'
          }
        })
      }

      const { error: createError } = await supabase
        .from('products')
        .insert(newProduct)

      if (createError) {
        console.error('Erreur création produit:', createError)
        throw createError
      }

      // 7. Mettre à jour le compteur du groupe
      const { error: updateError } = await supabase
        .from('variant_groups')
        .update({
          product_count: (group.product_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', groupId)

      if (updateError) {
        console.error('Erreur mise à jour compteur:', updateError)
      }

      toast({
        title: "Produit créé",
        description: `"${productName}" créé avec succès dans le groupe`
      })

      return true
    } catch (err) {
      console.error('Erreur createProductInGroup:', err)
      toast({
        title: "Erreur",
        description: "Impossible de créer le produit",
        variant: "destructive"
      })
      return false
    }
  }, [supabase, toast])

  // Mettre à jour un produit dans un groupe
  const updateProductInGroup = useCallback(async (
    productId: string,
    updates: Partial<EditableProductFields>
  ): Promise<boolean> => {
    try {
      // Si les variant_attributes changent, on doit régénérer le nom et le SKU
      let finalUpdates = { ...updates }

      if (updates.variant_attributes) {
        // Récupérer le produit et son groupe pour régénérer nom/SKU
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('variant_group_id')
          .eq('id', productId)
          .single()

        if (productError || !product?.variant_group_id) {
          throw new Error('Produit ou groupe introuvable')
        }

        // Récupérer les infos du groupe
        const { data: group, error: groupError } = await supabase
          .from('variant_groups')
          .select('name, base_sku, variant_type')
          .eq('id', product.variant_group_id)
          .single()

        if (groupError || !group) {
          throw new Error('Groupe introuvable')
        }

        // Extraire la valeur de variante depuis les nouveaux attributs
        const variantType = group.variant_type || 'color'
        const variantValue = updates.variant_attributes[variantType]

        if (variantValue) {
          // Régénérer automatiquement le nom et le SKU
          finalUpdates.name = `${group.name} - ${variantValue}`
          finalUpdates.sku = generateProductSKU(group.base_sku, variantValue)
        }
      }

      const { error: updateError } = await supabase
        .from('products')
        .update({
          ...finalUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)

      if (updateError) {
        console.error('Erreur mise à jour produit:', updateError)
        toast({
          title: "Erreur",
          description: updateError.message,
          variant: "destructive"
        })
        return false
      }

      toast({
        title: "Succès",
        description: "Produit mis à jour avec succès"
      })

      return true
    } catch (err) {
      console.error('Erreur updateProductInGroup:', err)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le produit",
        variant: "destructive"
      })
      return false
    }
  }, [supabase, toast])

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

      // Rafraîchir la liste AVANT d'afficher le toast pour éviter l'erreur React
      await fetchVariantGroups()

      // Toast APRÈS le rafraîchissement pour éviter "Can't perform a React state update on a component that hasn't mounted yet"
      toast({
        title: "Succès",
        description: "Produit retiré du groupe"
      })

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

  // Mettre à jour un groupe de variantes
  const updateVariantGroup = async (groupId: string, data: any): Promise<boolean> => {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      if (data.name !== undefined) updateData.name = data.name
      if (data.variant_type !== undefined) updateData.variant_type = data.variant_type
      if (data.subcategory_id !== undefined) updateData.subcategory_id = data.subcategory_id
      if (data.style !== undefined) updateData.style = data.style
      if (data.suitable_rooms !== undefined) updateData.suitable_rooms = data.suitable_rooms

      // Gestion du fournisseur commun
      if (data.has_common_supplier !== undefined) updateData.has_common_supplier = data.has_common_supplier
      if (data.supplier_id !== undefined) updateData.supplier_id = data.supplier_id

      // Gestion des dimensions communes (JSONB - format moderne)
      if (data.common_dimensions !== undefined) {
        updateData.common_dimensions = data.common_dimensions
      }

      // Gestion du poids commun
      if (data.common_weight !== undefined) {
        updateData.common_weight = data.common_weight
      }

      // Mettre à jour le groupe
      const { error: updateError } = await supabase
        .from('variant_groups')
        .update(updateData)
        .eq('id', groupId)

      if (updateError) {
        toast({
          title: "Erreur",
          description: updateError.message,
          variant: "destructive"
        })
        return false
      }

      // Propager le fournisseur aux produits si has_common_supplier est activé
      if (data.has_common_supplier !== undefined || data.supplier_id !== undefined) {
        if (data.has_common_supplier && data.supplier_id) {
          // Si fournisseur commun activé ET supplier_id valide, propager à tous les produits
          const { error: supplierPropagationError } = await supabase
            .from('products')
            .update({ supplier_id: data.supplier_id })
            .eq('variant_group_id', groupId)

          if (supplierPropagationError) {
            console.error('Erreur propagation fournisseur aux produits:', supplierPropagationError)
          }
        }
        // Si has_common_supplier est désactivé ou supplier_id null, les produits gardent leur supplier_id actuel
      }

      // Si des attributs ont été modifiés, propager aux produits du groupe
      const needsPropagation = data.common_dimensions !== undefined ||
                               data.style !== undefined ||
                               data.suitable_rooms !== undefined ||
                               data.subcategory_id !== undefined ||
                               data.name !== undefined ||
                               data.common_weight !== undefined

      if (needsPropagation) {
        const productsUpdateData: any = {}

        // Dimensions communes (JSONB direct)
        if (data.common_dimensions !== undefined) {
          productsUpdateData.dimensions = data.common_dimensions
        }

        // Autres champs communs (NOTE: style n'existe pas dans products, donc pas de propagation)
        if (data.suitable_rooms !== undefined) productsUpdateData.suitable_rooms = data.suitable_rooms
        if (data.subcategory_id !== undefined) productsUpdateData.subcategory_id = data.subcategory_id
        if (data.common_weight !== undefined) productsUpdateData.weight = data.common_weight

        // Si le nom du groupe change, mettre à jour les noms des produits
        if (data.name !== undefined) {
          // Récupérer tous les produits du groupe avec leurs variant_attributes
          const { data: products } = await supabase
            .from('products')
            .select('id, variant_attributes')
            .eq('variant_group_id', groupId)

          if (products && products.length > 0) {
            // Récupérer le variant_type du groupe
            const { data: groupInfo } = await supabase
              .from('variant_groups')
              .select('variant_type')
              .eq('id', groupId)
              .single()

            const variantType = groupInfo?.variant_type || 'color'

            // Mettre à jour chaque produit avec le nouveau nom
            for (const product of products) {
              const attrs = product.variant_attributes as Record<string, any>
              const variantValue = attrs?.[variantType]
              if (variantValue) {
                const newProductName = `${data.name} - ${variantValue}`
                await supabase
                  .from('products')
                  .update({ name: newProductName })
                  .eq('id', product.id)
              }
            }
          }
        }

        // Propager les autres attributs aux produits du groupe (sauf name géré ci-dessus)
        if (Object.keys(productsUpdateData).length > 0) {
          const { error: productsError } = await supabase
            .from('products')
            .update(productsUpdateData)
            .eq('variant_group_id', groupId)

          if (productsError) {
            console.error('Erreur propagation dimensions aux produits:', productsError)
            // Ne pas faire échouer toute l'opération si la propagation échoue
          }
        }
      }

      toast({
        title: "Succès",
        description: "Groupe de variantes mis à jour"
      })

      await fetchVariantGroups()
      return true
    } catch (err) {
      console.error('Erreur mise à jour groupe:', err)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le groupe",
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
      .in('status', ['in_stock', 'preorder', 'coming_soon', 'pret_a_commander'])
      .eq('creation_mode', 'complete')
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

  // Archiver un groupe de variantes (archive groupe + TOUS ses produits)
  const archiveVariantGroup = async (groupId: string): Promise<boolean> => {
    try {
      // 1. Archiver le groupe
      const { error: groupError } = await supabase
        .from('variant_groups')
        .update({
          archived_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', groupId)

      if (groupError) {
        toast({
          title: "Erreur",
          description: groupError.message,
          variant: "destructive"
        })
        return false
      }

      // 2. Archiver TOUS les produits du groupe en cascade
      const { error: productsError } = await supabase
        .from('products')
        .update({
          archived_at: new Date().toISOString(),
          status: 'discontinued',
          updated_at: new Date().toISOString()
        })
        .eq('variant_group_id', groupId)
        .is('archived_at', null) // Ne modifier que les produits non-archivés

      if (productsError) {
        toast({
          title: "Avertissement",
          description: `Erreur lors de l'archivage des produits: ${productsError.message}`,
          variant: "destructive"
        })
        // Continue quand même, le groupe est archivé
      }

      toast({
        title: "Groupe archivé",
        description: "Le groupe et tous ses produits ont été archivés"
      })

      await fetchVariantGroups()
      return true
    } catch (err) {
      console.error('Erreur archivage groupe:', err)
      toast({
        title: "Erreur",
        description: "Impossible d'archiver le groupe",
        variant: "destructive"
      })
      return false
    }
  }

  // Restaurer un groupe archivé (restaure groupe + TOUS ses produits)
  const unarchiveVariantGroup = async (groupId: string): Promise<boolean> => {
    try {
      // 1. Restaurer le groupe
      const { error: groupError } = await supabase
        .from('variant_groups')
        .update({
          archived_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', groupId)

      if (groupError) {
        toast({
          title: "Erreur",
          description: groupError.message,
          variant: "destructive"
        })
        return false
      }

      // 2. Restaurer TOUS les produits du groupe
      const { error: productsError } = await supabase
        .from('products')
        .update({
          archived_at: null,
          status: 'in_stock', // Remettre en stock par défaut
          updated_at: new Date().toISOString()
        })
        .eq('variant_group_id', groupId)
        .not('archived_at', 'is', null) // Ne modifier que les produits archivés

      if (productsError) {
        toast({
          title: "Avertissement",
          description: `Erreur lors de la restauration des produits: ${productsError.message}`,
          variant: "destructive"
        })
      }

      toast({
        title: "Groupe restauré",
        description: "Le groupe et tous ses produits ont été restaurés"
      })

      await fetchVariantGroups()
      return true
    } catch (err) {
      console.error('Erreur restauration groupe:', err)
      toast({
        title: "Erreur",
        description: "Impossible de restaurer le groupe",
        variant: "destructive"
      })
      return false
    }
  }

  // Charger les groupes de variantes archivés
  const loadArchivedVariantGroups = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('variant_groups')
        .select('*')
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false })

      if (fetchError) {
        console.error('Erreur chargement groupes archivés:', fetchError)
        return []
      }

      // Récupérer les produits des groupes archivés (incluant archivés et actifs)
      const groupIds = (data || []).map(g => g.id)
      let allProducts: any[] = []

      if (groupIds.length > 0) {
        const { data: productsData } = await supabase
          .from('products')
          .select('id, name, sku, status, variant_group_id, variant_position, cost_price, weight, variant_attributes, archived_at')
          .in('variant_group_id', groupIds)
          .order('variant_position', { ascending: true })

        allProducts = productsData || []
      }

      // Récupérer les images
      const productIds = allProducts.map(p => p.id)
      let allImages: any[] = []

      if (productIds.length > 0) {
        const { data: imagesData } = await supabase
          .from('product_images')
          .select('product_id, public_url')
          .in('product_id', productIds)
          .order('display_order', { ascending: true })

        allImages = imagesData || []
      }

      // Associer les images aux produits
      const productsWithImages = allProducts.map(product => ({
        ...product,
        image_url: allImages.find(img => img.product_id === product.id)?.public_url
      }))

      // Grouper les produits par variant_group_id
      const groupsWithProducts = (data || []).map(group => ({
        ...group,
        products: productsWithImages.filter(p => p.variant_group_id === group.id),
        product_count: productsWithImages.filter(p => p.variant_group_id === group.id).length
      }))

      return groupsWithProducts
    } catch (err) {
      console.error('Erreur:', err)
      return []
    }
  }

  return {
    variantGroups,
    loading,
    error,
    createVariantGroup,
    updateVariantGroup,
    addProductsToGroup,
    createProductInGroup,
    updateProductInGroup,
    removeProductFromGroup,
    deleteVariantGroup,
    archiveVariantGroup,
    unarchiveVariantGroup,
    loadArchivedVariantGroups,
    getAvailableProducts,
    refetch: fetchVariantGroups
  }
}

// Hook pour l'édition des attributs de produits dans un groupe de variantes
export function useProductVariantEditing() {
  const { toast } = useToast()
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  // Mettre à jour le prix d'un produit
  const updateProductPrice = async (productId: string, price: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          cost_price: price,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)

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
        description: "Prix mis à jour"
      })
      return true
    } catch (err) {
      console.error('Erreur mise à jour prix:', err)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le prix",
        variant: "destructive"
      })
      return false
    }
  }

  // Mettre à jour un attribut de variante d'un produit
  const updateProductVariantAttribute = async (
    productId: string,
    attributeKey: string,
    value: string
  ): Promise<boolean> => {
    try {
      // Récupérer les attributs actuels ET les infos du groupe
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select(`
          variant_attributes,
          variant_group_id,
          variant_groups (
            name,
            base_sku,
            variant_type
          )
        `)
        .eq('id', productId)
        .single()

      if (fetchError) {
        toast({
          title: "Erreur",
          description: fetchError.message,
          variant: "destructive"
        })
        return false
      }

      // Mettre à jour l'attribut spécifique
      const updatedAttributes = {
        ...(product?.variant_attributes || {}),
        [attributeKey]: value
      }

      // Récupérer les infos du groupe pour régénérer nom et SKU
      const groupData = (product as any)?.variant_groups

      // Préparer les données de mise à jour
      const updateData: any = {
        variant_attributes: updatedAttributes,
        updated_at: new Date().toISOString()
      }

      // Si le produit appartient à un groupe, régénérer automatiquement nom ET SKU
      if (groupData && groupData.name && groupData.base_sku) {
        const variantType = groupData.variant_type || attributeKey
        const variantValue = updatedAttributes[variantType]

        if (variantValue) {
          // Générer le nouveau nom : "{group_name} - {variant_value}"
          updateData.name = `${groupData.name} - ${variantValue}`

          // Générer le nouveau SKU : "{BASE_SKU}-{VARIANT_VALUE}"
          updateData.sku = generateProductSKU(groupData.base_sku, variantValue)
        }
      }

      const { error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId)

      if (updateError) {
        toast({
          title: "Erreur",
          description: updateError.message,
          variant: "destructive"
        })
        return false
      }

      toast({
        title: "Succès",
        description: `${attributeKey === 'color' ? 'Couleur' : attributeKey === 'material' ? 'Matière' : attributeKey} mise à jour`
      })
      return true
    } catch (err) {
      console.error('Erreur mise à jour attribut:', err)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'attribut",
        variant: "destructive"
      })
      return false
    }
  }

  return {
    updateProductPrice,
    updateProductVariantAttribute
  }
}

// Hook pour récupérer un groupe de variantes spécifique avec ses produits
export function useVariantGroup(groupId: string) {
  const [variantGroup, setVariantGroup] = useState<VariantGroup | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  useEffect(() => {
    const fetchVariantGroup = async () => {
      if (!groupId) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      setVariantGroup(null)

      try {
        // Récupérer le groupe de variantes avec jointures
        const { data: groupData, error: fetchError } = await supabase
          .from('variant_groups')
          .select(`
            *,
            subcategory:subcategories (
              id,
              name,
              category:categories (
                id,
                name,
                family:families (
                  id,
                  name
                )
              )
            ),
            supplier:organisations (
              id,
              name
            )
          `)
          .eq('id', groupId)
          .single()

        if (fetchError) {
          setLoading(false)
          setError(fetchError.message)
          setVariantGroup(null)
          return
        }

        // Récupérer les produits du groupe avec prix et attributs
        const { data: productsData } = await supabase
          .from('products')
          .select(`
            id,
            name,
            sku,
            status,
            variant_group_id,
            variant_position,
            cost_price,
            weight,
            variant_attributes,
            supplier:organisations!products_supplier_id_fkey (
              id,
              name
            )
          `)
          .eq('variant_group_id', groupId)
          .order('variant_position', { ascending: true })

        const products = productsData || []

        // Récupérer les images des produits
        const productIds = products.map(p => p.id)
        let allImages: any[] = []

        if (productIds.length > 0) {
          const { data: imagesData } = await supabase
            .from('product_images')
            .select('product_id, public_url')
            .in('product_id', productIds)
            .order('display_order', { ascending: true })

          allImages = imagesData || []
        }

        // Associer les images aux produits
        const productsWithImages = products.map(product => ({
          ...product,
          image_url: allImages.find(img => img.product_id === product.id)?.public_url
        }))

        // Construire l'objet groupe complet
        const groupWithProducts = {
          ...groupData,
          products: productsWithImages,
          product_count: productsWithImages.length
        }

        setVariantGroup(groupWithProducts)
        setLoading(false)
        setError(null)

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
        setLoading(false)
        setError(errorMessage)
        setVariantGroup(null)
      }
    }

    fetchVariantGroup()
  }, [groupId, supabase])

  return { variantGroup, loading, error }
}
