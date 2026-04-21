/**
 * Fetchers pour le détail produit et produits sourcés du catalogue LinkMe
 * fetchLinkMeProductDetail + fetchSourcingProducts
 */

import type { LinkMeProductDetail } from '../../types';
import type { ChannelPricingWithProduct, SourcingProduct } from './types';
import { LINKME_CHANNEL_ID, getSupabaseClient } from './constants';

/**
 * Fetch détail d'un produit LinkMe depuis channel_pricing
 * Utilise l'ID de channel_pricing
 */
export async function fetchLinkMeProductDetail(
  catalogProductId: string
): Promise<LinkMeProductDetail | null> {
  const supabase = getSupabaseClient();

  // SI-DESC-001 : lecture sans les custom_* (0% usage prod, à DROP)
  const { data: cpData, error: cpError } = await supabase
    .from('channel_pricing')
    .select(
      `
      id,
      product_id,
      is_active,
      is_public_showcase,
      is_featured,
      show_supplier,
      min_margin_rate,
      max_margin_rate,
      suggested_margin_rate,
      channel_commission_rate,
      buffer_rate,
      custom_price_ht,
      public_price_ht,
      views_count,
      selections_count,
      display_order,
      products!inner(
        id,
        sku,
        name,
        cost_price,
        eco_tax_default,
        margin_percentage,
        stock_real,
        product_status,
        subcategory_id,
        supplier_id,
        enseigne_id,
        assigned_client_id,
        weight,
        dimensions,
        suitable_rooms,
        description,
        selling_points,
        created_by_affiliate,
        affiliate_commission_rate,
        affiliate_payout_ht,
        affiliate_approval_status
      )
    `
    )
    .eq('id', catalogProductId)
    .single();

  if (cpError) {
    if (cpError.code === 'PGRST116') {
      return null;
    }
    console.error('Erreur fetch détail produit LinkMe:', cpError);
    throw cpError;
  }

  if (!cpData) return null;

  const cp = cpData as ChannelPricingWithProduct;
  const product = cp.products;

  const { data: images } = await supabase
    .from('product_images')
    .select('public_url')
    .eq('product_id', product.id)
    .eq('is_primary', true)
    .limit(1);

  const primaryImageUrl = images?.[0]?.public_url ?? null;

  let categoryName: string | null = null;
  if (product.subcategory_id) {
    const { data: subcat } = await supabase
      .from('subcategories')
      .select('name')
      .eq('id', product.subcategory_id)
      .single();
    categoryName = subcat?.name ?? null;
  }

  let supplierName: string | null = null;
  if (product.supplier_id) {
    const { data: supplier } = await supabase
      .from('organisations')
      .select('legal_name')
      .eq('id', product.supplier_id)
      .single();
    supplierName = supplier?.legal_name ?? null;
  }

  let enseigneName: string | null = null;
  if (product.enseigne_id) {
    const { data: enseigne } = await supabase
      .from('enseignes')
      .select('name')
      .eq('id', product.enseigne_id)
      .single();
    enseigneName = enseigne?.name ?? null;
  }

  let assignedClientName: string | null = null;
  if (product.assigned_client_id) {
    const { data: assignedOrg } = await supabase
      .from('organisations')
      .select('trade_name, legal_name')
      .eq('id', product.assigned_client_id)
      .single();
    assignedClientName =
      assignedOrg?.trade_name ?? assignedOrg?.legal_name ?? null;
  }

  let affiliateName: string | null = null;
  if (product.created_by_affiliate) {
    const { data: affiliate } = await supabase
      .from('linkme_affiliates')
      .select('display_name')
      .eq('id', product.created_by_affiliate)
      .single();
    affiliateName = affiliate?.display_name ?? null;
  }

  const costPrice = product.cost_price ?? 0;
  const ecoTax = product.eco_tax_default ?? 0;
  const marginPct = product.margin_percentage ?? 25;
  const minSellingPriceHt =
    costPrice > 0 ? (costPrice + ecoTax) * (1 + marginPct / 100) : null;

  return {
    id: cp.id,
    product_id: cp.product_id,
    sku: product.sku,
    name: product.name,
    selling_price_ht: cp.custom_price_ht ?? minSellingPriceHt,
    public_price_ht: cp.public_price_ht ?? null,
    cost_price: product.cost_price ?? 0,
    min_selling_price_ht: minSellingPriceHt,
    is_enabled: cp.is_active ?? true,
    is_public_showcase: cp.is_public_showcase ?? false,
    is_featured: cp.is_featured ?? false,
    show_supplier: cp.show_supplier ?? false,
    min_margin_rate: cp.min_margin_rate ?? 0,
    max_margin_rate: cp.max_margin_rate ?? 100,
    suggested_margin_rate: cp.suggested_margin_rate,
    linkme_commission_rate: cp.channel_commission_rate,
    buffer_rate: cp.buffer_rate ?? 0.05,
    // SI-DESC-001 : toutes les descriptions viennent du master products.*
    custom_title: product.name,
    custom_description: product.description ?? null,
    custom_selling_points: Array.isArray(product.selling_points)
      ? (product.selling_points as string[])
      : null,
    source_description: product.description ?? null,
    source_selling_points: Array.isArray(product.selling_points)
      ? (product.selling_points as string[])
      : null,
    primary_image_url: primaryImageUrl,
    stock_real: product.stock_real ?? 0,
    product_is_active: product.product_status === 'active',
    product_family_name: null,
    product_category_name: categoryName,
    product_supplier_name: supplierName,
    enseigne_id: product.enseigne_id ?? null,
    enseigne_name: enseigneName,
    assigned_client_id: product.assigned_client_id ?? null,
    assigned_client_name: assignedClientName,
    is_sourced: !!(product.enseigne_id ?? product.assigned_client_id),
    created_by_affiliate: product.created_by_affiliate ?? null,
    affiliate_name: affiliateName,
    affiliate_commission_rate: product.affiliate_commission_rate ?? null,
    affiliate_payout_ht: product.affiliate_payout_ht ?? null,
    affiliate_approval_status: product.affiliate_approval_status ?? null,
    subcategory_id: product.subcategory_id,
    supplier_id: product.supplier_id,
    weight_kg: product.weight ?? null,
    dimensions_cm:
      (product.dimensions as Record<string, string | number>) ?? null,
    room_types: product.suitable_rooms ?? null,
    views_count: cp.views_count ?? 0,
    selections_count: cp.selections_count ?? 0,
    display_order: cp.display_order ?? 0,
  };
}

