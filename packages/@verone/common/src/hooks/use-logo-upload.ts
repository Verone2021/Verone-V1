'use client';

import { useState } from 'react';

import { createClient } from '@verone/utils/supabase/client';

interface UseLogoUploadOptions {
  entityId: string;
  currentLogoUrl?: string | null;
  onSuccess?: (logoUrl: string) => void;
  onError?: (error: Error) => void;
  /** @deprecated Use entityId instead */
  organisationId?: string;
}

interface UseLogoUploadReturn {
  uploadLogo: (file: File) => Promise<string | null>;
  deleteLogo: () => Promise<boolean>;
  uploading: boolean;
  deleting: boolean;
  error: Error | null;
}

/**
 * Hook personnalisé pour gérer l'upload et la suppression de logos d'organisations
 *
 * @param entityId - ID de l'organisation
 * @param currentLogoUrl - URL actuelle du logo (pour suppression)
 * @param onSuccess - Callback appelé après upload réussi
 * @param onError - Callback appelé en cas d'erreur
 *
 * @example
 * const { uploadLogo, deleteLogo, uploading } = useLogoUpload({
 *   entityId: supplier.id,
 *   currentLogoUrl: supplier.logo_url,
 *   onSuccess: (url) => console.log('Logo uploaded:', url),
 * })
 */
export function useLogoUpload({
  entityId,
  currentLogoUrl,
  onSuccess,
  onError,
  organisationId, // deprecated, backward compat
}: UseLogoUploadOptions): UseLogoUploadReturn {
  // Backward compatibility: use organisationId if entityId not provided
  const id = entityId || organisationId || '';

  // Table and storage path for organisations
  const storagePath = id;
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const supabase = createClient();

  /**
   * Upload un nouveau logo
   * 1. Valide le fichier (taille, type MIME)
   * 2. Upload vers Supabase Storage
   * 3. Supprime l'ancien logo si existant
   * 4. Update organisations.logo_url dans la DB
   * 5. Retourne l'URL publique du nouveau logo
   */
  const uploadLogo = async (file: File): Promise<string | null> => {
    setUploading(true);
    setError(null);

    try {
      // Validation client-side
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      const ALLOWED_TYPES = [
        'image/png',
        'image/jpeg',
        'image/svg+xml',
        'image/webp',
      ];

      if (file.size > MAX_FILE_SIZE) {
        throw new Error('Le fichier est trop volumineux (max 5MB)');
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error(
          'Type de fichier non autorisé. Utilisez PNG, JPEG, SVG ou WebP.'
        );
      }

      // Générer nom de fichier unique
      const timestamp = Date.now();
      const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
      const filePath = `${storagePath}/${timestamp}-logo.${extension}`;

      // Upload vers Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('organisation-logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Erreur upload: ${uploadError.message}`);
      }

      // Supprimer ancien logo si existant
      if (currentLogoUrl) {
        await supabase.storage
          .from('organisation-logos')
          .remove([currentLogoUrl])
          .catch(err => {
            console.warn('Erreur suppression ancien logo:', err);
            // Non-bloquant, on continue
          });
      }

      // Update DB avec nouveau path
      const { error: updateError } = await supabase
        .from('organisations')
        .update({ logo_url: filePath })
        .eq('id', id);

      if (updateError) {
        // Rollback: supprimer le fichier uploadé
        await supabase.storage.from('organisation-logos').remove([filePath]);

        throw new Error(`Erreur mise à jour DB: ${updateError.message}`);
      }

      // Générer URL publique
      const { data: urlData } = supabase.storage
        .from('organisation-logos')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Callback success
      if (onSuccess) {
        onSuccess(filePath);
      }

      return publicUrl;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue');
      setError(error);

      if (onError) {
        onError(error);
      }

      return null;
    } finally {
      setUploading(false);
    }
  };

  /**
   * Supprime le logo actuel
   * 1. Supprime le fichier de Storage
   * 2. Update organisations.logo_url = null dans la DB
   */
  const deleteLogo = async (): Promise<boolean> => {
    if (!currentLogoUrl) {
      setError(new Error('Aucun logo à supprimer'));
      return false;
    }

    setDeleting(true);
    setError(null);

    try {
      // Supprimer de Storage
      const { error: deleteError } = await supabase.storage
        .from('organisation-logos')
        .remove([currentLogoUrl]);

      if (deleteError) {
        throw new Error(`Erreur suppression Storage: ${deleteError.message}`);
      }

      // Update DB (logo_url = null)
      const { error: updateError } = await supabase
        .from('organisations')
        .update({ logo_url: null })
        .eq('id', id);

      if (updateError) {
        throw new Error(`Erreur mise à jour DB: ${updateError.message}`);
      }

      // Callback success
      if (onSuccess) {
        onSuccess('');
      }

      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue');
      setError(error);

      if (onError) {
        onError(error);
      }

      return false;
    } finally {
      setDeleting(false);
    }
  };

  return {
    uploadLogo,
    deleteLogo,
    uploading,
    deleting,
    error,
  };
}
