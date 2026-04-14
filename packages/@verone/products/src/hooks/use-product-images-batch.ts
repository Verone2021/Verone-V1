'use client';

import { useState, useCallback, useEffect } from 'react';

import logger from '@verone/utils/logger';
import { createClient } from '@verone/utils/supabase/client';
import type { Database } from '@verone/utils/supabase/types';

type ProductImage = Database['public']['Tables']['product_images']['Row'];

/**
 * Batch fetch images pour multiple produits
 * Au lieu de N requêtes (1 par produit), fait 1 seule requête avec IN()
 * Usage: Dans parent component, pas dans map/loop
 */
export function useProductImagesBatch(productIds: string[]) {
  const [imagesMap, setImagesMap] = useState<Map<string, ProductImage[]>>(
    new Map()
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
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

        const { data, error: fetchError } = await supabase
          .from('product_images')
          .select(
            'id, product_id, public_url, display_order, alt_text, is_primary, created_at, updated_at'
          )
          .in('product_id', validIds)
          .order('display_order')
          .order('created_at');

        if (fetchError) throw fetchError;

        const map = new Map<string, ProductImage[]>();
        ((data ?? []) as ProductImage[]).forEach(img => {
          const existing = map.get(img.product_id) ?? [];
          existing.push(img);
          map.set(img.product_id, existing);
        });

        logger.info('Batch images chargées', {
          operation: 'batch_fetch_product_images',
          productCount: validIds.length,
          imageCount: data?.length ?? 0,
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

    void fetchBatch();
  }, [productIdsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const getPrimaryImage = useCallback(
    (productId: string): ProductImage | null => {
      const images = imagesMap.get(productId);
      if (!images || images.length === 0) return null;
      return images.find(img => img.is_primary) ?? images[0] ?? null;
    },
    [imagesMap]
  );

  return {
    imagesMap,
    loading,
    error,
    getPrimaryImage,
    getImagesForProduct: (productId: string) => imagesMap.get(productId) ?? [],
  };
}
