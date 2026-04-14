import type { Database } from '@verone/types/supabase';
import { createClient } from '@verone/utils/supabase/client';

import type { Product } from './catalogue-types';

type ProductInsert = Database['public']['Tables']['products']['Insert'];
type ProductUpdate = Database['public']['Tables']['products']['Update'];

const supabase = createClient();

const PRODUCT_SELECT =
  'id, sku, name, slug, cost_price, cost_price_count, product_type, stock_real, cost_net_avg, cost_net_last, cost_net_min, cost_net_max, stock_status, product_status, condition, subcategory_id, supplier_id, brand, has_images, dimensions, weight, archived_at, created_at, updated_at';

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

export async function archiveProduct(
  id: string,
  onRemove: (id: string) => void
): Promise<boolean> {
  const { error } = await supabase
    .from('products')
    .update({
      product_status: 'discontinued',
      archived_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;

  onRemove(id);
  return true;
}

export async function unarchiveProduct(
  id: string,
  onRefresh: () => Promise<void>
): Promise<boolean> {
  const { error } = await supabase
    .from('products')
    .update({ archived_at: null })
    .eq('id', id);

  if (error) throw error;

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
