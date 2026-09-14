import type { Database } from '@verone/types/supabase';
import { createClient } from '@verone/utils/supabase/client';

import type { Product } from './catalogue-types';

type ProductInsert = Database['public']['Tables']['products']['Insert'];
type ProductUpdate = Database['public']['Tables']['products']['Update'];

const supabase = createClient();

const PRODUCT_SELECT =
  'id, sku, name, slug, cost_price, cost_price_count, product_type, stock_real, cost_net_avg, cost_net_last, cost_net_min, cost_net_max, stock_status, product_status, condition, subcategory_id, supplier_id, manufacturer, has_images, dimensions, weight, archived_at, created_at, updated_at';

export async function createProduct(
  productData: Partial<Product>,
  onRefresh: () => void
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert([productData as ProductInsert])
    .select(PRODUCT_SELECT)
    .single();

  if (error) throw error;

  void Promise.resolve().then(onRefresh);
  return data as Product;
}

export async function updateProduct(
  id: string,
  updates: Partial<Product>,
  onOptimisticUpdate: (id: string, updates: Partial<Product>) => void
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update(updates as ProductUpdate)
    .eq('id', id)
    .select(PRODUCT_SELECT)
    .single();

  if (error) throw error;

  onOptimisticUpdate(id, updates);
  return data as Product;
}

// Retirer / Restaurer passent par la fonction unique du cycle de vie
// (BO-PRODUCTS-P8-001) : motif obligatoire, journal écrit, product_status
// inchangé — la restauration remet exactement le produit.
export async function archiveProduct(
  id: string,
  reason: string,
  onRemove: (id: string) => void
): Promise<boolean> {
  const { error } = await supabase.rpc('apply_product_lifecycle_action', {
    p_product_id: id,
    p_action: 'withdraw',
    p_reason: reason,
  });

  if (error) throw new Error(error.message);

  onRemove(id);
  return true;
}

export async function unarchiveProduct(
  id: string,
  onRefresh: () => Promise<void>
): Promise<boolean> {
  const { error } = await supabase.rpc('apply_product_lifecycle_action', {
    p_product_id: id,
    p_action: 'restore',
  });

  if (error) throw new Error(error.message);

  await onRefresh();
  return true;
}

export async function deleteProduct(
  id: string,
  onRemove: (id: string) => void
): Promise<boolean> {
  const { error } = await supabase.from('products').delete().eq('id', id);

  if (error) {
    console.error('Erreur Supabase DELETE:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    throw error;
  }

  onRemove(id);
  return true;
}
