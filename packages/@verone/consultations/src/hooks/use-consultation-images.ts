'use client';

import { useState, useEffect, useCallback } from 'react';

import { buildCloudflareImageUrl } from '@verone/utils/cloudflare/images';
import { createClient } from '@verone/utils/supabase/client';
import { smartUploadImage } from '@verone/utils/upload';

const supabase = createClient();

/**
 * Adresse d'affichage d'une photo de consultation.
 *
 * Ordre : l'URL calculée en base (déclencheur `generate_consultation_image_url`),
 * puis l'identifiant Cloudflare, et rien sinon.
 *
 * 2026-09-17 — Avant, le code écrasait systématiquement `public_url` par
 * `storage.from('product-images').getPublicUrl(...)`. Or ce seau est **privé** :
 * l'adresse produite renvoyait 400 et les photos des consultations existantes
 * apparaissaient cassées, alors que les fichiers étaient bien là.
 */
function resolveImageUrl(image: {
  public_url?: string | null;
  cloudflare_image_id?: string | null;
}): string | null {
  if (image.public_url) return image.public_url;

  if (image.cloudflare_image_id) {
    try {
      return buildCloudflareImageUrl(image.cloudflare_image_id);
    } catch {
      return null;
    }
  }

  return null;
}

export interface ConsultationImage {
  id: string;
  consultation_id: string;
  storage_path: string;
  public_url?: string | null;
  cloudflare_image_id?: string | null;
  display_order: number;
  is_primary: boolean;
  image_type: 'primary' | 'gallery' | 'technical' | 'lifestyle' | 'thumbnail';
  alt_text?: string | null;
  width?: number | null;
  height?: number | null;
  file_size?: number | null;
  format?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

interface UseConsultationImagesOptions {
  consultationId: string;
  autoFetch?: boolean;
}

interface UseConsultationImagesState {
  images: ConsultationImage[];
  primaryImage: ConsultationImage | null;
  galleryImages: ConsultationImage[];
  loading: boolean;
  uploading: boolean;
  error: string | null;
  hasImages: boolean;
}

interface UploadImageData {
  file: File;
  altText?: string;
  imageType?: 'primary' | 'gallery' | 'technical' | 'lifestyle';
  isPrimary?: boolean;
}

export function useConsultationImages({
  consultationId,
  autoFetch = false,
}: UseConsultationImagesOptions) {
  const [state, setState] = useState<UseConsultationImagesState>({
    images: [],
    primaryImage: null,
    galleryImages: [],
    loading: false,
    uploading: false,
    error: null,
    hasImages: false,
  });

  // Calculer les propriétés dérivées
  const updateDerivedState = useCallback((images: ConsultationImage[]) => {
    const primaryImage = images.find(img => img.is_primary) ?? null;
    const galleryImages = images.filter(img => !img.is_primary);
    const hasImages = images.length > 0;

    setState(prev => ({
      ...prev,
      images: images.sort((a, b) => a.display_order - b.display_order),
      primaryImage,
      galleryImages,
      hasImages,
    }));
  }, []);

  // Récupérer les images de la consultation
  const fetchImages = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data, error } = await supabase
        .from('consultation_images')
        .select(
          'id, consultation_id, storage_path, public_url, cloudflare_image_id, display_order, is_primary, image_type, alt_text, width, height, file_size, format, created_by, created_at, updated_at'
        )
        .eq('consultation_id', consultationId)
        .order('display_order', { ascending: true });

      if (error) throw error;

      const imagesWithUrls: ConsultationImage[] = (data ?? []).map(
        image =>
          ({
            ...image,
            public_url: resolveImageUrl(image),
          }) as unknown as ConsultationImage
      );

