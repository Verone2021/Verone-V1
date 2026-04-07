/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  CreateCollectionData,
  UpdateCollectionData,
} from './use-collections.types';

/**
 * Crée une nouvelle collection
 */
export async function insertCollection(
  supabase: SupabaseClient,
  userId: string,
  data: CreateCollectionData
) {
  return supabase
    .from('collections')
    .insert([
      {
        name: data.name,
        description: data.description ?? null,
        is_active: data.is_active ?? true,
        visibility: data.visibility ?? 'private',
        created_by: userId,
        suitable_rooms: data.suitable_rooms ?? null,
        style: data.style ?? null,
        theme_tags: data.theme_tags ?? null,
      },
    ])
    .select(
      'id, name, description, is_featured, created_by, created_at, updated_at, is_active, visibility, product_count, shared_count, archived_at'
    )
    .single();
}

/**
 * Met à jour une collection existante
 */
export async function patchCollection(
  supabase: SupabaseClient,
  data: UpdateCollectionData
) {
  const { id, ...updateData } = data;
  return supabase
    .from('collections')
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id')
    .single();
}

/**
 * Supprime une collection
 */
export async function destroyCollection(supabase: SupabaseClient, id: string) {
  return supabase.from('collections').delete().eq('id', id);
}

/**
 * Active ou désactive une collection
 */
export async function toggleCollectionIsActive(
  supabase: SupabaseClient,
  id: string,
  currentIsActive: boolean
) {
  return supabase
    .from('collections')
    .update({
      is_active: !currentIsActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
}

/**
 * Archive une collection
 */
export async function archiveCollection(supabase: SupabaseClient, id: string) {
  return supabase
    .from('collections')
    .update({
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
}

/**
 * Désarchive une collection
 */
export async function unarchiveCollection(
  supabase: SupabaseClient,
  id: string
) {
  return supabase
    .from('collections')
    .update({ archived_at: null, updated_at: new Date().toISOString() })
    .eq('id', id);
}

/**
 * Génère un token de partage via RPC puis l'enregistre sur la collection
 */
export async function generateShareTokenRpc(
  supabase: SupabaseClient,
  id: string,
  collectionName: string
): Promise<{ token: string | null; error: string | null }> {
  const { data: tokenResult, error: tokenError } = await supabase.rpc(
    'generate_share_token',
    { collection_name: collectionName }
  );

  if (tokenError) return { token: null, error: tokenError.message };

  const shareToken = tokenResult as string;

  const { error: updateError } = await supabase
    .from('collections')
    .update({
      shared_link_token: shareToken,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateError) return { token: null, error: updateError.message };

  return { token: shareToken, error: null };
}

/**
 * Ajoute un produit à une collection
 */
export async function insertCollectionProduct(
  supabase: SupabaseClient,
  collectionId: string,
  productId: string
) {
  return supabase
    .from('collection_products')
    .insert([{ collection_id: collectionId, product_id: productId }]);
}

/**
 * Ajoute plusieurs produits à une collection avec positions séquentielles
 */
export async function insertCollectionProducts(
  supabase: SupabaseClient,
  collectionId: string,
  productIds: string[]
) {
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

  return supabase.from('collection_products').insert(
    productIds.map((productId, index) => ({
      collection_id: collectionId,
      product_id: productId,
      position: startPosition + index,
    }))
  );
}

/**
 * Retire un produit d'une collection
 */
export async function removeCollectionProduct(
  supabase: SupabaseClient,
  collectionId: string,
  productId: string
) {
  return supabase
    .from('collection_products')
    .delete()
    .eq('collection_id', collectionId)
    .eq('product_id', productId);
}

/**
 * Enregistre un partage de collection
 */
export async function insertCollectionShare(
  supabase: SupabaseClient,
  collectionId: string,
  shareType: 'link' | 'email' | 'pdf',
  recipientEmail?: string
) {
  return supabase.from('collection_shares').insert([
    {
      collection_id: collectionId,
      share_type: shareType,
      recipient_email: recipientEmail ?? null,
    },
  ]);
}
