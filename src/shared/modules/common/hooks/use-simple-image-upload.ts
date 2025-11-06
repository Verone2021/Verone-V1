"use client"

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface UploadState {
  uploading: boolean
  progress: number
  error: string | null
  imageUrl: string | null
}

interface UseSimpleImageUploadOptions {
  maxSizeBytes?: number
  allowedTypes?: string[]
  bucket?: string
  onSuccess?: (url: string) => void
  onError?: (error: string) => void
}

export function useSimpleImageUpload(options: UseSimpleImageUploadOptions = {}) {
  const {
    maxSizeBytes = 5 * 1024 * 1024, // 5MB par défaut
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    bucket = 'product-images',
    onSuccess,
    onError
  } = options

  const [state, setState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
    imageUrl: null
  })

  const uploadImage = async (file: File): Promise<string | null> => {
    // Validation du fichier
    if (!file) {
      const error = 'Aucun fichier sélectionné'
      setState(prev => ({ ...prev, error }))
      onError?.(error)
      return null
    }

    if (file.size > maxSizeBytes) {
      const error = `Le fichier ne doit pas dépasser ${Math.round(maxSizeBytes / 1024 / 1024)}MB`
      setState(prev => ({ ...prev, error }))
      onError?.(error)
      return null
    }

    if (!allowedTypes.includes(file.type)) {
      const error = 'Format de fichier non supporté. Utilisez JPG, PNG ou WEBP.'
      setState(prev => ({ ...prev, error }))
      onError?.(error)
      return null
    }

    setState(prev => ({ ...prev, uploading: true, progress: 0, error: null }))

    try {
      // Génération d'un nom unique
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `products/${fileName}`

      // Upload vers Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw new Error(`Erreur d'upload: ${uploadError.message}`)
      }

      // Génération de l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      setState(prev => ({
        ...prev,
        uploading: false,
        progress: 100,
        imageUrl: publicUrl
      }))

      onSuccess?.(publicUrl)
      return publicUrl

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors de l\'upload'
      setState(prev => ({
        ...prev,
        uploading: false,
        progress: 0,
        error: errorMessage
      }))
      onError?.(errorMessage)
      return null
    }
  }

  const deleteImage = async (filePath: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath])

      if (error) {
        throw new Error(`Erreur de suppression: ${error.message}`)
      }

      setState(prev => ({
        ...prev,
        imageUrl: null,
        error: null
      }))

      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la suppression'
      setState(prev => ({ ...prev, error: errorMessage }))
      onError?.(errorMessage)
      return false
    }
  }

  const reset = () => {
    setState({
      uploading: false,
      progress: 0,
      error: null,
      imageUrl: null
    })
  }

  return {
    ...state,
    uploadImage,
    deleteImage,
    reset
  }
}