/**
 * Hooks Collections - Vérone Back Office
 *
 * Hook pour la gestion des collections de produits avec partage
 * Remplace les données mock par de vraies données Supabase
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

import { createClient } from '@verone/utils/supabase/client';

import { buildCollectionActions } from './use-collection-actions';
import {
  mapCollectionProducts,
  mapCollectionWithoutProducts,
  queryArchivedCollections,
  queryCollectionProducts,
  queryCollections,
} from './use-collections.queries';
import type { Collection, CollectionFilters } from './use-collections.types';

export type {
  Collection,
  CollectionFilters,
  CreateCollectionData,
  UpdateCollectionData,
} from './use-collections.types';

export { useCollection } from './use-collection-detail';

export function useCollections(filters?: CollectionFilters) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const supabase = createClient();

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    setError(null);

    const currentFilters = filtersRef.current;

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data, error: fetchError } = await queryCollections(
        supabase,
        currentFilters
      );

      if (fetchError) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        setError(fetchError.message as string);
        return;
      }

      // Charger les produits pour les premières collections seulement
      const rawData = (data ?? []) as Array<Record<string, unknown>>;
      const collectionsWithProducts = await Promise.all(
        rawData.slice(0, 5).map(async collection => {
          const { data: products } = await queryCollectionProducts(
            supabase,
            collection.id as string
          );
          return mapCollectionProducts(
            collection,
            products as Array<{
              products: {
                id: string;
                name: string;
                product_images?: Array<{ public_url: string | null }>;
              } | null;
            }> | null
          );
        })
      );

      const remainingCollections = rawData
        .slice(5)
        .map(mapCollectionWithoutProducts);

      setCollections([
        ...collectionsWithProducts,
        ...remainingCollections,
      ] as unknown as Collection[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const loadArchivedCollections = useCallback(async () => {
    try {
      return await queryArchivedCollections(supabase);
    } catch (err) {
      console.error('Erreur chargement collections archivées:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors du chargement des collections archivées'
      );
      return [];
    }
  }, [supabase]);

  useEffect(() => {
    const timeoutId = setTimeout(
      () => {
        void fetchCollections();
      },
      filters?.search ? 300 : 0
    );
    return () => clearTimeout(timeoutId);
  }, [
    filters?.search,
    filters?.status,
    filters?.visibility,
    filters?.shared,
    fetchCollections,
  ]);

  const actions = buildCollectionActions({
    supabase,
    collections,
    setError,
    setCollections,
    fetchCollections,
  });

  return {
    collections,
    loading,
    error,
    refetch: fetchCollections,
    loadArchivedCollections,
    ...actions,
  };
}
