"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CollectionProduct, formatCollectionProduct } from '@/types/collections'

interface CollectionProductWithMeta {
  id: string
  collection_id: string
  product_id: string
  position: number
  added_at: string
  products: CollectionProduct
}

interface UseCollectionProductsReturn {
  products: CollectionProductWithMeta[]
  productIds: string[]
  loading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Hook spécialisé pour récupérer les produits d'une collection
 * Résout le problème d'existingProductIds dans product-selector-modal
 */
export function useCollectionProducts(collectionId: string): UseCollectionProductsReturn {
  const [products, setProducts] = useState<CollectionProductWithMeta[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchCollectionProducts = async () => {
    if (!collectionId) {
      setProducts([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      // ✅ QUERY : Récupération complète avec relation product_images
      const { data, error: fetchError } = await supabase
        .from('collection_products')
        .select(`
          id,
          collection_id,
          product_id,
          position,
          products!inner (
            id,
            name,
            sku,
            status,
            creation_mode,
            cost_price,
            product_images!left (
              id,
              public_url,
              storage_path,
              is_primary,
              display_order,
              image_type,
              alt_text
            )
          )
        `)
        .eq('collection_id', collectionId)
        .eq('products.creation_mode', 'complete') // ✅ FILTRAGE : Exclure sourcing
        .order('position', { ascending: true })

      if (fetchError) {
        throw fetchError
      }

      // ✅ TRANSFORMATION : Utiliser helper function unifiée
      const transformedProducts = (data || [])
        .filter(item => item.products) // Sécurité contre données corrompues
        .map(item => ({
          id: item.id,
          collection_id: item.collection_id,
          product_id: item.product_id,
          position: item.position,
          added_at: new Date().toISOString(), // Date par défaut
          products: formatCollectionProduct({
            ...item.products,
            position: item.position,
            added_at: new Date().toISOString() // Date par défaut
          })
        })) as CollectionProductWithMeta[]

      setProducts(transformedProducts)
    } catch (err) {
      console.error('Error fetching collection products:', err)
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCollectionProducts()
  }, [collectionId])

  // ✅ EXTRACTION : IDs produits pour ProductSelectorModal (existingProductIds)
  const productIds = products.map(item => item.product_id)

  return {
    products,
    productIds,
    loading,
    error,
    refetch: fetchCollectionProducts
  }
}