'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

// ============================================================================
// SCHEMAS DE VALIDATION
// ============================================================================
const photoMetadataSchema = z.object({
  propriete_id: z.string().uuid(),
  unite_id: z.string().uuid().optional(),
  titre: z.string().min(1, 'Le titre est requis'),
  description: z.string().optional(),
  categorie: z.string().optional(),
  piece_nom: z.string().optional(),
  tags: z.array(z.string()).optional(),
  is_public: z.boolean().default(true),
  display_order: z.number().optional()
})

// ============================================================================
// TYPES
// ============================================================================
export type PhotoCategory = {
  code: string
  libelle: string
  icone: string
  ordre: number
  is_active: boolean
}

export type ProprietePhoto = {
  id: string
  propriete_id: string
  unite_id?: string
  titre: string
  description?: string
  categorie?: string
  piece_nom?: string
  bucket_id: string
  storage_path: string
  url_original?: string
  url_thumbnail?: string
  url_medium?: string
  url_large?: string
  mime_type?: string
  size_bytes?: number
  width_original?: number
  height_original?: number
  is_cover: boolean
  is_public: boolean
  display_order: number
  tags?: string[]
  alt_text?: string
  created_at: string
  created_by?: string
}

export type PhotoDetail = ProprietePhoto & {
  propriete_nom?: string
  propriete_ref?: string
  unite_nom?: string
  unite_numero?: string
  categorie_libelle?: string
  categorie_icone?: string
  total_photos_propriete?: number
  total_photos_categorie?: number
  photo_number?: number
  importance?: string
  size_formatted?: string
}

// ============================================================================
// CONSTANTES
// ============================================================================
const BUCKET_NAME = 'proprietes-photos'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']

// ============================================================================
// UPLOAD FUNCTIONS - SIMPLIFIED WITH RLS
// ============================================================================

/**
 * Upload une photo pour une propriété
 * RLS policies handle all permission checking
 */