/**
 * Fetch les produits sur mesure (sourcés) directement depuis products
 */
export async function fetchSourcingProducts(): Promise<SourcingProduct[]> {
  const supabase = getSupabaseClient();

  const { data: affiliates } = await supabase
    .from('linkme_affiliates')
    .select('enseigne_id, organisation_id')
    .eq('status', 'active');

  const affiliatedEnseigneIds = new Set<string>();
  const affiliatedOrgIds = new Set<string>();

  (affiliates ?? []).forEach(a => {
    if (a.enseigne_id) affiliatedEnseigneIds.add(a.enseigne_id);
    if (a.organisation_id) affiliatedOrgIds.add(a.organisation_id);
  });

  if (affiliatedEnseigneIds.size === 0 && affiliatedOrgIds.size === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('products')
    .select(
      `
      id, name, sku, description, cost_price, eco_tax_default,
      margin_percentage, stock_real, created_at, enseigne_id,
      assigned_client_id, subcategory_id, supplier_id
    `
    )
    .or('enseigne_id.not.is.null,assigned_client_id.not.is.null')
    .is('archived_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur fetch produits sur mesure:', error);
    throw error;
  }

  if (!data || data.length === 0) return [];

  const filteredData = data.filter(p => {
    if (p.enseigne_id && affiliatedEnseigneIds.has(p.enseigne_id)) return true;
    if (p.assigned_client_id && affiliatedOrgIds.has(p.assigned_client_id))
      return true;
    return false;
  });

  if (filteredData.length === 0) return [];

  const productIds = filteredData.map(p => p.id);
  const enseigneIds = filteredData
    .map(p => p.enseigne_id)
    .filter((id): id is string => !!id);
  const assignedClientIds = filteredData
    .map(p => p.assigned_client_id)
    .filter((id): id is string => !!id);
  const subcategoryIds = filteredData
    .map(p => p.subcategory_id)
    .filter((id): id is string => !!id);
  const supplierIds = filteredData
    .map(p => p.supplier_id)
    .filter((id): id is string => !!id);

  const { data: images } = await supabase
    .from('product_images')
    .select('product_id, public_url')
    .in('product_id', productIds)
    .eq('is_primary', true);

  const imageMap = new Map(
    (images ?? []).map(img => [img.product_id, img.public_url])
  );

  const enseigneMap = new Map<string, string>();
  if (enseigneIds.length > 0) {
    const { data: enseignes } = await supabase
      .from('enseignes')
      .select('id, name')
      .in('id', enseigneIds);
    (enseignes ?? []).forEach(e => enseigneMap.set(e.id, e.name));
  }

  const assignedClientMap = new Map<string, string>();
  if (assignedClientIds.length > 0) {
    const { data: orgs } = await supabase
      .from('organisations')
      .select('id, trade_name, legal_name')
      .in('id', assignedClientIds);
    (orgs ?? []).forEach(o =>
      assignedClientMap.set(o.id, o.trade_name ?? o.legal_name)
    );
  }

  const categoryMap = new Map<
    string,
    { subcategory_name: string; category_name: string; family_name: string }
  >();
  if (subcategoryIds.length > 0) {
    const { data: subcategories } = await supabase
      .from('subcategories')
      .select(
        `id, name, category:categories!inner(name, family:families!inner(name))`
      )
      .in('id', subcategoryIds);

    (subcategories ?? []).forEach(sc => {
      categoryMap.set(sc.id, {
        subcategory_name: sc.name ?? '',
        category_name: sc.category?.name ?? '',
        family_name: sc.category?.family?.name ?? '',
      });
    });
  }

  const supplierMap = new Map<string, string>();
  if (supplierIds.length > 0) {
    const { data: suppliers } = await supabase
      .from('organisations')
      .select('id, trade_name, legal_name')
      .in('id', supplierIds);
    (suppliers ?? []).forEach(s =>
      supplierMap.set(s.id, s.trade_name ?? s.legal_name)
    );
  }

  const channelPricingMap = new Map<string, string>();
  if (productIds.length > 0) {
    const { data: channelPricingData } = await supabase
      .from('channel_pricing')
      .select('id, product_id')
      .eq('channel_id', LINKME_CHANNEL_ID)
      .in('product_id', productIds);
    (channelPricingData ?? []).forEach(cp =>
      channelPricingMap.set(cp.product_id, cp.id)
    );
  }

  return filteredData.map(p => {
    const categoryData = p.subcategory_id
      ? categoryMap.get(p.subcategory_id)
      : null;
    const costPrice = p.cost_price ?? 0;
    const ecoTax = p.eco_tax_default ?? 0;
    const marginPct = p.margin_percentage ?? 25;
    const sellingPrice =
      costPrice > 0 ? (costPrice + ecoTax) * (1 + marginPct / 100) : 0;

    return {
      id: p.id,
      catalog_id: channelPricingMap.get(p.id) ?? null,
      name: p.name,
      reference: p.sku ?? '',
      description: p.description ?? null,
      cost_price: costPrice,
      margin_percentage: marginPct,
      selling_price_ht: sellingPrice,
      stock_real: p.stock_real ?? 0,
      image_url: imageMap.get(p.id) ?? null,
      created_at: p.created_at,
      enseigne_id: p.enseigne_id ?? null,
      enseigne_name: p.enseigne_id
        ? (enseigneMap.get(p.enseigne_id) ?? null)
        : null,
      assigned_client_id: p.assigned_client_id ?? null,
      assigned_client_name: p.assigned_client_id
        ? (assignedClientMap.get(p.assigned_client_id) ?? null)
        : null,
      subcategory_id: p.subcategory_id ?? null,
      subcategory_name: categoryData?.subcategory_name ?? null,
      category_name: categoryData?.category_name ?? null,
      family_name: categoryData?.family_name ?? null,
      supplier_id: p.supplier_id ?? null,
      supplier_name: p.supplier_id
        ? (supplierMap.get(p.supplier_id) ?? null)
        : null,
    };
  });
}
