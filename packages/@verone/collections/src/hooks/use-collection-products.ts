/**
 * Hook spécialisé pour récupérer les produits d'une collection
 *
 * ✅ MIGRATED TO BASE HOOKS ARCHITECTURE (useSupabaseQuery)
 *
 * Résout le problème d'existingProductIds dans product-selector-modal
 * Utilise useSupabaseQuery pour réduire boilerplate tout en conservant
 * la logique métier de transformation spécifique.
 */

'use client';

import { useMemo } from 'react';

import { useSupabaseQuery } from '@/hooks/base/use-supabase-query';
import type { CollectionProduct } from '@verone/types';
import { formatCollectionProduct } from '@verone/types';

interface CollectionProductWithMeta {
  id: string;
  collection_id: string;
  product_id: string;
  position: number;
  added_at: string;
  products: CollectionProduct;
}

interface UseCollectionProductsReturn {
  products: CollectionProductWithMeta[];
  productIds: string[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCollectionProducts(
  collectionId: string
): UseCollectionProductsReturn {
  // ✅ BASE HOOK : Remplace 40 lignes de boilerplate (useState, useEffect, supabase client)
  const { data, loading, error, refetch } = useSupabaseQuery<any>({
    tableName: 'collection_products',
    select: `
      id,
      collection_id,
      product_id,
      position,
      products!inner (
        id,
        name,
        sku,
        status,
        creation_mode,
        cost_price,
        product_images!left (
          id,
          public_url,
          storage_path,
          is_primary,
          display_order,
          image_type,
          alt_text
        )
      )
    `,
    filters: query => {
      if (!collectionId) return query.limit(0); // Return empty if no collection
      return query
        .eq('collection_id', collectionId)
        .eq('products.creation_mode', 'complete'); // Exclure sourcing
    },
    orderBy: { column: 'position', ascending: true },
    autoFetch: !!collectionId, // Only fetch if collectionId exists
  });

  // ✅ LOGIQUE MÉTIER CONSERVÉE : Transformation spécifique au domaine
  const products = useMemo(() => {
    return (data || [])
      .filter((item: any) => item.products) // Sécurité contre données corrompues
      .map((item: any) => ({
        id: item.id,
        collection_id: item.collection_id,
        product_id: item.product_id,
        position: item.position,
        added_at: new Date().toISOString(), // Date par défaut
        products: formatCollectionProduct({
          ...item.products,
          position: item.position,
          added_at: new Date().toISOString(), // Date par défaut
        }),
      })) as CollectionProductWithMeta[];
  }, [data]);

  // ✅ EXTRACTION : IDs produits pour ProductSelectorModal (existingProductIds)
  const productIds = useMemo(() => {
    return products.map(item => item.product_id);
  }, [products]);

  return {
    products,
    productIds,
    loading,
    error,
    refetch,
  };
}
