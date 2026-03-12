/**
 * 📁 Hook Collections - Vérone Back Office
 *
 * Hook pour la gestion des collections de produits avec partage
 * Remplace les données mock par de vraies données Supabase
 */

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

import { createClient } from '@verone/utils/supabase/client';

export interface Collection {
  id: string;
  name: string;
  description?: string;
  is_featured?: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  visibility: 'public' | 'private';
  shared_link_token?: string;
  product_count: number;
  shared_count: number;
  last_shared?: string;
  style?: string;
  suitable_rooms?: string[]; // Aligné avec products.suitable_rooms (40 pièces)
  theme_tags?: string[];
  display_order?: number;
  meta_title?: string;
  meta_description?: string;
  image_url?: string; // Deprecated - utilise cover_image_url
  cover_image_url?: string; // Nouvelle image de couverture (collection_images table)
  color_theme?: string;
  archived_at?: string;
  products?: Array<{
    id: string;
    name: string;
    image_url?: string;
  }>;
}

export interface CollectionFilters {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  visibility?: 'all' | 'public' | 'private';
  shared?: 'all' | 'shared' | 'not_shared';
}

export interface CreateCollectionData {
  name: string;
  description?: string;
  is_active?: boolean;
  visibility?: 'public' | 'private';
  style?: string;
  suitable_rooms?: string[]; // Aligné avec products
  theme_tags?: string[];
}

export interface UpdateCollectionData extends Partial<CreateCollectionData> {
  id: string;
}

