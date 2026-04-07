/**
 * Hooks Collections - Vérone Back Office
 *
 * Hook pour la gestion des collections de produits avec partage
 * Remplace les données mock par de vraies données Supabase
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

import { createClient } from '@verone/utils/supabase/client';

import {
  archiveCollection,
  destroyCollection,
  generateShareTokenRpc,
  insertCollection,
  insertCollectionProduct,
  insertCollectionProducts,
  insertCollectionShare,
  patchCollection,
  removeCollectionProduct,
  toggleCollectionIsActive,
  unarchiveCollection,
} from './use-collections.mutations';
import {
  extractCoverImage,
  queryArchivedCollections,
  queryCollectionById,
  queryCollectionProducts,
  queryCollections,
} from './use-collections.queries';
import type {
  Collection,
  CollectionFilters,
  CreateCollectionData,
  UpdateCollectionData,
} from './use-collections.types';

export type {
  Collection,
  CollectionFilters,
  CreateCollectionData,
  UpdateCollectionData,
} from './use-collections.types';

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

          const images = collection.collection_images as
            | Array<{ public_url: string | null; is_primary: boolean }>
            | null
            | undefined;

          return {
            ...collection,
            cover_image_url: extractCoverImage(
              images,
              collection.image_url as string | null
            ),
            products:
              (
                products as Array<{
                  products: {
                    id: string;
                    name: string;
                    product_images?: Array<{ public_url: string | null }>;
                  } | null;
                }> | null
              )
                ?.map(cp => {
                  if (!cp.products) return null;
                  return {
                    id: cp.products.id,
                    name: cp.products.name,
                    image_url: cp.products.product_images?.[0]?.public_url,
                  };
                })
                .filter(Boolean) ?? [],
          };
        })
      );

      const remainingCollections = rawData.slice(5).map(collection => {
        const images = collection.collection_images as
          | Array<{ public_url: string | null; is_primary: boolean }>
          | null
          | undefined;
        return {
          ...collection,
          cover_image_url: extractCoverImage(
            images,
            collection.image_url as string | null
          ),
          products: [],
        };
      });

      setCollections([
        ...collectionsWithProducts,
        ...remainingCollections,
      ] as Collection[]);
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

  const createCollection = async (
    data: CreateCollectionData
  ): Promise<Collection | null> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Utilisateur non authentifié');
        return null;
      }

      const { data: newCollection, error: insertError } =
        await insertCollection(supabase, user.id, data);

      if (insertError) {
        setError(
          insertError.code === '23505'
            ? 'Une collection avec ce nom existe déjà. Veuillez choisir un nom différent.'
            : insertError.message
        );
        return null;
      }

      await fetchCollections();
      return newCollection as Collection;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erreur lors de la création'
      );
      return null;
    }
  };

  const updateCollection = async (
    data: UpdateCollectionData
  ): Promise<Collection | null> => {
    try {
      const { data: updated, error: updateError } = await patchCollection(
        supabase,
        data
      );

      if (updateError) {
        setError(updateError.message);
        return null;
      }

      await fetchCollections();
      return updated as Collection;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erreur lors de la mise à jour'
      );
      return null;
    }
  };

  const deleteCollection = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await destroyCollection(supabase, id);
      if (deleteError) {
        setError(deleteError.message);
        return false;
      }
      await fetchCollections();
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erreur lors de la suppression'
      );
      return false;
    }
  };

  const toggleCollectionStatus = async (id: string): Promise<boolean> => {
    try {
      const collection = collections.find(c => c.id === id);
      if (!collection) return false;

      const { error: toggleError } = await toggleCollectionIsActive(
        supabase,
        id,
        collection.is_active
      );
      if (toggleError) {
        setError(toggleError.message);
        return false;
      }
      await fetchCollections();
      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors du changement de statut'
      );
      return false;
    }
  };

  const handleArchiveCollection = async (id: string): Promise<boolean> => {
    try {
      const { error: archiveError } = await archiveCollection(supabase, id);
      if (archiveError) {
        setError(archiveError.message);
        return false;
      }
      setCollections(prev => prev.filter(c => c.id !== id));
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de l'archivage"
      );
      return false;
    }
  };

  const handleUnarchiveCollection = async (id: string): Promise<boolean> => {
    try {
      const { error: unarchiveError } = await unarchiveCollection(supabase, id);
      if (unarchiveError) {
        setError(unarchiveError.message);
        return false;
      }
      await fetchCollections();
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erreur lors de la restauration'
      );
      return false;
    }
  };

  const generateShareToken = async (id: string): Promise<string | null> => {
    try {
      const collection = collections.find(c => c.id === id);
      if (!collection) return null;

      const { token, error: rpcError } = await generateShareTokenRpc(
        supabase,
        id,
        collection.name
      );
      if (rpcError) {
        setError(rpcError);
        return null;
      }
      await fetchCollections();
      return token;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors de la génération du lien'
      );
      return null;
    }
  };

  const addProductToCollection = async (
    collectionId: string,
    productId: string
  ): Promise<boolean> => {
    try {
      const { error: insertError } = await insertCollectionProduct(
        supabase,
        collectionId,
        productId
      );
      if (insertError) {
        setError(insertError.message);
        return false;
      }
      await fetchCollections();
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de l'ajout du produit"
      );
      return false;
    }
  };

  const addProductsToCollection = async (
    collectionId: string,
    productIds: string[]
  ): Promise<boolean> => {
    try {
      const { error: insertError } = await insertCollectionProducts(
        supabase,
        collectionId,
        productIds
      );
      if (insertError) {
        setError(insertError.message);
        return false;
      }
      await fetchCollections();
      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de l'ajout des produits"
      );
      return false;
    }
  };

  const removeProductFromCollection = async (
    collectionId: string,
    productId: string
  ): Promise<boolean> => {
    try {
      const { error: removeError } = await removeCollectionProduct(
        supabase,
        collectionId,
        productId
      );
      if (removeError) {
        setError(removeError.message);
        return false;
      }
      await fetchCollections();
      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors de la suppression du produit'
      );
      return false;
    }
  };

  const recordShare = async (
    collectionId: string,
    shareType: 'link' | 'email' | 'pdf' = 'link',
    recipientEmail?: string
  ): Promise<boolean> => {
    try {
      const { error: shareError } = await insertCollectionShare(
        supabase,
        collectionId,
        shareType,
        recipientEmail
      );
      if (shareError) {
        setError(shareError.message);
        return false;
      }
      await fetchCollections();
      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de l'enregistrement du partage"
      );
      return false;
    }
  };

  return {
    collections,
    loading,
    error,
    refetch: fetchCollections,
    loadArchivedCollections,
    createCollection,
    updateCollection,
    deleteCollection,
    toggleCollectionStatus,
    archiveCollection: handleArchiveCollection,
    unarchiveCollection: handleUnarchiveCollection,
    generateShareToken,
    addProductToCollection,
    addProductsToCollection,
    removeProductFromCollection,
    recordShare,
  };
}

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
