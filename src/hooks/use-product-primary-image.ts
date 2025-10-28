'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface ProductPrimaryImage {
  id: string
  product_id: string
  public_url: string
  storage_path: string
  alt_text?: string
}

/**
 * Hook pour récupérer l'image primaire d'un produit
 * Utilise la table product_images avec filtre is_primary=true
 */
export function useProductPrimaryImage(productId: string | undefined) {
  const [image, setImage] = useState<ProductPrimaryImage | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    if (!productId) {
      setImage(null)
      return
    }

    const fetchPrimaryImage = async () => {
      setLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await supabase
          .from('product_images')
          .select('id, product_id, public_url, storage_path, alt_text')
          .eq('product_id', productId)
          .eq('is_primary', true)
          .single()

        if (fetchError) {
          // Si aucune image primaire, ce n'est pas une erreur bloquante
          if (fetchError.code === 'PGRST116') {
            setImage(null)
            return
          }
          throw fetchError
        }

        setImage(data as any)
      } catch (err) {
        console.error('[useProductPrimaryImage] Error:', err)
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
        setImage(null)
      } finally {
        setLoading(false)
      }
    }

    fetchPrimaryImage()
  }, [productId, supabase])

  return { image, loading, error }
}

/**
 * Hook pour récupérer les images primaires de plusieurs produits en une seule query
 * Optimisé pour les listes de produits
 */
export function useProductPrimaryImages(productIds: string[]) {
  const [images, setImages] = useState<Record<string, ProductPrimaryImage>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    if (!productIds || productIds.length === 0) {
      setImages({})
      return
    }

    const fetchPrimaryImages = async () => {
      setLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await supabase
          .from('product_images')
          .select('id, product_id, public_url, storage_path, alt_text')
          .in('product_id', productIds)
          .eq('is_primary', true)

        if (fetchError) throw fetchError

        // Transformer en objet indexé par product_id
        const imageMap: Record<string, ProductPrimaryImage> = {}
        data?.forEach(img => {
          imageMap[img.product_id] = img
        })

        setImages(imageMap)
      } catch (err) {
        console.error('[useProductPrimaryImages] Error:', err)
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
        setImages({})
      } finally {
        setLoading(false)
      }
    }

    fetchPrimaryImages()
  }, [JSON.stringify(productIds), supabase])

  return { images, loading, error }
}
