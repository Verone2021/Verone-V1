'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { VariantProduct, ProductWithVariants } from '@/types/variant-groups'

/**
 * Hook pour récupérer les variantes (siblings) d'un produit
 * Si le produit fait partie d'un groupe de variantes, retourne les autres produits du groupe
 */
export function useProductVariants(productId: string) {
  const [product, setProduct] = useState<ProductWithVariants | null>(null)
  const [siblings, setSiblings] = useState<VariantProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchProductVariants = async () => {
      if (!productId) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Récupérer le produit avec son groupe de variantes
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select(`
            id,
            name,
            sku,
            cost_price,
            variant_group_id,
            variant_position
          `)
          .eq('id', productId)
          .single()

        if (productError) {
          setError(productError.message)
          setLoading(false)
          return
        }

        if (!productData) {
          setError('Produit non trouvé')
          setLoading(false)
          return
        }

        // Si le produit n'est pas dans un groupe de variantes
        if (!productData.variant_group_id) {
          setProduct({
            ...productData,
            siblings: []
          } as any)
          setSiblings([])
          setLoading(false)
          return
        }

        // Récupérer le groupe de variantes
        const { data: groupData, error: groupError } = await supabase
          .from('variant_groups')
          .select(`
            id,
            name,
            subcategory_id,
            product_count,
            subcategory:subcategories (
              id,
              name,
              category:categories (
                id,
                name
              )
            )
          `)
          .eq('id', productData.variant_group_id)
          .single()

        if (groupError) {
          console.error('Erreur fetch groupe:', groupError)
        }

        // Récupérer les autres produits du groupe (siblings)
        const { data: siblingsData, error: siblingsError } = await supabase
          .from('products')
          .select(`
            id,
            name,
            sku,
            status,
            cost_price,
            variant_position
          `)
          .eq('variant_group_id', productData.variant_group_id)
          .neq('id', productId) // Exclure le produit actuel
          .order('variant_position', { ascending: true })

        if (siblingsError) {
          console.error('Erreur fetch siblings:', siblingsError)
        }

        // Récupérer les images pour chaque sibling
        const siblingsWithImages = await Promise.all(
          (siblingsData || []).map(async (sibling) => {
            const { data: images } = await supabase
              .from('product_images')
              .select('public_url, alt_text, display_order')
              .eq('product_id', sibling.id)
              .order('display_order', { ascending: true })
              .limit(1)

            return {
              ...sibling,
              image_url: images?.[0]?.public_url,
              variant_group_id: productData.variant_group_id
            }
          })
        )

        // Construire l'objet produit complet
        const fullProduct = {
          ...productData,
          variant_group: (groupData || undefined) as any,
          siblings: siblingsWithImages as any
        }

        setProduct(fullProduct as any)
        setSiblings(siblingsWithImages as any)
      } catch (err) {
        console.error('Erreur fetch variantes:', err)
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    fetchProductVariants()
  }, [productId, supabase])

  return {
    product,
    siblings,
    loading,
    error,
    hasVariants: siblings.length > 0
  }
}