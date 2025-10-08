/**
 * 🖼️ Hook Collection Images - Vérone Back Office
 * Gestion des images des collections avec upload Supabase Storage
 * Aligné avec use-product-images.ts (best practices)
 */

"use client"

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// Types simplifiés pour collection_images table
export interface CollectionImage {
  id: string
  collection_id: string
  storage_path: string
  public_url: string | null
  display_order: number
  is_primary: boolean
  image_type: 'cover' | 'gallery' | 'banner' | 'thumbnail'
  alt_text: string | null
  file_name: string | null
  file_size: number | null
  mime_type: string | null
  width: number | null
  height: number | null
  created_at: string
  updated_at: string
}

export type CollectionImageType = 'cover' | 'gallery' | 'banner' | 'thumbnail'

interface UseCollectionImagesOptions {
  collectionId: string
  bucketName?: string
  autoFetch?: boolean
}

export function useCollectionImages({
  collectionId,
  bucketName = 'collection-images',
  autoFetch = true
}: UseCollectionImagesOptions) {
  const [images, setImages] = useState<CollectionImage[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // ✨ Fetch optimisé - URL publique générée automatiquement par trigger
  const fetchImages = useCallback(async () => {
    // Early return for empty/invalid collectionId
    if (!collectionId || collectionId.trim() === '') {
      setImages([])
      setLoading(false)
      setError(null)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // 🚀 Requête simplifiée - URL automatique via trigger
      const { data, error } = await supabase
        .from('collection_images')
        .select('*')
        .eq('collection_id', collectionId)
        .order('display_order')
        .order('created_at')

      if (error) throw error

      console.log(`✅ ${data?.length || 0} images chargées pour collection ${collectionId}`)
      setImages((data || []) as CollectionImage[])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur chargement images'
      console.error('❌ Erreur chargement images collection:', errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [collectionId, supabase])

  // ✨ Upload optimisé avec triggers automatiques
  const uploadImage = useCallback(async (
    file: File,
    options: {
      isPrimary?: boolean
      imageType?: CollectionImageType
      altText?: string
    } = {}
  ) => {
    // Prevent upload for collections without valid ID
    if (!collectionId || collectionId.trim() === '') {
      throw new Error('ID collection requis pour upload')
    }

    try {
      setUploading(true)
      setError(null)

      // 📁 Generate unique filename with proper structure
      const fileExt = file.name.split('.').pop()?.toLowerCase()
      const fileName = `collections/${collectionId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      // 📤 Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // 🔢 Get next display order
      const { data: existingImages } = await supabase
        .from('collection_images')
        .select('display_order')
        .eq('collection_id', collectionId)
        .order('display_order', { ascending: false })
        .limit(1)

      const nextOrder = existingImages && existingImages.length > 0
        ? (existingImages[0].display_order || 0) + 1
        : 0

      // 🎯 Create database record - triggers gèrent primary + URL automatiquement
      const imageData = {
        collection_id: collectionId,
        storage_path: uploadData.path,
        display_order: nextOrder,
        is_primary: options.isPrimary || false,
        image_type: options.imageType || 'cover',
        alt_text: options.altText || file.name,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
      }

      const { data: dbData, error: dbError } = await supabase
        .from('collection_images')
        .insert([imageData])
        .select()
        .single()

      if (dbError) {
        // Cleanup uploaded file if database insert fails
        await supabase.storage.from(bucketName).remove([uploadData.path])
        throw dbError
      }

      console.log('✅ Image collection uploadée:', file.name)

      // Refresh images list
      await fetchImages()

      return dbData as CollectionImage
    } catch (err) {
      console.error('❌ Erreur upload collection image:', err)
      setError(err instanceof Error ? err.message : 'Erreur upload')
      throw err
    } finally {
      setUploading(false)
    }
  }, [collectionId, bucketName, supabase, fetchImages])

  // ✨ Upload multiple optimisé
  const uploadMultipleImages = useCallback(async (
    files: File[],
    options: {
      imageType?: CollectionImageType
      altTextPrefix?: string
      firstImagePrimary?: boolean
    } = {}
  ) => {
    const results = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        const result = await uploadImage(file, {
          imageType: options.imageType || 'gallery',
          altText: options.altTextPrefix ? `${options.altTextPrefix} ${i + 1}` : file.name,
          isPrimary: options.firstImagePrimary && i === 0
        })
        results.push(result)
      } catch (err) {
        console.error(`❌ Erreur upload ${file.name}:`, err)
        // Continue with other files
      }
    }

    return results
  }, [uploadImage])

  // ✨ Delete simplifiée
  const deleteImage = useCallback(async (imageId: string) => {
    try {
      setError(null)

      // Get image info before deletion
      const { data: imageData, error: fetchError } = await supabase
        .from('collection_images')
        .select('*')
        .eq('id', imageId)
        .single()

      if (fetchError) throw fetchError

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(bucketName)
        .remove([imageData.storage_path])

      if (storageError) {
        console.warn('⚠️ Erreur suppression storage:', storageError)
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('collection_images')
        .delete()
        .eq('id', imageId)

      if (dbError) throw dbError

      console.log('✅ Image collection supprimée:', imageData.storage_path)
      await fetchImages()
    } catch (err) {
      console.error('❌ Erreur suppression collection image:', err)
      setError(err instanceof Error ? err.message : 'Erreur suppression')
      throw err
    }
  }, [bucketName, supabase, fetchImages])

  // ✨ Reorder optimisé
  const reorderImages = useCallback(async (imageIds: string[]) => {
    try {
      setError(null)

      // Update display_order for each image
      const updates = imageIds.map((imageId, index) =>
        supabase
          .from('collection_images')
          .update({ display_order: index })
          .eq('id', imageId)
      )

      await Promise.all(updates)
      console.log('✅ Ordre images collection mis à jour')
      await fetchImages()
    } catch (err) {
      console.error('❌ Erreur réordonnancement collection images:', err)
      setError(err instanceof Error ? err.message : 'Erreur réordonnancement')
      throw err
    }
  }, [supabase, fetchImages])

  // ✨ Primary image - trigger automatique gère la logique "single primary"
  const setPrimaryImage = useCallback(async (imageId: string) => {
    try {
      setError(null)

      // 🎯 Trigger automatique gère le "unset other primary images"
      const { error } = await supabase
        .from('collection_images')
        .update({ is_primary: true })
        .eq('id', imageId)

      if (error) throw error

      console.log('✅ Image principale collection via trigger')
      await fetchImages()
    } catch (err) {
      console.error('❌ Erreur image principale collection:', err)
      setError(err instanceof Error ? err.message : 'Erreur image principale')
      throw err
    }
  }, [supabase, fetchImages])

  // ✨ Update metadata optimisé
  const updateImageMetadata = useCallback(async (
    imageId: string,
    metadata: {
      alt_text?: string
      image_type?: CollectionImageType
      width?: number
      height?: number
    }
  ) => {
    try {
      setError(null)

      // 🎯 Trigger updated_at automatique
      const { error } = await supabase
        .from('collection_images')
        .update(metadata)
        .eq('id', imageId)

      if (error) throw error

      console.log('✅ Métadonnées collection mises à jour')
      await fetchImages()
    } catch (err) {
      console.error('❌ Erreur métadonnées collection:', err)
      setError(err instanceof Error ? err.message : 'Erreur métadonnées')
      throw err
    }
  }, [supabase, fetchImages])

  // 🎯 Helpers optimisés
  const getPrimaryImage = useCallback(() => {
    return images.find(img => img.is_primary) || images[0] || null
  }, [images])

  const getImagesByType = useCallback((type: CollectionImageType) => {
    return images.filter(img => img.image_type === type)
  }, [images])

  // ✨ Auto-fetch optimisé
  useEffect(() => {
    if (autoFetch && collectionId && collectionId.trim() !== '') {
      console.log('🔄 Auto-fetch collection images:', collectionId)
      fetchImages()
    }
  }, [collectionId, autoFetch]) // fetchImages exclu pour éviter boucle infinie

  return {
    // 📊 Data
    images,
    primaryImage: getPrimaryImage(),

    // 🔄 State
    loading,
    uploading,
    error,

    // 🎬 Actions
    fetchImages,
    uploadImage,
    uploadMultipleImages,
    deleteImage,
    reorderImages,
    setPrimaryImage,
    updateImageMetadata,

    // 🛠️ Helpers
    getImagesByType,

    // 📈 Stats
    totalImages: images.length,
    hasImages: images.length > 0,
    coverImages: getImagesByType('cover'),
    galleryImages: getImagesByType('gallery')
  }
}