export async function uploadProprietePhoto(
  file: File,
  metadata: z.infer<typeof photoMetadataSchema>
) {
  const supabase = await createClient()
  
  try {
    // Valider les métadonnées
    const validatedMetadata = photoMetadataSchema.parse(metadata)
    
    // Vérifier la taille du fichier
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `Le fichier est trop volumineux (${(file.size / 1024 / 1024).toFixed(1)}MB, max 10MB)`
      }
    }
    
    // Vérifier le type de fichier
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        success: false,
        error: `Type de fichier non supporté. Utilisez JPEG, PNG, WebP ou HEIC`
      }
    }
    
    // Générer le chemin de stockage
    const { data: pathData, error: pathError } = await supabase.rpc(
      'generate_photo_storage_path',
      {
        p_propriete_id: validatedMetadata.propriete_id,
        p_filename: file.name
      }
    )
    
    if (pathError) {
      throw new Error(`Erreur génération chemin: ${pathError.message}`)
    }
    
    const storagePath = pathData as string
    
    // Upload le fichier dans Supabase Storage
    let finalPath: string = storagePath
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false
      })
    
    if (uploadError) {
      // Si le fichier existe déjà, générer un nouveau nom
      if (uploadError.message?.includes('already exists')) {
        const timestamp = Date.now()
        const newPath = storagePath.replace(/(\.[^.]+)$/, `_${timestamp}$1`)
        
        const { data: retryData, error: retryError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(newPath, file, {
            contentType: file.type
          })
        
        if (retryError) {
          throw new Error(`Erreur upload: ${retryError.message}`)
        }
        finalPath = retryData.path
      } else {
        throw new Error(`Erreur upload: ${uploadError.message}`)
      }
    } else {
      finalPath = uploadData.path
    }
    
    // Générer l'URL publique
    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${finalPath}`
    
    // Get current user ID
    const { data: { user } } = await supabase.auth.getUser()
    
    // Enregistrement en base de données (RLS handles permissions)
    const { data: photoData, error: dbError } = await supabase
      .from('propriete_photos')
      .insert({
        propriete_id: validatedMetadata.propriete_id,
        unite_id: validatedMetadata.unite_id,
        titre: validatedMetadata.titre,
        description: validatedMetadata.description,
        categorie: validatedMetadata.categorie,
        piece_nom: validatedMetadata.piece_nom,
        bucket_id: BUCKET_NAME,
        storage_path: finalPath,
        url_original: publicUrl,
        url_medium: publicUrl, // TODO: Générer des versions redimensionnées
        url_thumbnail: publicUrl, // TODO: Générer des miniatures
        mime_type: file.type,
        size_bytes: file.size,
        tags: validatedMetadata.tags,
        is_public: validatedMetadata.is_public,
        display_order: validatedMetadata.display_order || 999,
        alt_text: validatedMetadata.titre,
        created_by: user?.id
      })
      .select()
      .single()
    
    if (dbError) {
      // En cas d'erreur DB, supprimer le fichier uploadé
      await supabase.storage.from(BUCKET_NAME).remove([finalPath])
      
      // Check if it's a permission error
      if (dbError.message?.includes('row-level security')) {
        throw new Error('Vous n\'avez pas les permissions pour ajouter des photos à cette propriété')
      }
      throw new Error(`Erreur base de données: ${dbError.message}`)
    }
    
    revalidatePath(`/proprietes/${validatedMetadata.propriete_id}`)
    
    return {
      success: true,
      data: photoData as ProprietePhoto
    }
  } catch (error) {
    console.error('Error uploading photo:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de l\'upload de la photo'
    }
  }
}

/**
 * Upload multiple de photos
 */
export async function uploadMultiplePhotos(
  files: File[],
  proprieteId: string,
  defaultMetadata?: Partial<z.infer<typeof photoMetadataSchema>>
) {
  const results: ProprietePhoto[] = []
  const errors: { file: string; error?: string }[] = []
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const metadata = {
      propriete_id: proprieteId,
      titre: defaultMetadata?.titre || `Photo ${i + 1}`,
      categorie: defaultMetadata?.categorie,
      is_public: defaultMetadata?.is_public ?? true,
      display_order: (defaultMetadata?.display_order || 0) + i,
      ...defaultMetadata
    }
    
    const result = await uploadProprietePhoto(file, metadata)
    
    if (result.success && result.data) {
      results.push(result.data)
    } else {
      errors.push({
        file: file.name,
        error: result.error
      })
    }
  }
  
  return {
    success: errors.length === 0,
    uploaded: results,
    errors: errors.length > 0 ? errors : undefined,
    message: `${results.length} photos uploadées${errors.length > 0 ? `, ${errors.length} erreurs` : ''}`
  }
}

// ============================================================================
// READ FUNCTIONS - SIMPLIFIED WITH RLS
// ============================================================================

/**
 * Récupérer toutes les catégories de photos
 */
export async function getPhotoCategories() {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('photo_categories')
      .select('*')
      .eq('is_active', true)
      .order('ordre')
    
    if (error) throw error
    
    return {
      success: true,
      data: data as PhotoCategory[]
    }
  } catch (error) {
    console.error('Error fetching photo categories:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la récupération des catégories'
    }
  }
}

/**
 * Récupérer toutes les photos d'une propriété
 * RLS ensures only authorized users can view
 */
export async function getPhotosByPropriete(proprieteId: string) {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('propriete_photos_detail_v')
      .select('*')
      .eq('propriete_id', proprieteId)
      .order('display_order')
      .order('created_at')
    
    if (error) throw error
    
    // Générer les URLs publiques pour chaque photo
    const photosWithUrls = data?.map(photo => {
      const baseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/`
      return {
        ...photo,
        url_original: photo.url_original || `${baseUrl}${photo.storage_path}`,
        url_medium: photo.url_medium || `${baseUrl}${photo.storage_path}`,
        url_thumbnail: photo.url_thumbnail || `${baseUrl}${photo.storage_path}`
      }
    })
    
    return {
      success: true,
      data: photosWithUrls as PhotoDetail[]
    }
  } catch (error) {
    console.error('Error fetching propriete photos:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la récupération des photos'
    }
  }
}

