"use client"

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type Product = Database['public']['Tables']['products']['Row']
type ProductInsert = Database['public']['Tables']['products']['Insert']

interface DuplicateProductData {
  variantValue: string // Nouvelle valeur de variante (ex: "Bleu Ciel")
  supplierCostPrice?: number // Optionnel, sinon hérite du produit source
}

export function useProductDuplication() {
  const [duplicating, setDuplicating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  /**
   * Duplique un produit en changeant uniquement la valeur de variante
   * Auto-génère le nom et le SKU
   */
  const duplicateProduct = async (
    sourceProductId: string,
    data: DuplicateProductData
  ): Promise<Product | null> => {
    try {
      setDuplicating(true)
      setError(null)

      // 1. Récupérer le produit source avec toutes ses données
      const { data: sourceProduct, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', sourceProductId)
        .single()

      if (fetchError || !sourceProduct) {
        throw new Error('Produit source non trouvé')
      }

      // 2. Récupérer le variant_group pour obtenir le base_sku et le type de variante
      const { data: variantGroup, error: groupError } = await supabase
        .from('variant_groups')
        .select('base_sku, variant_type, name')
        .eq('id', sourceProduct.variant_group_id!)
        .single()

      if (groupError || !variantGroup) {
        throw new Error('Groupe de variantes non trouvé')
      }

      // 3. Générer le nouveau SKU et nom
      const variantSlug = generateSlug(data.variantValue)
      const newSKU = `${variantGroup.base_sku}-${variantSlug}`.toUpperCase() // IMPORTANT: SKU en majuscules
      const newName = `${variantGroup.name} - ${data.variantValue}`

      // 4. Vérifier que le SKU n'existe pas déjà
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('sku', newSKU)
        .single()

      if (existingProduct) {
        throw new Error(`Un produit avec le SKU "${newSKU}" existe déjà`)
      }

      // 5. Préparer les données du nouveau produit
      // On copie toutes les données du produit source SAUF l'ID et les timestamps
      const newProductData: ProductInsert = {
        // Identifiants
        name: newName,
        sku: newSKU,
        slug: generateSlug(newName),
        variant_group_id: sourceProduct.variant_group_id,

        // Fournisseur et client
        supplier_id: sourceProduct.supplier_id,
        assigned_client_id: sourceProduct.assigned_client_id,

        // Prix (utilise la nouvelle valeur ou hérite)
        cost_price: data.supplierCostPrice ?? sourceProduct.cost_price,
        margin_percentage: sourceProduct.margin_percentage,
        target_margin_percentage: sourceProduct.target_margin_percentage,

        // Catégorisation
        subcategory_id: sourceProduct.subcategory_id,
        suitable_rooms: sourceProduct.suitable_rooms,

        // Attributs variante (IMPORTANT : mise à jour avec nouvelle valeur)
        variant_attributes: {
          ...sourceProduct.variant_attributes as Record<string, any>,
          [variantGroup.variant_type]: data.variantValue
        },

        // Statut et stock
        status: sourceProduct.status,
        stock_quantity: 0, // Nouveau produit commence à 0
        stock_real: 0,
        stock_forecasted_in: 0,
        stock_forecasted_out: 0,
        min_stock: sourceProduct.min_stock,
        reorder_point: sourceProduct.reorder_point,
        availability_type: sourceProduct.availability_type,

        // Metadata
        description: sourceProduct.description,
        technical_description: sourceProduct.technical_description,
        selling_points: sourceProduct.selling_points,
        creation_mode: 'duplication' as any, // Indicateur du mode de création
        product_type: sourceProduct.product_type,
        sourcing_type: sourceProduct.sourcing_type,

        // Dimensions (hérite)
        dimensions: sourceProduct.dimensions,
        weight: sourceProduct.weight,

        // Autres
        brand: sourceProduct.brand,
        condition: sourceProduct.condition,
        video_url: sourceProduct.video_url,
        supplier_reference: sourceProduct.supplier_reference,
        supplier_page_url: sourceProduct.supplier_page_url,
        gtin: sourceProduct.gtin,
        requires_sample: sourceProduct.requires_sample,
        variant_position: sourceProduct.variant_position,
        item_group_id: sourceProduct.item_group_id
      }

      // 6. Créer le nouveau produit
      const { data: newProduct, error: createError } = await supabase
        .from('products')
        .insert([newProductData])
        .select()
        .single()

      if (createError) {
        throw createError
      }

      return newProduct
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la duplication'
      setError(errorMessage)
      console.error('Erreur duplication produit:', err)
      return null
    } finally {
      setDuplicating(false)
    }
  }

  /**
   * Génère un slug URL-friendly depuis un texte
   */
  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
      .replace(/[^a-z0-9 -]/g, "") // Supprime caractères spéciaux
      .replace(/\s+/g, "-") // Espaces → tirets
      .replace(/-+/g, "-") // Tirets multiples → tiret unique
      .trim()
  }

  return {
    duplicateProduct,
    duplicating,
    error
  }
}
