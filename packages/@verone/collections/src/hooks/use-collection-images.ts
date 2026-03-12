/**
 * 🖼️ Hook Collection Images - Vérone Back Office
 * Gestion des images des collections avec upload Supabase Storage
 * Aligné avec use-product-images.ts (best practices)
 */

'use client';

import { useState, useCallback, useEffect } from 'react';

import logger from '@verone/utils/logger';
import { createClient } from '@verone/utils/supabase/client';

// Types simplifiés pour collection_images table
export interface CollectionImage {
  id: string;
  collection_id: string;
  storage_path: string;
  public_url: string | null;
  display_order: number;
  is_primary: boolean;
  image_type: 'cover' | 'gallery' | 'banner' | 'thumbnail';
  alt_text: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  created_at: string;
  updated_at: string;
}

export type CollectionImageType = 'cover' | 'gallery' | 'banner' | 'thumbnail';

interface UseCollectionImagesOptions {
  collectionId: string;
  bucketName?: string;
  autoFetch?: boolean;
}

export function useCollectionImages({
  collectionId,
  bucketName = 'collection-images',
  autoFetch = true,
}: UseCollectionImagesOptions) {
  const [images, setImages] = useState<CollectionImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // ✨ Fetch optimisé - URL publique générée automatiquement par trigger
  const fetchImages = useCallback(async () => {
    // Early return for empty/invalid collectionId
    if (!collectionId || collectionId.trim() === '') {
      setImages([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 🚀 Requête simplifiée - URL automatique via trigger
      const { data, error } = await supabase
        .from('collection_images')
        .select(
          'id, collection_id, public_url, storage_path, display_order, alt_text, is_cover, created_at, updated_at'
        )
        .eq('collection_id', collectionId)
        .order('display_order')
        .order('created_at');

      if (error) throw error;

      logger.info('Images collection chargées', {
        operation: 'fetch_collection_images',
        collectionId,
        imagesCount: data?.length || 0,
      });
      setImages((data || []) as unknown as CollectionImage[]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur chargement images';
      logger.error('Erreur chargement images collection', err as Error, {
        operation: 'fetch_collection_images_failed',
        collectionId,
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [collectionId, supabase]);

  // ✨ Upload optimisé avec triggers automatiques
  const uploadImage = useCallback(
    async (
      file: File,
      options: {
        isPrimary?: boolean;
        imageType?: CollectionImageType;
        altText?: string;
      } = {}
    ) => {
      // Prevent upload for collections without valid ID
      if (!collectionId || collectionId.trim() === '') {
        throw new Error('ID collection requis pour upload');
      }

      try {
        setUploading(true);
        setError(null);

        // 📁 Generate unique filename with proper structure
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        const fileName = `collections/${collectionId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        // 📤 Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // 🔢 Get next display order
        const { data: existingImages } = await supabase
          .from('collection_images')
          .select('display_order')
          .eq('collection_id', collectionId)
          .order('display_order', { ascending: false })
          .limit(1);

        const nextOrder =
          existingImages && existingImages.length > 0
            ? (existingImages[0].display_order || 0) + 1
            : 0;

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
        };

        const { data: dbData, error: dbError } = await supabase
          .from('collection_images')
          .insert([imageData])
          .select(
            'id, collection_id, storage_path, public_url, display_order, is_primary, image_type, alt_text, file_name, file_size, mime_type, width, height, created_at, updated_at'
          )
          .single();

        if (dbError) {
          // Cleanup uploaded file if database insert fails
          await supabase.storage.from(bucketName).remove([uploadData.path]);
          throw dbError;
        }

        logger.info('Image collection uploadée', {
          operation: 'upload_collection_image',
          collectionId,
          fileName: file.name,
          fileSize: file.size,
        });

        // Refresh images list
        await fetchImages();

        return dbData as CollectionImage;
      } catch (err) {
        logger.error('Erreur upload image collection', err as Error, {
          operation: 'upload_collection_image_failed',
          collectionId,
        });
        setError(err instanceof Error ? err.message : 'Erreur upload');
        throw err;
      } finally {
        setUploading(false);
      }
    },
    [collectionId, bucketName, supabase, fetchImages]
  );

  // ✨ Upload multiple optimisé
  const uploadMultipleImages = useCallback(
    async (
      files: File[],
      options: {
        imageType?: CollectionImageType;
        altTextPrefix?: string;
        firstImagePrimary?: boolean;
      } = {}
    ) => {
      const results: CollectionImage[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const result = await uploadImage(file, {
            imageType: options.imageType || 'gallery',
            altText: options.altTextPrefix
              ? `${options.altTextPrefix} ${i + 1}`
              : file.name,
            isPrimary: options.firstImagePrimary && i === 0,
          });
          results.push(result);
        } catch (err) {
          logger.error(
            'Erreur upload multiple images collection',
            err as Error,
            {
              operation: 'upload_multiple_collection_images_failed',
              collectionId,
              fileName: file.name,
            }
          );
          // Continue with other files
        }
      }

      return results;
    },
    [uploadImage]
  );

  // ✨ Delete simplifiée
  const deleteImage = useCallback(
    async (imageId: string) => {
      try {
        setError(null);

        // Get image info before deletion
        const { data: imageData, error: fetchError } = await supabase
          .from('collection_images')
          .select('id, collection_id, storage_path, public_url')
          .eq('id', imageId)
          .single();

        if (fetchError) throw fetchError;

        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from(bucketName)
          .remove([imageData.storage_path]);

        if (storageError) {
          logger.warn('Erreur suppression storage collection (non-bloquant)', {
            operation: 'delete_collection_storage_warning',
            errorMessage: storageError.message,
          });
        }

        // Delete from database
        const { error: dbError } = await supabase
          .from('collection_images')
          .delete()
          .eq('id', imageId);

        if (dbError) throw dbError;

        logger.info('Image collection supprimée', {
          operation: 'delete_collection_image',
          imageId,
        });
        await fetchImages();
      } catch (err) {
        logger.error('Erreur suppression image collection', err as Error, {
          operation: 'delete_collection_image_failed',
          imageId,
        });
        setError(err instanceof Error ? err.message : 'Erreur suppression');
        throw err;
      }
    },
    [bucketName, supabase, fetchImages]
  );

  // ✨ Reorder optimisé
  const reorderImages = useCallback(
    async (imageIds: string[]) => {
      try {
        setError(null);

        // Update display_order for each image
        const updates = imageIds.map((imageId, index) =>
          supabase
            .from('collection_images')
            .update({ display_order: index })
            .eq('id', imageId)
        );

        await Promise.all(updates);
        logger.info('Ordre images collection mis à jour', {
          operation: 'reorder_collection_images',
          collectionId,
          imagesCount: imageIds.length,
        });
        await fetchImages();
      } catch (err) {
        logger.error(
          'Erreur réordonnancement images collection',
          err as Error,
          {
            operation: 'reorder_collection_images_failed',
            collectionId,
          }
        );
        setError(
          err instanceof Error ? err.message : 'Erreur réordonnancement'
        );
        throw err;
      }
    },
    [supabase, fetchImages]
  );

  // ✨ Primary image - trigger automatique gère la logique "single primary"
  const setPrimaryImage = useCallback(
    async (imageId: string) => {
      try {
        setError(null);

        // 🎯 Trigger automatique gère le "unset other primary images"
        const { error } = await supabase
          .from('collection_images')
          .update({ is_primary: true })
          .eq('id', imageId);

        if (error) throw error;

        logger.info('Image principale collection définie', {
          operation: 'set_primary_collection_image',
          imageId,
        });
        await fetchImages();
      } catch (err) {
        logger.error(
          'Erreur définition image principale collection',
          err as Error,
          {
            operation: 'set_primary_collection_image_failed',
            imageId,
          }
        );
        setError(
          err instanceof Error ? err.message : 'Erreur image principale'
        );
        throw err;
      }
    },
    [supabase, fetchImages]
  );

  // ✨ Update metadata optimisé
  const updateImageMetadata = useCallback(
    async (
      imageId: string,
      metadata: {
        alt_text?: string;
        image_type?: CollectionImageType;
        width?: number;
        height?: number;
      }
    ) => {
      try {
        setError(null);

        // 🎯 Trigger updated_at automatique
        const { error } = await supabase
          .from('collection_images')
          .update(metadata)
          .eq('id', imageId);

        if (error) throw error;

        logger.info('Métadonnées image collection mises à jour', {
          operation: 'update_collection_image_metadata',
          imageId,
        });
        await fetchImages();
      } catch (err) {
        logger.error(
          'Erreur mise à jour métadonnées collection',
          err as Error,
          {
            operation: 'update_collection_image_metadata_failed',
            imageId,
          }
        );
        setError(err instanceof Error ? err.message : 'Erreur métadonnées');
        throw err;
      }
    },
    [supabase, fetchImages]
  );

  // 🎯 Helpers optimisés
  const getPrimaryImage = useCallback(() => {
    return images.find(img => img.is_primary) || images[0] || null;
  }, [images]);

  const getImagesByType = useCallback(
    (type: CollectionImageType) => {
      return images.filter(img => img.image_type === type);
    },
    [images]
  );

  // ✨ Auto-fetch optimisé
  useEffect(() => {
    if (autoFetch && collectionId && collectionId.trim() !== '') {
      logger.debug('Auto-fetch collection images déclenché', {
        operation: 'auto_fetch_collection_images',
        collectionId,
      });
      fetchImages();
    }
  }, [collectionId, autoFetch]); // fetchImages exclu pour éviter boucle infinie

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
    galleryImages: getImagesByType('gallery'),
  };
}
