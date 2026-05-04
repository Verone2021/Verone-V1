'use server';

import { revalidatePath } from 'next/cache';

import { createServerClient } from '@verone/utils/supabase/server';

interface DuplicateProductResult {
  success: boolean;
  newProductId?: string;
  newSku?: string;
  error?: string;
}

const DUPLICATABLE_COLUMNS = [
  'name',
  'commercial_name',
  'description',
  'description_short',
  'description_long',
  'technical_description',
  'sourcing_notes',
  'internal_notes',
  'manufacturer',
  'gtin',
  'product_type',
  'article_type',
  'condition',
  'style',
  'tags',
  'selling_points',
  'suitable_rooms',
  'subcategory_id',
  'supplier_id',
  'supplier_reference',
  'supplier_page_url',
  'supplier_moq',
  'brand_ids',
  'cost_price',
  'eco_tax_default',
  'shipping_class',
  'shipping_cost_estimate',
  'target_margin_percentage',
  'target_price',
  'min_stock',
  'reorder_point',
  'weight',
  'dimensions',
  'video_url',
  'requires_sample',
  'store_at_verone',
  'sourcing_channel',
  'sourcing_priority',
  'sourcing_status',
  'sourcing_type',
  'sourcing_tags',
  'availability_type',
] as const;

async function findUniqueSku(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  baseSku: string
): Promise<string> {
  let candidate = `${baseSku}-COPIE`;
  let suffix = 2;
  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select('id')
      .eq('sku', candidate)
      .maybeSingle();
    if (error) throw error;
    if (!data) return candidate;
    candidate = `${baseSku}-COPIE-${suffix}`;
    suffix += 1;
    if (suffix > 50) {
      throw new Error('Impossible de générer un SKU unique (>50 tentatives).');
    }
  }
}

async function findUniqueSlug(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  baseSlug: string | null
): Promise<string | null> {
  if (!baseSlug) return null;
  let candidate = `${baseSlug}-copie`;
  let suffix = 2;
  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle();
    if (error) throw error;
    if (!data) return candidate;
    candidate = `${baseSlug}-copie-${suffix}`;
    suffix += 1;
    if (suffix > 50) {
      throw new Error('Impossible de générer un slug unique (>50 tentatives).');
    }
  }
}

export async function duplicateProduct(
  productId: string
): Promise<DuplicateProductResult> {
  if (!productId) {
    return { success: false, error: 'productId manquant.' };
  }

  const supabase = await createServerClient();

  const selectColumns = ['sku', 'slug', ...DUPLICATABLE_COLUMNS].join(', ');
  const { data: source, error: sourceError } = await supabase
    .from('products')
    .select(selectColumns)
    .eq('id', productId)
    .single();

  if (sourceError || !source) {
    return {
      success: false,
      error: sourceError?.message ?? 'Produit source introuvable.',
    };
  }

  const sourceRow = source as unknown as Record<string, unknown> & {
    sku: string;
    slug: string | null;
  };

  const newSku = await findUniqueSku(supabase, sourceRow.sku);
  const newSlug = await findUniqueSlug(supabase, sourceRow.slug);

  const insertPayload: Record<string, unknown> = {
    sku: newSku,
    slug: newSlug,
    product_status: 'draft',
    is_published_online: false,
    archived_at: null,
    meta_title: null,
    meta_description: null,
    ai_generated_metadata: {},
    publication_date: null,
    unpublication_date: null,
    variant_group_id: null,
    variant_position: null,
    item_group_id: null,
    consultation_id: null,
    assigned_client_id: null,
    enseigne_id: null,
    created_by_affiliate: null,
    affiliate_approval_status: null,
    affiliate_approved_at: null,
    affiliate_approved_by: null,
    affiliate_commission_rate: null,
    affiliate_payout_ht: null,
    affiliate_rejection_reason: null,
  };

  for (const col of DUPLICATABLE_COLUMNS) {
    if (col in sourceRow && sourceRow[col] !== undefined) {
      insertPayload[col] = sourceRow[col];
    }
  }

  const { data: inserted, error: insertError } = await supabase
    .from('products')
    .insert(insertPayload as never)
    .select('id, sku')
    .single();

  if (insertError || !inserted) {
    return {
      success: false,
      error: insertError?.message ?? 'Échec de la création du doublon.',
    };
  }

  revalidatePath('/produits/catalogue');
  revalidatePath(`/produits/catalogue/${inserted.id}`);

  return {
    success: true,
    newProductId: inserted.id,
    newSku: inserted.sku,
  };
}
