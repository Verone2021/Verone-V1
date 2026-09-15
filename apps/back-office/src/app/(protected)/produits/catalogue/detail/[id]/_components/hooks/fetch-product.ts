/**
 * fetchProduct — requête Supabase pour charger la fiche produit complète.
 * Fonction pure (pas de hook) : appelable dans useCallback ou Server Action.
 *
 * Colonnes explicites : couvre tous les champs lus dans
 * detail/[id]/_components/**  (audit grep 2026-09-15).
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@verone/types';

import type { Product } from '../types';

export async function fetchProduct(
  supabase: SupabaseClient<Database>,
  productId: string
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .select(
      `
      id,
      name,
      sku,
      slug,
      cost_price,
      cost_net_avg,
      weight,
      description,
      technical_description,
      selling_points,
      subcategory_id,
      supplier_id,
      supplier_reference,
      supplier_moq,
      supplier_page_url,
      condition,
      margin_percentage,
      eco_tax_default,
      variant_attributes,
      variant_group_id,
      style,
      dimensions,
      manufacturer,
      gtin,
      product_status,
      archived_at,
      stock_real,
      stock_forecasted_out,
      stock_status,
      has_images,
      is_published_online,
      is_visible_in_linkme_catalog,
      min_stock,
      meta_title,
      meta_description,
      video_url,
      brand_ids,
      internal_notes,
      suitable_rooms,
      enseigne_id,
      assigned_client_id,
      created_by_affiliate,
      enseigne:enseignes!products_enseigne_id_fkey(
        id,
        name
      ),
      assigned_client:organisations!products_assigned_client_id_fkey(
        id,
        legal_name,
        trade_name
      ),
      supplier:organisations!supplier_id(
        id,
        legal_name,
        trade_name,
        website,
        is_active,
        type
      ),
      subcategory:subcategories(
        id,
        name,
        slug,
        category:categories(
          id,
          name,
          slug,
          family:families(
            id,
            name,
            slug
          )
        )
      ),
      variant_group:variant_groups(
        id,
        name,
        dimensions_length,
        dimensions_width,
        dimensions_height,
        dimensions_unit,
        common_weight,
        has_common_weight,
        common_cost_price,
        has_common_cost_price,
        style,
        suitable_rooms,
        has_common_supplier,
        supplier_id
      ),
      affiliate_creator:linkme_affiliates!products_created_by_affiliate_fkey(
        id,
        display_name,
        enseigne:enseignes(id, name),
        organisation:organisations!linkme_affiliates_organisation_id_fkey(id, legal_name, trade_name)
      )
    `
    )
    .eq('id', productId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Produit non trouvé');
  }

  return data as Product;
}