      updateDerivedState(imagesWithUrls);
    } catch (err) {
      console.error('❌ Erreur récupération images consultation:', err);
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Erreur inconnue',
      }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [consultationId, updateDerivedState]);

  // Upload d'une nouvelle image
  const uploadImage = useCallback(
    async (data: UploadImageData): Promise<ConsultationImage | null> => {
      setState(prev => ({ ...prev, uploading: true, error: null }));

      try {
        // 1. Générer le nom de fichier
        const fileExt = data.file.name.split('.').pop()?.toLowerCase();
        const fileName = `consultation-${consultationId}-${Date.now()}.${fileExt}`;

        // 2. Dépôt vers Cloudflare (route serveur depuis le navigateur)
        const uploadResult = await smartUploadImage(data.file, {
          ownerId: consultationId,
          ownerType: 'product',
        });

        // `storage_path` est NOT NULL en base et n'a plus de fichier Supabase
        // derrière : on y conserve la référence Cloudflare, exactement comme le
        // fait déjà l'import du plugin navigateur (`/api/sourcing/import`).
        // L'ancien `fileName` sert encore de repli pour les cas sans Cloudflare.
        const storagePath = uploadResult.cloudflareImageId
          ? `cloudflare/${uploadResult.cloudflareImageId}`
          : fileName;

        // 3. Déterminer l'ordre d'affichage
        const maxOrder = Math.max(
          0,
          ...state.images.map(img => img.display_order)
        );
        const displayOrder = maxOrder + 1;

        // 4. Créer l'entrée en base
        const imageData = {
          consultation_id: consultationId,
          storage_path: storagePath,
          display_order: displayOrder,
          is_primary: data.isPrimary ?? state.images.length === 0, // Première image = principale
          image_type: data.imageType ?? 'gallery',
          alt_text: data.altText ?? `Photo consultation`,
          file_size: data.file.size,
          format: fileExt ?? 'jpg',
          // Persist Cloudflare ID si upload Cloudflare réussi (backward compat: null sinon)
          ...(uploadResult.cloudflareImageId
            ? { cloudflare_image_id: uploadResult.cloudflareImageId }
            : {}),
        };

        const { data: newImage, error: dbError } = await supabase
          .from('consultation_images')
          .insert(imageData)
          .select(
            'id, consultation_id, storage_path, public_url, cloudflare_image_id, display_order, is_primary, image_type, alt_text, width, height, file_size, format, created_by, created_at, updated_at'
          )
          .single();

        if (dbError) {
          throw dbError;
        }

        // 5. Adresse d'affichage (URL calculée en base, sinon Cloudflare)
        const imageWithUrl: ConsultationImage = {
          ...newImage,
          public_url: resolveImageUrl(newImage),
        } as unknown as ConsultationImage;

        // 6. Mettre à jour le state local
        const updatedImages: ConsultationImage[] = [
          ...state.images,
          imageWithUrl,
        ];
        updateDerivedState(updatedImages);

        console.warn('[ConsultationImages] Image uploaded:', fileName);
        return imageWithUrl;
      } catch (err) {
        console.error('❌ Erreur upload image consultation:', err);
        setState(prev => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Erreur upload',
        }));
        return null;
      } finally {
        setState(prev => ({ ...prev, uploading: false }));
      }
    },
    [consultationId, state.images, updateDerivedState]
  );

  // Supprimer une image
  const deleteImage = useCallback(
    async (imageId: string): Promise<boolean> => {
      setState(prev => ({ ...prev, error: null }));

      try {
        // 1. Récupérer l'image pour obtenir le storage_path
        const imageToDelete = state.images.find(img => img.id === imageId);
        if (!imageToDelete) throw new Error('Image non trouvée');

        // 2. Supprimer de la base de données
        const { error: dbError } = await supabase
          .from('consultation_images')
          .delete()
          .eq('id', imageId);

        if (dbError) throw dbError;

        // 3. Supprimer le fichier Supabase des seules photos historiques.
        // Les photos déposées depuis le 17/09 vivent sur Cloudflare : leur
        // `storage_path` vaut `cloudflare/<id>` et ne correspond à aucun
        // fichier Supabase. Inutile d'appeler le stockage pour rien.
        const estPhotoHistorique =
          !imageToDelete.cloudflare_image_id &&
          !imageToDelete.storage_path.startsWith('cloudflare/');

        if (estPhotoHistorique) {
          const { error: storageError } = await supabase.storage
            .from('product-images')
            .remove([imageToDelete.storage_path]);

          if (storageError) {
            console.warn(
              '⚠️ Erreur suppression storage (image supprimée de la DB):',
              storageError
            );
          }
        }

        // 4. Mettre à jour le state local
        const updatedImages = state.images.filter(img => img.id !== imageId);
        updateDerivedState(updatedImages);

        console.warn('[ConsultationImages] Image deleted');
        return true;
      } catch (err) {
        console.error('❌ Erreur suppression image consultation:', err);
        setState(prev => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Erreur suppression',
        }));
        return false;
      }
    },
    [state.images, updateDerivedState]
  );

  // Définir l'image principale
  const setPrimaryImage = useCallback(
    async (imageId: string): Promise<boolean> => {
      setState(prev => ({ ...prev, error: null }));

      try {
        const { error } = await supabase
          .from('consultation_images')
          .update({ is_primary: true })
          .eq('id', imageId);

        if (error) throw error;

        // Le trigger manage_consultation_primary_image gère automatiquement
        // la désactivation des autres images principales
        await fetchImages(); // Recharger pour avoir l'état à jour

        console.warn('[ConsultationImages] Primary image set');
        return true;
      } catch (err) {
        console.error(
          '❌ Erreur définition image principale consultation:',
          err
        );
        setState(prev => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Erreur image principale',
        }));
        return false;
      }
    },
    [fetchImages]
  );

  // Réorganiser l'ordre des images
  const reorderImages = useCallback(
    async (imageId: string, newOrder: number): Promise<boolean> => {
      setState(prev => ({ ...prev, error: null }));

      try {
        const { error } = await supabase
          .from('consultation_images')
          .update({ display_order: newOrder })
          .eq('id', imageId);

        if (error) throw error;

        await fetchImages(); // Recharger pour voir les changements
        return true;
      } catch (err) {
        console.error('❌ Erreur réorganisation images consultation:', err);
        setState(prev => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Erreur réorganisation',
        }));
        return false;
      }
    },
    [fetchImages]
  );

  // Auto-fetch au montage si demandé
  useEffect(() => {
    if (autoFetch && consultationId) {
      void fetchImages();
    }
  }, [autoFetch, consultationId, fetchImages]);

  // Statistiques calculées
  const stats = {
    total: state.images.length,
    primary: state.images.filter(img => img.is_primary).length,
    gallery: state.galleryImages.length,
    totalSize: state.images.reduce((sum, img) => sum + (img.file_size ?? 0), 0),
  };

  return {
    ...state,
    // Actions
    fetchImages,
    uploadImage,
    deleteImage,
    setPrimaryImage,
    reorderImages,
    // Helpers
    stats,
  };
}
