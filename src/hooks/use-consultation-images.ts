"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../lib/supabase/client'

export interface ConsultationImage {
  id: string
  consultation_id: string
  storage_path: string
  public_url?: string | null
  display_order: number
  is_primary: boolean
  image_type: 'primary' | 'gallery' | 'technical' | 'lifestyle' | 'thumbnail'
  alt_text?: string | null
  width?: number | null
  height?: number | null
  file_size?: number | null
  format?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
}

interface UseConsultationImagesOptions {
  consultationId: string
  autoFetch?: boolean
}

interface UseConsultationImagesState {
  images: ConsultationImage[]
  primaryImage: ConsultationImage | null
  galleryImages: ConsultationImage[]
  loading: boolean
  uploading: boolean
  error: string | null
  hasImages: boolean
}

interface UploadImageData {
  file: File
  altText?: string
  imageType?: 'primary' | 'gallery' | 'technical' | 'lifestyle'
  isPrimary?: boolean
}

export function useConsultationImages({
  consultationId,
  autoFetch = false
}: UseConsultationImagesOptions) {
  const [state, setState] = useState<UseConsultationImagesState>({
    images: [],
    primaryImage: null,
    galleryImages: [],
    loading: false,
    uploading: false,
    error: null,
    hasImages: false
  })

  const supabase = createClient()

  // Calculer les propriétés dérivées
  const updateDerivedState = useCallback((images: ConsultationImage[]) => {
    const primaryImage = images.find(img => img.is_primary) || null
    const galleryImages = images.filter(img => !img.is_primary)
    const hasImages = images.length > 0

    setState(prev => ({
      ...prev,
      images: images.sort((a, b) => a.display_order - b.display_order),
      primaryImage,
      galleryImages,
      hasImages
    }))
  }, [])

  // Récupérer les images de la consultation
  const fetchImages = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const { data, error } = await supabase
        .from('consultation_images')
        .select('*')
        .eq('consultation_id', consultationId)
        .order('display_order', { ascending: true })

      if (error) throw error

      // Générer les URLs publiques pour chaque image (utilise le même bucket que les produits)
      const imagesWithUrls = (data || []).map(image => ({
        ...image,
        public_url: supabase.storage
          .from('product-images')
          .getPublicUrl(image.storage_path).data.publicUrl
      }))

      updateDerivedState(imagesWithUrls as any)

    } catch (err) {
      console.error('❌ Erreur récupération images consultation:', err)
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Erreur inconnue'
      }))
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [consultationId, supabase, updateDerivedState])

  // Upload d'une nouvelle image
  const uploadImage = useCallback(async (data: UploadImageData): Promise<ConsultationImage | null> => {
    setState(prev => ({ ...prev, uploading: true, error: null }))

    try {
      // 1. Générer le nom de fichier
      const fileExt = data.file.name.split('.').pop()?.toLowerCase()
      const fileName = `consultation-${consultationId}-${Date.now()}.${fileExt}`

      // 2. Upload vers Storage (même bucket que les produits)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, data.file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // 3. Déterminer l'ordre d'affichage
      const maxOrder = Math.max(0, ...state.images.map(img => img.display_order))
      const displayOrder = maxOrder + 1

      // 4. Créer l'entrée en base
      const imageData = {
        consultation_id: consultationId,
        storage_path: uploadData.path,
        display_order: displayOrder,
        is_primary: data.isPrimary || state.images.length === 0, // Première image = principale
        image_type: data.imageType || 'gallery',
        alt_text: data.altText || `Photo consultation`,
        file_size: data.file.size,
        format: fileExt || 'jpg'
      }

      const { data: newImage, error: dbError } = await supabase
        .from('consultation_images')
        .insert(imageData)
        .select()
        .single()

      if (dbError) {
        // Nettoyer le fichier uploadé en cas d'erreur DB
        await supabase.storage.from('product-images').remove([uploadData.path])
        throw dbError
      }

      // 5. Ajouter l'URL publique
      const imageWithUrl = {
        ...newImage,
        public_url: supabase.storage
          .from('product-images')
          .getPublicUrl(newImage.storage_path).data.publicUrl
      }

      // 6. Mettre à jour le state local
      const updatedImages = [...state.images, imageWithUrl]
      updateDerivedState(updatedImages as any)

      console.log('✅ Image consultation uploadée:', fileName)
      return imageWithUrl

    } catch (err) {
      console.error('❌ Erreur upload image consultation:', err)
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Erreur upload'
      }))
      return null
    } finally {
      setState(prev => ({ ...prev, uploading: false }))
    }
  }, [consultationId, state.images, supabase, updateDerivedState])

  // Supprimer une image
  const deleteImage = useCallback(async (imageId: string): Promise<boolean> => {
    setState(prev => ({ ...prev, error: null }))

    try {
      // 1. Récupérer l'image pour obtenir le storage_path
      const imageToDelete = state.images.find(img => img.id === imageId)
      if (!imageToDelete) throw new Error('Image non trouvée')

      // 2. Supprimer de la base de données
      const { error: dbError } = await supabase
        .from('consultation_images')
        .delete()
        .eq('id', imageId)

      if (dbError) throw dbError

      // 3. Supprimer du storage
      const { error: storageError } = await supabase.storage
        .from('product-images')
        .remove([imageToDelete.storage_path])

      if (storageError) {
        console.warn('⚠️ Erreur suppression storage (image supprimée de la DB):', storageError)
      }

      // 4. Mettre à jour le state local
      const updatedImages = state.images.filter(img => img.id !== imageId)
      updateDerivedState(updatedImages)

      console.log('✅ Image consultation supprimée')
      return true

    } catch (err) {
      console.error('❌ Erreur suppression image consultation:', err)
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Erreur suppression'
      }))
      return false
    }
  }, [state.images, supabase, updateDerivedState])

  // Définir l'image principale
  const setPrimaryImage = useCallback(async (imageId: string): Promise<boolean> => {
    setState(prev => ({ ...prev, error: null }))

    try {
      const { error } = await supabase
        .from('consultation_images')
        .update({ is_primary: true })
        .eq('id', imageId)

      if (error) throw error

      // Le trigger manage_consultation_primary_image gère automatiquement
      // la désactivation des autres images principales
      await fetchImages() // Recharger pour avoir l'état à jour

      console.log('✅ Image principale consultation définie')
      return true

    } catch (err) {
      console.error('❌ Erreur définition image principale consultation:', err)
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Erreur image principale'
      }))
      return false
    }
  }, [supabase, fetchImages])

  // Réorganiser l'ordre des images
  const reorderImages = useCallback(async (imageId: string, newOrder: number): Promise<boolean> => {
    setState(prev => ({ ...prev, error: null }))

    try {
      const { error } = await supabase
        .from('consultation_images')
        .update({ display_order: newOrder })
        .eq('id', imageId)

      if (error) throw error

      await fetchImages() // Recharger pour voir les changements
      return true

    } catch (err) {
      console.error('❌ Erreur réorganisation images consultation:', err)
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Erreur réorganisation'
      }))
      return false
    }
  }, [supabase, fetchImages])

  // Auto-fetch au montage si demandé
  useEffect(() => {
    if (autoFetch && consultationId) {
      fetchImages()
    }
  }, [autoFetch, consultationId, fetchImages])

  // Statistiques calculées
  const stats = {
    total: state.images.length,
    primary: state.images.filter(img => img.is_primary).length,
    gallery: state.galleryImages.length,
    totalSize: state.images.reduce((sum, img) => sum + (img.file_size || 0), 0)
  }

  return {
    ...state,
    // Actions
    fetchImages,
    uploadImage,
    deleteImage,
    setPrimaryImage,
    reorderImages,
    // Helpers
    stats
  }
}