export async function getPhotosByUnite(uniteId: string) {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('propriete_photos_detail_v')
      .select('*')
      .eq('unite_id', uniteId)
      .order('display_order')
      .order('created_at')
    
    if (error) throw error
    
    // Générer les URLs publiques pour chaque photo
    const photosWithUrls = data?.map(photo => {
      const baseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/`
      return {
        ...photo,
        url_original: photo.url_original || `${baseUrl}${photo.storage_path}`,
        url_medium: photo.url_medium || `${baseUrl}${photo.storage_path}`,
        url_thumbnail: photo.url_thumbnail || `${baseUrl}${photo.storage_path}`
      }
    })
    
    return {
      success: true,
      data: photosWithUrls as PhotoDetail[]
    }
  } catch (error) {
    console.error('Error fetching unite photos:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la récupération des photos de l\'unité'
    }
  }
}

/**
 * Récupérer les photos par catégorie
 */
export async function getPhotosByCategory(proprieteId: string, categorie: string) {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('propriete_photos_detail_v')
      .select('*')
      .eq('propriete_id', proprieteId)
      .eq('categorie', categorie)
      .order('display_order')
    
    if (error) throw error
    
    // Générer les URLs publiques
    const photosWithUrls = data?.map(photo => {
      const baseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/`
      return {
        ...photo,
        url_original: photo.url_original || `${baseUrl}${photo.storage_path}`,
        url_medium: photo.url_medium || `${baseUrl}${photo.storage_path}`,
        url_thumbnail: photo.url_thumbnail || `${baseUrl}${photo.storage_path}`
      }
    })
    
    return {
      success: true,
      data: photosWithUrls as PhotoDetail[]
    }
  } catch (error) {
    console.error('Error fetching photos by category:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la récupération des photos'
    }
  }
}

// ============================================================================
// UPDATE FUNCTIONS - SIMPLIFIED WITH RLS
// ============================================================================

/**
 * Mettre à jour les métadonnées d'une photo
 * RLS ensures only authorized users can update
 */
export async function updatePhotoMetadata(
  photoId: string,
  metadata: Partial<z.infer<typeof photoMetadataSchema>>
) {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('propriete_photos')
      .update({
        titre: metadata.titre,
        description: metadata.description,
        categorie: metadata.categorie,
        piece_nom: metadata.piece_nom,
        tags: metadata.tags,
        is_public: metadata.is_public,
        display_order: metadata.display_order,
        alt_text: metadata.titre // Mettre à jour le texte alternatif avec le titre
      })
      .eq('id', photoId)
      .select()
      .single()
    
    if (error) {
      if (error.message?.includes('row-level security')) {
        throw new Error('Vous n\'avez pas les permissions pour modifier cette photo')
      }
      throw error
    }
    
    // Récupérer la propriété pour revalidation
    const proprieteId = data.propriete_id
    revalidatePath(`/proprietes/${proprieteId}`)
    
    return {
      success: true,
      data: data as ProprietePhoto
    }
  } catch (error) {
    console.error('Error updating photo metadata:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour des métadonnées'
    }
  }
}

/**
 * Définir une photo comme couverture
 */
export async function setCoverPhoto(photoId: string) {
  const supabase = await createClient()
  
  try {
    // Utiliser la fonction SQL pour gérer la photo de couverture
    const { data, error } = await supabase.rpc('set_cover_photo', {
      p_photo_id: photoId
    })
    
    if (error) throw error
    
    // Récupérer la propriété pour revalidation
    const { data: photo } = await supabase
      .from('propriete_photos')
      .select('propriete_id')
      .eq('id', photoId)
      .single()
    
    if (photo) {
      revalidatePath(`/proprietes/${photo.propriete_id}`)
    }
    
    return {
      success: true,
      message: 'Photo de couverture définie avec succès'
    }
  } catch (error) {
    console.error('Error setting cover photo:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la définition de la photo de couverture'
    }
  }
}

/**
 * Définir une photo comme photo de couverture (alternative)
 */
