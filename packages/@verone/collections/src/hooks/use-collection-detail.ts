'use client';

import { useState, useCallback, useEffect } from 'react';

import { createClient } from '@verone/utils/supabase/client';

import {
  extractCoverImage,
  queryCollectionById,
} from './use-collections.queries';
import type { Collection } from './use-collections.types';

export function useCollection(id: string) {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchCollection = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setCollection(null);

    try {
      const { collectionResult, productsResult } = await queryCollectionById(
        supabase,
        id
      );
      const { data, error: fetchError } = collectionResult;

      if (fetchError) {
        setLoading(false);
        setError(fetchError.message);
        setCollection(null);
        return;
      }

      const rawData = data as Record<string, unknown>;
      const images = rawData.collection_images as
        | Array<{ public_url: string | null; is_primary: boolean }>
        | null
        | undefined;

      const collectionWithProducts = {
        ...rawData,
        cover_image_url: extractCoverImage(
          images,
          rawData.image_url as string | null
        ),
        products:
          (
            productsResult.data as Array<{
              position: number;
              products: {
                id: string;
                name: string;
                sku: string;
                cost_price: number;
                product_images?: Array<{ public_url: string | null }>;
              } | null;
            }> | null
          )
            ?.map(cp => {
              if (!cp.products) return null;
              return {
                id: cp.products.id,
                name: cp.products.name,
                sku: cp.products.sku,
                cost_price: cp.products.cost_price,
                position: cp.position,
                image_url: cp.products.product_images?.[0]?.public_url,
              };
            })
            .filter(Boolean) ?? [],
      };

      setCollection(collectionWithProducts as unknown as Collection);
      setLoading(false);
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur inconnue';
      setLoading(false);
      setError(errorMessage);
      setCollection(null);
    }
  }, [id, supabase]);

  useEffect(() => {
    void fetchCollection();
  }, [fetchCollection]);

  return { collection, loading, error, refetch: fetchCollection };
}
