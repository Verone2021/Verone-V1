'use client';

import { useState, useCallback, useEffect } from 'react';

import logger from '@verone/utils/logger';
import { createClient } from '@verone/utils/supabase/client';
import type { Database } from '@verone/utils/supabase/types';

type ProductImage = Database['public']['Tables']['product_images']['Row'];
type ProductImageInsert =
  Database['public']['Tables']['product_images']['Insert'];
type ProductImageUpdate =
  Database['public']['Tables']['product_images']['Update'];

// Types enum simplifiés selon la nouvelle table
export type ImageType =
  | 'primary'
  | 'gallery'
  | 'technical'
  | 'lifestyle'
  | 'thumbnail';

// Interface simplifiée - plus de transformations complexes
interface UseProductImagesOptions {
  productId: string;
  bucketName?: string;
  autoFetch?: boolean;
}

export function useProductImages({
  productId,
  bucketName = 'product-images',
  autoFetch = true,
}: UseProductImagesOptions) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // ✨ Fetch optimisé - URL publique générée automatiquement par trigger
  const fetchImages = useCallback(async () => {
    // Early return for empty/invalid productId (new products without ID)
    if (!productId || productId.trim() === '') {
      setImages([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 🚀 Requête simplifiée - plus de product_type, URL automatique
      const { data, error } = await supabase
        .from('product_images')
        .select(
          'id, product_id, public_url, display_order, alt_text, is_primary, created_at, updated_at'
        )
        .eq('product_id', productId)
        .order('display_order')
        .order('created_at');

      if (error) throw error;

      // ✅ Plus besoin de générer les URLs - automatique via trigger
      logger.info('Images chargées pour produit', {
        operation: 'fetch_product_images',
        productId,
        imagesCount: data?.length || 0,
      });
      setImages((data || []) as any);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur chargement images';
      logger.error('Erreur chargement images', err as Error, {
        operation: 'fetch_product_images_failed',
        productId,
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [productId, supabase]);

  // ✨ Upload optimisé avec triggers automatiques et enum typé
  const uploadImage = useCallback(
    async (
      file: File,
      options: {
        isPrimary?: boolean;
        imageType?: ImageType;
        altText?: string;
      } = {}
    ) => {
      // Prevent upload for products without valid ID
      if (!productId || productId.trim() === '') {
        throw new Error('ID produit requis pour upload');
      }

      try {
        setUploading(true);
        setError(null);

        // 📁 Generate unique filename with proper structure
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        const fileName = `products/${productId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

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
          .from('product_images')
          .select('display_order')
          .eq('product_id', productId)
          .order('display_order', { ascending: false })
          .limit(1);

        const nextOrder =
          existingImages && existingImages.length > 0
            ? (existingImages[0].display_order || 0) + 1
            : 0;

        // 🎯 Create database record - triggers gèrent primary + URL automatiquement
        const imageData: ProductImageInsert = {
          product_id: productId,
          storage_path: uploadData.path,
          display_order: nextOrder,
          is_primary: options.isPrimary || false,
          image_type: options.imageType || 'gallery',
          alt_text: options.altText || file.name,
          file_size: file.size,
          format: fileExt || 'jpg',
          width: undefined, // Sera ajouté plus tard si nécessaire
          height: undefined,
          created_by: undefined, // Supabase auth automatique
        };

        const { data: dbData, error: dbError } = await supabase
          .from('product_images')
          .insert([imageData])
          .select()
          .single();

        if (dbError) {
          // Cleanup uploaded file if database insert fails
          await supabase.storage.from(bucketName).remove([uploadData.path]);
          throw dbError;
        }

        logger.info('Image uploadée avec succès', {
          operation: 'upload_product_image',
          productId,
          fileName: file.name,
          fileSize: file.size,
        });

        // Refresh images list
        await fetchImages();

        return dbData;
      } catch (err) {
        logger.error('Erreur upload image', err as Error, {
          operation: 'upload_product_image_failed',
          productId,
        });
        setError(err instanceof Error ? err.message : 'Erreur upload');
        throw err;
      } finally {
        setUploading(false);
      }
    },
    [productId, bucketName, supabase]
  );

  // ✨ Upload multiple optimisé
  const uploadMultipleImages = useCallback(
    async (
      files: File[],
      options: {
        imageType?: ImageType;
        altTextPrefix?: string;
        firstImagePrimary?: boolean;
      } = {}
    ) => {
      const results: ProductImage[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const result = await uploadImage(file, {
            imageType: options.imageType || 'gallery',
            altText: options.altTextPrefix
              ? `${options.altTextPrefix} ${i + 1}`
              : file.name,
            isPrimary: options.firstImagePrimary && i === 0, // Première image primary si demandé
          });
          results.push(result);
        } catch (err) {
          logger.error('Erreur upload image multiple', err as Error, {
            operation: 'upload_multiple_images_failed',
            productId,
            fileName: file.name,
          });
          // Continue with other files
        }
      }

      return results;
    },
    [uploadImage]
  );

  // ✨ Delete simplifiée - triggers gèrent le CASCADE DELETE automatiquement
  const deleteImage = useCallback(
    async (imageId: string) => {
      try {
        setError(null);

        // Get image info before deletion
        const { data: imageData, error: fetchError } = await supabase
          .from('product_images')
          .select('id, product_id, storage_path, public_url')
          .eq('id', imageId)
          .single();

        if (fetchError) throw fetchError;

        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from(bucketName)
          .remove([imageData.storage_path]);

        if (storageError) {
          logger.warn('Erreur suppression storage (non-bloquant)', {
            operation: 'delete_storage_file_warning',
            errorMessage: storageError.message,
          });
        }

        // Delete from database - CASCADE DELETE automatique
        const { error: dbError } = await supabase
          .from('product_images')
          .delete()
          .eq('id', imageId);

        if (dbError) throw dbError;

        logger.info('Image supprimée avec succès', {
          operation: 'delete_product_image',
          imageId,
        });
        await fetchImages();
      } catch (err) {
        logger.error('Erreur suppression image', err as Error, {
          operation: 'delete_product_image_failed',
          imageId,
        });
        setError(err instanceof Error ? err.message : 'Erreur suppression');
        throw err;
      }
    },
    [bucketName, supabase]
  );

  // ✨ Reorder optimisé
  const reorderImages = useCallback(
    async (imageIds: string[]) => {
      try {
        setError(null);

        // Update display_order for each image
        const updates = imageIds.map((imageId, index) =>
          supabase
            .from('product_images')
            .update({ display_order: index })
            .eq('id', imageId)
        );

        await Promise.all(updates);
        logger.info('Ordre images mis à jour', {
          operation: 'reorder_product_images',
          productId,
          imagesCount: imageIds.length,
        });
        await fetchImages();
      } catch (err) {
        logger.error('Erreur réordonnancement images', err as Error, {
          operation: 'reorder_product_images_failed',
          productId,
        });
        setError(
          err instanceof Error ? err.message : 'Erreur réordonnancement'
        );
        throw err;
      }
    },
    [supabase]
  );

  // ✨ Primary image - trigger automatique gère la logique "single primary"
  const setPrimaryImage = useCallback(
    async (imageId: string) => {
      try {
        setError(null);

        // 🎯 Trigger automatique gère le "unset other primary images"
        const { error } = await supabase
          .from('product_images')
          .update({ is_primary: true })
          .eq('id', imageId);

        if (error) throw error;

        logger.info('Image principale définie', {
          operation: 'set_primary_image',
          imageId,
        });
        await fetchImages();
      } catch (err) {
        logger.error('Erreur définition image principale', err as Error, {
          operation: 'set_primary_image_failed',
          imageId,
        });
        setError(
          err instanceof Error ? err.message : 'Erreur image principale'
        );
        throw err;
      }
    },
    [supabase]
  );

  // ✨ Update metadata optimisé avec enum typé
  const updateImageMetadata = useCallback(
    async (
      imageId: string,
      metadata: {
        alt_text?: string;
        image_type?: ImageType;
        width?: number;
        height?: number;
      }
    ) => {
      try {
        setError(null);

        // 🎯 Trigger updated_at automatique - pas besoin de le spécifier
        const { error } = await supabase
          .from('product_images')
          .update(metadata)
          .eq('id', imageId);

        if (error) throw error;

        logger.info('Métadonnées image mises à jour', {
          operation: 'update_image_metadata',
          imageId,
        });
        await fetchImages();
      } catch (err) {
        logger.error('Erreur mise à jour métadonnées', err as Error, {
          operation: 'update_image_metadata_failed',
          imageId,
        });
        setError(err instanceof Error ? err.message : 'Erreur métadonnées');
        throw err;
      }
    },
    [supabase]
  );

  // 🎯 Helpers optimisés
  const getPrimaryImage = useCallback(() => {
    return images.find(img => img.is_primary) || images[0] || null;
  }, [images]);

  const getImagesByType = useCallback(
    (type: ImageType) => {
      return images.filter(img => img.image_type === type);
    },
    [images]
  );

  // ✨ Auto-fetch optimisé - FIX: Supprimer fetchImages des dépendances pour éviter la boucle infinie
  useEffect(() => {
    if (autoFetch && productId && productId.trim() !== '') {
      logger.debug('Auto-fetch images déclenché', {
        operation: 'auto_fetch_images',
        productId,
      });
      fetchImages();
    }
  }, [productId, autoFetch]); // Supprimé fetchImages des dépendances

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
    galleryImages: getImagesByType('gallery'),
    technicalImages: getImagesByType('technical'),
  };
}

/**
 * 🚀 PERF FIX 2026-01-10: Batch fetch images pour multiple produits
 *
 * Au lieu de N requêtes (1 par produit), fait 1 seule requête avec IN()
 * Usage: Dans parent component, pas dans map/loop
 *
 * @example
 * const productIds = products.map(p => p.id);
 * const { imagesMap, loading } = useProductImagesBatch(productIds);
 * // imagesMap.get(productId) => ProductImage[] | undefined
 */
export function useProductImagesBatch(productIds: string[]) {
  const [imagesMap, setImagesMap] = useState<Map<string, ProductImage[]>>(
    new Map()
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Stable reference for productIds
  const productIdsKey = productIds.filter(Boolean).sort().join(',');

  useEffect(() => {
    const fetchBatch = async () => {
      const validIds = productIds.filter(id => id && id.trim() !== '');
      if (validIds.length === 0) {
        setImagesMap(new Map());
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // 🚀 UNE SEULE requête pour tous les produits
        const { data, error: fetchError } = await supabase
          .from('product_images')
          .select(
            'id, product_id, public_url, display_order, alt_text, is_primary, created_at, updated_at'
          )
          .in('product_id', validIds)
          .order('display_order')
          .order('created_at');

        if (fetchError) throw fetchError;

        // Grouper par product_id (cast as ProductImage pour compatibilité)
        const map = new Map<string, ProductImage[]>();
        ((data || []) as ProductImage[]).forEach(img => {
          const existing = map.get(img.product_id) || [];
          existing.push(img);
          map.set(img.product_id, existing);
        });

        logger.info('Batch images chargées', {
          operation: 'batch_fetch_product_images',
          productCount: validIds.length,
          imageCount: data?.length || 0,
        });

        setImagesMap(map);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur batch images';
        logger.error('Erreur batch images', err as Error, {
          operation: 'batch_fetch_product_images_failed',
        });
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchBatch();
  }, [productIdsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Helper pour obtenir image primaire d'un produit
  const getPrimaryImage = useCallback(
    (productId: string): ProductImage | null => {
      const images = imagesMap.get(productId);
      if (!images || images.length === 0) return null;
      return images.find(img => img.is_primary) || images[0] || null;
    },
    [imagesMap]
  );

  return {
    imagesMap,
    loading,
    error,
    getPrimaryImage,
    getImagesForProduct: (productId: string) => imagesMap.get(productId) || [],
  };
}