export async function setPhotoCover(
  photoId: string,
  proprieteId: string,
  uniteId?: string
) {
  const supabase = await createClient()
  
  try {
    // Retirer l'ancienne photo de couverture
    const updateOld = uniteId
      ? supabase
          .from('propriete_photos')
          .update({ is_cover: false })
          .eq('unite_id', uniteId)
          .eq('is_cover', true)
      : supabase
          .from('propriete_photos')
          .update({ is_cover: false })
          .eq('propriete_id', proprieteId)
          .is('unite_id', null)
          .eq('is_cover', true)
    
    await updateOld
    
    // Définir la nouvelle photo de couverture
    const { data, error } = await supabase
      .from('propriete_photos')
      .update({ is_cover: true })
      .eq('id', photoId)
      .select()
      .single()
    
    if (error) {
      if (error.message?.includes('row-level security')) {
        throw new Error('Vous n\'avez pas les permissions pour modifier cette photo')
      }
      throw error
    }
    
    revalidatePath(`/proprietes/${proprieteId}`)
    if (uniteId) {
      revalidatePath(`/unites/${uniteId}`)
    }
    
    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('Error setting cover photo:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la définition de la photo de couverture'
    }
  }
}

/**
 * Réorganiser l'ordre des photos
 */
export async function reorderPhotos(proprieteId: string, photoIds: string[]) {
  const supabase = await createClient()
  
  try {
    // Utiliser la fonction SQL pour réorganiser
    const { data, error } = await supabase.rpc('reorder_propriete_photos', {
      p_propriete_id: proprieteId,
      p_photo_ids: photoIds
    })
    
    if (error) throw error
    
    revalidatePath(`/proprietes/${proprieteId}`)
    
    return {
      success: true,
      message: 'Ordre des photos mis à jour avec succès'
    }
  } catch (error) {
    console.error('Error reordering photos:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la réorganisation des photos'
    }
  }
}

// ============================================================================
// DELETE FUNCTIONS - SIMPLIFIED WITH RLS
// ============================================================================

/**
 * Supprimer une photo
 * RLS ensures only authorized users can delete
 */
export async function deletePhoto(photoId: string) {
  const supabase = await createClient()
  
  try {
    // Récupérer les informations de la photo
    const { data: photo, error: fetchError } = await supabase
      .from('propriete_photos')
      .select('propriete_id, storage_path')
      .eq('id', photoId)
      .single()
    
    if (fetchError) throw fetchError
    
    // Supprimer l'entrée de la base de données (RLS will check permissions)
    const { error: dbError } = await supabase
      .from('propriete_photos')
      .delete()
      .eq('id', photoId)
    
    if (dbError) {
      if (dbError.message?.includes('row-level security')) {
        throw new Error('Vous n\'avez pas les permissions pour supprimer cette photo')
      }
      throw dbError
    }
    
    // Supprimer le fichier du Storage (après la DB pour éviter les orphelins)
    if (photo.storage_path) {
      const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([photo.storage_path])
      
      // Continuer même si la suppression du fichier échoue
      if (storageError) {
        console.error('Error deleting file from storage:', storageError)
      }
    }
    
    revalidatePath(`/proprietes/${photo.propriete_id}`)
    
    return {
      success: true,
      message: 'Photo supprimée avec succès'
    }
  } catch (error) {
    console.error('Error deleting photo:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la suppression de la photo'
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Télécharger une photo
 */
export async function downloadPhoto(photoId: string) {
  const supabase = await createClient()
  
  try {
    // Récupérer les infos de la photo
    const { data: photo, error: fetchError } = await supabase
      .from('propriete_photos')
      .select('storage_path, titre, url_original')
      .eq('id', photoId)
      .single()
    
    if (fetchError) throw fetchError
    
    // Si on a déjà l'URL originale, la retourner
    if (photo.url_original) {
      return {
        success: true,
        url: photo.url_original
      }
    }
    
    // Sinon, générer une URL temporaire de téléchargement
    const { data: urlData, error: urlError } = await supabase
      .storage
      .from('propriete-photos')
      .createSignedUrl(photo.storage_path, 60) // URL valide 60 secondes
    
    if (urlError) throw urlError
    
    return {
      success: true,
      url: urlData.signedUrl
    }
  } catch (error) {
    console.error('Error downloading photo:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors du téléchargement'
    }
  }
}