/**
 * Hook: useSelectionImage
 * Gestion de l'image de couverture pour les selections LinkMe
 *
 * @module use-selection-image
 * @since 2026-01-09
 */

import { useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

const BUCKET = 'product-images'; // Reusing existing bucket with selections/ path
const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Hook pour uploader l'image de couverture d'une selection
 */
export function useUploadSelectionImage() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: async ({
      selectionId,
      file,
    }: {
      selectionId: string;
      file: File;
    }): Promise<string> => {
      // Validation
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        throw new Error(`Le fichier doit faire moins de ${MAX_SIZE_MB}MB`);
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error('Format non supporté. Utilisez JPEG, PNG ou WebP');
      }

      setProgress(10);

      const supabase = createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      setProgress(20);

      // Get current image to delete later (if exists)
      const { data: currentSelection } = await supabase
        .from('linkme_selections')
        .select('image_url')
        .eq('id', selectionId)
        .single();

      setProgress(30);

      // Generate unique filename
      const fileExt = file.name.split('.').pop() || 'jpg';
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const fileName = `selections/${selectionId}/${timestamp}-${random}.${fileExt}`;

      setProgress(40);

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Erreur upload: ${uploadError.message}`);
      }

      setProgress(60);

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(fileName);

      setProgress(70);

      // Update selection with new image_url
      const { error: updateError } = await supabase
        .from('linkme_selections')
        .update({
          image_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectionId);

      if (updateError) {
        // Cleanup: remove uploaded file
        await supabase.storage.from(BUCKET).remove([fileName]);
        console.error('Update error:', updateError);
        throw new Error(`Erreur enregistrement: ${updateError.message}`);
      }

      setProgress(90);

      // Delete old image if existed
      if (currentSelection?.image_url) {
        try {
          // Extract storage path from URL
          const oldPath = extractStoragePath(currentSelection.image_url);
          if (oldPath) {
            await supabase.storage.from(BUCKET).remove([oldPath]);
          }
        } catch (e) {
          // Non-blocking - old image cleanup is best effort
          console.warn('Could not delete old image:', e);
        }
      }

      setProgress(100);
      return publicUrl;
    },
    onSuccess: () => {
      // Invalidate selections query to refetch with new image
      queryClient.invalidateQueries({ queryKey: ['user-selections'] });
      setProgress(0);
    },
    onError: () => {
      setProgress(0);
    },
  });

  return { ...mutation, progress };
}

/**
 * Hook pour supprimer l'image de couverture d'une selection
 */
export function useDeleteSelectionImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      selectionId,
      imageUrl,
    }: {
      selectionId: string;
      imageUrl: string;
    }): Promise<void> => {
      const supabase = createClient();

      // Update selection to remove image_url
      const { error: updateError } = await supabase
        .from('linkme_selections')
        .update({
          image_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectionId);

      if (updateError) {
        console.error('Update error:', updateError);
        throw new Error(`Erreur suppression: ${updateError.message}`);
      }

      // Delete from storage
      const storagePath = extractStoragePath(imageUrl);
      if (storagePath) {
        await supabase.storage.from(BUCKET).remove([storagePath]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-selections'] });
    },
  });
}

/**
 * Extract storage path from public URL
 * URL format: https://xxx.supabase.co/storage/v1/object/public/bucket-name/path/to/file.jpg
 */
function extractStoragePath(publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl);
    const pathMatch = url.pathname.match(
      /\/storage\/v1\/object\/public\/[^/]+\/(.+)/
    );
    return pathMatch?.[1] || null;
  } catch {
    return null;
  }
}
