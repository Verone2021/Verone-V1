"use client"

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type ProductImage = Database['public']['Tables']['product_images']['Row']
type ProductImageInsert = Database['public']['Tables']['product_images']['Insert']
type ProductImageUpdate = Database['public']['Tables']['product_images']['Update']

export interface ProductImageWithUrl extends ProductImage {
  public_url?: string
  transformed_url?: string
}

interface UseProductImagesOptions {
  productId: string
  productType?: 'product' | 'draft'
  bucketName?: string
  transformations?: {
    width?: number
    height?: number
    resize?: 'contain' | 'cover' | 'fill'
    format?: 'webp' | 'jpeg' | 'png'
  }
}

export function useProductImages({
  productId,
  productType = 'product',
  bucketName = 'product-images',
  transformations = { width: 200, height: 200, resize: 'cover', format: 'webp' }
}: UseProductImagesOptions) {
  const [images, setImages] = useState<ProductImageWithUrl[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Fetch all images for a product
  const fetchImages = useCallback(async () => {
    // Early return for empty/invalid productId (new products without ID)
    if (!productId || productId.trim() === '') {
      setImages([])
      setLoading(false)
      setError(null)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .eq('product_type', productType)
        .order('display_order')
        .order('created_at')

      if (error) throw error

      // Generate public URLs (Supabase Storage ne supporte pas les transformations /transform/)
      const imagesWithUrls: ProductImageWithUrl[] = (data || []).map(image => {
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(image.storage_path)

        console.log(`🔍 Image URL générée: ${urlData.publicUrl}`)

        return {
          ...image,
          public_url: urlData.publicUrl,
          transformed_url: urlData.publicUrl // Même URL pour l'instant
        }
      })

      setImages(imagesWithUrls)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue lors du chargement des images'
      console.error('❌ Erreur lors du chargement des images:', errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [productId, productType, bucketName, transformations, supabase])

  // Upload single image
  const uploadImage = useCallback(async (
    file: File,
    options: {
      isPrimary?: boolean
      imageType?: 'gallery' | 'thumbnail' | 'technical' | 'lifestyle'
      altText?: string
    } = {}
  ) => {
    // Prevent upload for products without valid ID
    if (!productId || productId.trim() === '') {
      throw new Error('Impossible d\'uploader une image sans ID de produit valide')
    }

    try {
      setUploading(true)
      setError(null)

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${productType}s/${productId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get next display order
      const { data: existingImages } = await supabase
        .from('product_images')
        .select('display_order')
        .eq('product_id', productId)
        .eq('product_type', productType)
        .order('display_order', { ascending: false })
        .limit(1)

      const nextOrder = existingImages && existingImages.length > 0
        ? (existingImages[0].display_order || 0) + 1
        : 0

      // If setting as primary, unset other primary images
      if (options.isPrimary) {
        await supabase
          .from('product_images')
          .update({ is_primary: false })
          .eq('product_id', productId)
          .eq('product_type', productType)
      }

      // Create database record
      const imageData: ProductImageInsert = {
        product_id: productId,
        product_type: productType,
        storage_path: uploadData.path,
        display_order: nextOrder,
        is_primary: options.isPrimary || false,
        image_type: options.imageType || 'gallery',
        alt_text: options.altText || file.name,
        file_size: file.size,
        format: fileExt?.toLowerCase() || 'jpg',
      }

      const { data: dbData, error: dbError } = await supabase
        .from('product_images')
        .insert([imageData])
        .select()
        .single()

      if (dbError) {
        // Cleanup uploaded file if database insert fails
        await supabase.storage.from(bucketName).remove([uploadData.path])
        throw dbError
      }

      console.log('✅ Image uploadée:', file.name)

      // Refresh images list
      await fetchImages()

      return dbData
    } catch (err) {
      console.error('❌ Erreur lors de l\'upload:', err)
      setError(err instanceof Error ? err.message : 'Erreur upload')
      throw err
    } finally {
      setUploading(false)
    }
  }, [productId, productType, bucketName, supabase, fetchImages])

  // Upload multiple images
  const uploadMultipleImages = useCallback(async (
    files: File[],
    options: {
      imageType?: 'gallery' | 'thumbnail' | 'technical' | 'lifestyle'
      altTextPrefix?: string
    } = {}
  ) => {
    const results = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        const result = await uploadImage(file, {
          imageType: options.imageType,
          altText: options.altTextPrefix ? `${options.altTextPrefix} ${i + 1}` : file.name,
          isPrimary: i === 0 // First image is primary by default
        })
        results.push(result)
      } catch (err) {
        console.error(`❌ Erreur upload fichier ${file.name}:`, err)
        // Continue with other files
      }
    }

    return results
  }, [uploadImage])

  // Delete image
  const deleteImage = useCallback(async (imageId: string) => {
    try {
      setError(null)

      // Get image info before deletion
      const { data: imageData, error: fetchError } = await supabase
        .from('product_images')
        .select('*')
        .eq('id', imageId)
        .single()

      if (fetchError) throw fetchError

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(bucketName)
        .remove([imageData.storage_path])

      if (storageError) {
        console.warn('⚠️ Erreur suppression storage (fichier peut-être déjà supprimé):', storageError)
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId)

      if (dbError) throw dbError

      console.log('✅ Image supprimée:', imageData.storage_path)

      // Refresh images list
      await fetchImages()
    } catch (err) {
      console.error('❌ Erreur lors de la suppression:', err)
      setError(err instanceof Error ? err.message : 'Erreur suppression')
      throw err
    }
  }, [bucketName, supabase, fetchImages])

  // Reorder images
  const reorderImages = useCallback(async (imageIds: string[]) => {
    try {
      setError(null)

      // Update display_order for each image
      const updates = imageIds.map((imageId, index) =>
        supabase
          .from('product_images')
          .update({ display_order: index })
          .eq('id', imageId)
      )

      await Promise.all(updates)

      console.log('✅ Ordre des images mis à jour')

      // Refresh images list
      await fetchImages()
    } catch (err) {
      console.error('❌ Erreur lors du réordonnancement:', err)
      setError(err instanceof Error ? err.message : 'Erreur réordonnancement')
      throw err
    }
  }, [supabase, fetchImages])

  // Set primary image
  const setPrimaryImage = useCallback(async (imageId: string) => {
    try {
      setError(null)

      // Unset all primary images for this product
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', productId)
        .eq('product_type', productType)

      // Set new primary image
      const { error } = await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('id', imageId)

      if (error) throw error

      console.log('✅ Image principale mise à jour')

      // Refresh images list
      await fetchImages()
    } catch (err) {
      console.error('❌ Erreur lors de la définition image principale:', err)
      setError(err instanceof Error ? err.message : 'Erreur image principale')
      throw err
    }
  }, [productId, productType, supabase, fetchImages])

  // Update image metadata
  const updateImageMetadata = useCallback(async (
    imageId: string,
    metadata: {
      alt_text?: string
      image_type?: 'gallery' | 'thumbnail' | 'technical' | 'lifestyle'
      width?: number
      height?: number
    }
  ) => {
    try {
      setError(null)

      const { error } = await supabase
        .from('product_images')
        .update({
          ...metadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', imageId)

      if (error) throw error

      console.log('✅ Métadonnées image mises à jour')

      // Refresh images list
      await fetchImages()
    } catch (err) {
      console.error('❌ Erreur lors de la mise à jour des métadonnées:', err)
      setError(err instanceof Error ? err.message : 'Erreur mise à jour métadonnées')
      throw err
    }
  }, [supabase, fetchImages])

  // Get primary image
  const getPrimaryImage = useCallback(() => {
    return images.find(img => img.is_primary) || images[0] || null
  }, [images])

  // Get images by type
  const getImagesByType = useCallback((type: 'gallery' | 'thumbnail' | 'technical' | 'lifestyle') => {
    return images.filter(img => img.image_type === type)
  }, [images])

  // Auto-fetch images when productId changes
  useEffect(() => {
    if (productId && productId.trim() !== '') {
      console.log('🔄 Auto-fetch images pour productId:', productId)
      fetchImages()
    }
  }, [productId, productType, fetchImages])

  return {
    // Data
    images,
    primaryImage: getPrimaryImage(),

    // State
    loading,
    uploading,
    error,

    // Actions
    fetchImages,
    uploadImage,
    uploadMultipleImages,
    deleteImage,
    reorderImages,
    setPrimaryImage,
    updateImageMetadata,

    // Helpers
    getImagesByType,

    // Stats
    totalImages: images.length,
    hasImages: images.length > 0
  }
}