'use client';

import type { SupabaseClient } from '@supabase/supabase-js';

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
import type {
  Collection,
  CreateCollectionData,
  UpdateCollectionData,
} from './use-collections.types';

interface CollectionActionsContext {
  supabase: SupabaseClient;
  collections: Collection[];
  setError: (msg: string | null) => void;
  setCollections: (updater: (prev: Collection[]) => Collection[]) => void;
  fetchCollections: () => Promise<void>;
}

export function buildCollectionActions(ctx: CollectionActionsContext) {
  const { supabase, collections, setError, setCollections, fetchCollections } =
    ctx;

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
