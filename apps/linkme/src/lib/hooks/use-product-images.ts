/**
 * Hook: useProductImages
 * Gestion des images produit pour les affilies
 *
 * @module use-product-images
 * @since 2025-12-20
 */

import { useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

export interface ProductImage {
  id: string;
  product_id: string;
  storage_path: string;
  public_url: string | null;
  is_primary: boolean | null;
  display_order: number | null;
  alt_text: string | null;
  created_at: string | null;
}

const BUCKET = 'product-images';
const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Hook pour recuperer les images d'un produit
 */
export function useProductImages(productId: string | undefined) {
  return useQuery({
    queryKey: ['product-images', productId],
    queryFn: async (): Promise<ProductImage[]> => {
      if (!productId) return [];

      const supabase = createClient();
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching product images:', error);
        throw error;
      }

      return data as ProductImage[];
    },
    enabled: !!productId,
  });
}

/**
 * Hook pour uploader une image produit
 */
export function useUploadProductImage() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: async ({
      productId,
      file,
      isPrimary = false,
    }: {
      productId: string;
      file: File;
      isPrimary?: boolean;
    }): Promise<ProductImage> => {
      // Validation
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        throw new Error(`Le fichier doit faire moins de ${MAX_SIZE_MB}MB`);
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error('Format non supporte. Utilisez JPEG, PNG ou WebP');
      }

      setProgress(10);

      const supabase = createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifie');

      setProgress(20);

      // Generate unique filename
      const fileExt = file.name.split('.').pop() || 'jpg';
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const fileName = `affiliate/${productId}/${timestamp}-${random}.${fileExt}`;

      setProgress(30);

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
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

      // Get current max display_order
      const { data: existingImages } = await supabase
        .from('product_images')
        .select('display_order')
        .eq('product_id', productId)
        .order('display_order', { ascending: false })
        .limit(1);

      const maxOrder = existingImages?.[0]?.display_order ?? 0;

      setProgress(80);

      // If setting as primary, unset other primaries first
      if (isPrimary) {
        await supabase
          .from('product_images')
          .update({ is_primary: false })
          .eq('product_id', productId);
      }

      // Insert into product_images table
      const { data: imageRecord, error: insertError } = await supabase
        .from('product_images')
        .insert({
          product_id: productId,
          storage_path: fileName,
          public_url: publicUrl,
          is_primary: isPrimary,
          display_order: maxOrder + 1,
          created_by: user.id,
        })
        .select()
        .single();

      if (insertError) {
        // Cleanup: remove uploaded file
        await supabase.storage.from(BUCKET).remove([fileName]);
        console.error('Insert error:', insertError);
        throw new Error(`Erreur enregistrement: ${insertError.message}`);
      }

      setProgress(100);
      return imageRecord as ProductImage;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['product-images', variables.productId],
      });
      setProgress(0);
    },
    onError: () => {
      setProgress(0);
    },
  });

  return { ...mutation, progress };
}

/**
 * Hook pour supprimer une image produit
 */
export function useDeleteProductImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      imageId,
      productId,
      storagePath,
    }: {
      imageId: string;
      productId: string;
      storagePath: string;
    }): Promise<void> => {
      const supabase = createClient();

      // Delete from database
      const { error: deleteError } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw new Error(`Erreur suppression: ${deleteError.message}`);
      }

      // Delete from storage
      await supabase.storage.from(BUCKET).remove([storagePath]);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['product-images', variables.productId],
      });
    },
  });
}

/**
 * Hook pour definir une image comme principale
 */
export function useSetPrimaryImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      imageId,
      productId,
    }: {
      imageId: string;
      productId: string;
    }): Promise<void> => {
      const supabase = createClient();

      // Unset all primaries
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', productId);

      // Set new primary
      const { error } = await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('id', imageId);

      if (error) {
        throw new Error(`Erreur: ${error.message}`);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['product-images', variables.productId],
      });
    },
  });
}