export function useCollections(filters?: CollectionFilters) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Utiliser useRef pour stocker les filtres sans causer de re-renders
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const supabase = createClient();

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Récupérer les filtres actuels depuis la ref
    const currentFilters = filtersRef.current;

    try {
      let query = supabase
        .from('collections')
        .select(
          `
          id,
          name,
          description,
          is_featured,
          created_by,
          created_at,
          updated_at,
          is_active,
          visibility,
          shared_link_token,
          product_count,
          shared_count,
          last_shared,
          style,
          suitable_rooms,
          theme_tags,
          display_order,
          meta_title,
          meta_description,
          image_url,
          color_theme,
          archived_at,
          collection_images (
            public_url,
            is_primary
          )
        `
        )
        .order('updated_at', { ascending: false })
        .is('archived_at', null);

      // Apply filters
      if (currentFilters?.status && currentFilters.status !== 'all') {
        const isActive = currentFilters.status === 'active';
        query = query.eq('is_active', isActive);
      }

      if (currentFilters?.visibility && currentFilters.visibility !== 'all') {
        query = query.eq('visibility', currentFilters.visibility);
      }

      if (currentFilters?.shared && currentFilters.shared !== 'all') {
        if (currentFilters.shared === 'shared') {
          query = query.gt('shared_count', 0);
        } else if (currentFilters.shared === 'not_shared') {
          query = query.eq('shared_count', 0);
        }
      }

      if (currentFilters?.search) {
        query = query.or(
          `name.ilike.%${currentFilters.search}%,description.ilike.%${currentFilters.search}%`
        );
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      // Charger les produits pour les premières collections seulement
      const collectionsWithProducts = await Promise.all(
        (data || []).slice(0, 5).map(async collection => {
          const { data: products } = await supabase
            .from('collection_products')
            .select(
              `
              products:product_id (
                id,
                name,
                product_images!inner (
                  public_url
                )
              )
            `
            )
            .eq('collection_id', collection.id)
            .eq('products.product_images.is_primary', true)
            .limit(4);

          // Extraire l'image primaire de la collection
          const primaryImage = collection.collection_images?.find(
            (img: any) => img.is_primary
          );

          return {
            ...collection,
            cover_image_url: primaryImage?.public_url || collection.image_url, // Fallback sur ancien champ
            products:
              products
                ?.map(cp => {
                  // Vérifier que le produit existe avant d'accéder à ses propriétés
                  if (!cp.products) return null;
                  return {
                    id: cp.products.id,
                    name: cp.products.name,
                    image_url: cp.products.product_images?.[0]?.public_url,
                  };
                })
                .filter(Boolean) || [],
          };
        })
      );

      // Ajouter les collections restantes sans produits pour optimiser
      const remainingCollections = (data || []).slice(5).map(collection => {
        const primaryImage = collection.collection_images?.find(
          (img: any) => img.is_primary
        );
        return {
          ...collection,
          cover_image_url: primaryImage?.public_url || collection.image_url,
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
      const { data, error } = await supabase
        .from('collections')
        .select(
          'id, name, description, is_featured, created_by, created_at, updated_at, is_active, visibility, shared_link_token, product_count, shared_count, last_shared, style, suitable_rooms, theme_tags, display_order, meta_title, meta_description, image_url, color_theme, archived_at'
        )
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false });

      if (error) throw error;

      return (data || []) as Collection[];
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

  // useEffect qui réagit aux changements de filtres avec debounce sur la recherche
  useEffect(() => {
    const timeoutId = setTimeout(
      () => {
        fetchCollections();
      },
      filters?.search ? 300 : 0
    ); // Debounce de 300ms sur la recherche

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
      // Récupérer l'utilisateur actuel (Owner ou Admin selon la documentation des rôles)
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Utilisateur non authentifié');
        return null;
      }

      const { data: newCollection, error } = await supabase
        .from('collections')
        .insert([
          {
            name: data.name,
            description: data.description || null,
            is_active: data.is_active ?? true,
            visibility: data.visibility || 'private',
            created_by: user.id, // Ajouter l'ID de l'utilisateur (Owner/Admin)
            suitable_rooms: data.suitable_rooms || null,
            style: data.style || null,
            theme_tags: data.theme_tags || null,
          },
        ])
        .select(
          'id, name, description, is_featured, created_by, created_at, updated_at, is_active, visibility, product_count, shared_count, archived_at'
        )
        .single();

      if (error) {
        // Gestion spécifique des erreurs de contrainte unique
        if (error.code === '23505') {
          setError(
            'Une collection avec ce nom existe déjà. Veuillez choisir un nom différent.'
          );
        } else {
          setError(error.message);
        }
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
      const updateData: any = { ...data };
      delete updateData.id;

      const { data: updatedCollection, error } = await supabase
        .from('collections')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.id)
        .select('id')
        .single();

      if (error) {
        setError(error.message);
        return null;
      }

      await fetchCollections();
      return updatedCollection as Collection;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erreur lors de la mise à jour'
      );
      return null;
    }
  };

  const deleteCollection = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', id);

      if (error) {
        setError(error.message);
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

      const { error } = await supabase
        .from('collections')
        .update({
          is_active: !collection.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        setError(error.message);
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

  const archiveCollection = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('collections')
        .update({
          archived_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        setError(error.message);
        return false;
      }

      // Retirer la collection de la liste active immédiatement
      setCollections(prev => prev.filter(c => c.id !== id));
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de l'archivage"
      );
      return false;
    }
  };

  const unarchiveCollection = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('collections')
        .update({
          archived_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        setError(error.message);
        return false;
      }

      // Recharger les données pour synchroniser les listes
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

      // Generate share token using the database function
      const { data: tokenResult, error: tokenError } = await supabase.rpc(
        'generate_share_token',
        { collection_name: collection.name }
      );

      if (tokenError) {
        setError(tokenError.message);
        return null;
      }

      const shareToken = tokenResult;

      // Update collection with the share token
      const { error: updateError } = await supabase
        .from('collections')
        .update({
          shared_link_token: shareToken,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) {
        setError(updateError.message);
        return null;
      }

      await fetchCollections();
      return shareToken;
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
      const { error } = await supabase.from('collection_products').insert([
        {
          collection_id: collectionId,
          product_id: productId,
        },
      ]);

      if (error) {
        setError(error.message);
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
      // Obtenir la position maximale actuelle
      const { data: existingProducts } = await supabase
        .from('collection_products')
        .select('position')
        .eq('collection_id', collectionId)
        .order('position', { ascending: false })
        .limit(1);

      const startPosition =
        existingProducts && existingProducts.length > 0
          ? (existingProducts[0].position ?? 0) + 1
          : 0;

      // Insérer tous les produits avec positions séquentielles
      const { error } = await supabase.from('collection_products').insert(
        productIds.map((productId, index) => ({
          collection_id: collectionId,
          product_id: productId,
          position: startPosition + index,
        }))
      );

      if (error) {
        setError(error.message);
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
      const { error } = await supabase
        .from('collection_products')
        .delete()
        .eq('collection_id', collectionId)
        .eq('product_id', productId);

      if (error) {
        setError(error.message);
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
      const { error } = await supabase.from('collection_shares').insert([
        {
          collection_id: collectionId,
          share_type: shareType,
          recipient_email: recipientEmail || null,
        },
      ]);

      if (error) {
        setError(error.message);
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
    archiveCollection,
    unarchiveCollection,
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

  const fetchCollection = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    // 🔄 État de chargement unifié - un seul setState
    setLoading(true);
    setError(null);
    setCollection(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('collections')
        .select(
          `
          id,
          name,
          description,
          is_featured,
          created_by,
          created_at,
          updated_at,
          is_active,
          visibility,
          shared_link_token,
          product_count,
          shared_count,
          last_shared,
          style,
          suitable_rooms,
          theme_tags,
          display_order,
          meta_title,
          meta_description,
          image_url,
          color_theme,
          archived_at,
          collection_images (
            public_url,
            is_primary
          )
        `
        )
        .eq('id', id)
        .single();

      if (fetchError) {
        // 🚨 État d'erreur unifié - un seul setState
        setLoading(false);
        setError(fetchError.message);
        setCollection(null);
        return;
      }

      // Get all products in this collection avec SKU et prix
      const { data: products } = await supabase
        .from('collection_products')
        .select(
          `
          position,
          products:product_id (
            id,
            name,
            sku,
            cost_price,
            product_images!inner (
              public_url
            )
          )
        `
        )
        .eq('collection_id', id)
        .eq('products.product_images.is_primary', true)
        .order('position', { ascending: true });

      // Extraire l'image primaire de la collection
      const primaryImage = data.collection_images?.find(
        (img: any) => img.is_primary
      );

      // ✅ État de succès unifié - un seul setState groupé
      const collectionWithProducts = {
        ...data,
        cover_image_url: primaryImage?.public_url || data.image_url, // Fallback sur ancien champ
        products:
          products
            ?.map(cp => {
              // Vérifier que le produit existe avant d'accéder à ses propriétés
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
            .filter(Boolean) || [],
      };

      // 🎯 Batch setState pour éviter multiples re-renders
      setCollection(collectionWithProducts as any);
      setLoading(false);
      setError(null);
    } catch (err) {
      // 🚨 État d'erreur catch unifié - un seul setState
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur inconnue';
      setLoading(false);
      setError(errorMessage);
      setCollection(null);
    }
  };

  useEffect(() => {
    fetchCollection();
  }, [id, supabase]);

  return { collection, loading, error, refetch: fetchCollection };
}
