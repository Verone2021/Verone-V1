/**
 * Fetchers pour les listes du catalogue LinkMe
 * fetchLinkMeCatalogProducts + fetchEligibleProducts
 */

import type { LinkMeCatalogProduct, EligibleProduct } from './types';
import { LINKME_CHANNEL_ID, getSupabaseClient } from './constants';

/**
 * Fetch produits du catalogue LinkMe depuis channel_pricing
 */
export async function fetchLinkMeCatalogProducts(): Promise<
  LinkMeCatalogProduct[]
> {
  const supabase = getSupabaseClient();

  // Récupérer les enseignes/organisations avec affiliés LinkMe actifs
  // Règle métier: seuls les produits sur mesure des entités avec utilisateurs LinkMe sont visibles
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

  // Requête channel_pricing avec JOIN products
  const { data, error } = await supabase
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
      custom_title,
      custom_description,
      custom_selling_points,
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
        created_by_affiliate,
        affiliate_commission_rate,
        affiliate_payout_ht
      )
    `
    )
    .eq('channel_id', LINKME_CHANNEL_ID);
  // Note: Ne pas filtrer par is_active ici - le filtrage est fait côté frontend
  // via statusFilter ('all' | 'enabled' | 'disabled')

  if (error) {
    console.error('Erreur fetch catalogue LinkMe:', error);
    throw error;
  }

  if (!data || data.length === 0) return []; // Keep || for null check logic

  // Récupérer les images primaires pour ces produits
  const productIds = data.map(cp => cp.product_id);
  const { data: images } = await supabase
    .from('product_images')
    .select('product_id, public_url')
    .in('product_id', productIds)
    .eq('is_primary', true);

  const imageMap = new Map(
    (images ?? []).map(img => [img.product_id, img.public_url])
  );

  // Récupérer les sous-catégories avec hiérarchie complète (catégorie + famille)
  const subcategoryIds = data
    .map(cp => cp.products?.subcategory_id)
    .filter((id): id is string => !!id);

  const { data: subcategoriesWithHierarchy } = await supabase
    .from('subcategories')
    .select(
      `
      id,
      name,
      category:categories!inner(
        id,
        name,
        family:families!inner(
          id,
          name
        )
      )
    `
    )
    .in('id', subcategoryIds);

  // Map pour accès rapide à la hiérarchie complète
  interface CategoryHierarchy {
    subcategory_id: string;
    subcategory_name: string;
    category_id: string | null;
    category_name: string;
    family_id: string | null;
    family_name: string;
    full_path: string;
  }

  const hierarchyMap = new Map<string, CategoryHierarchy>();
  (subcategoriesWithHierarchy ?? []).forEach(sc => {
    const familyName = sc.category?.family?.name ?? '';
    const categoryName = sc.category?.name ?? '';
    const subcategoryName = sc.name ?? '';

    hierarchyMap.set(sc.id, {
      subcategory_id: sc.id,
      subcategory_name: subcategoryName,
      category_id: sc.category?.id ?? null,
      category_name: categoryName,
      family_id: sc.category?.family?.id ?? null,
      family_name: familyName,
      full_path: [familyName, categoryName, subcategoryName]
        .filter((id): id is string => !!id)
        .join(' > '),
    });
  });

  // Récupérer les fournisseurs
  const supplierIds = data
    .map(cp => cp.products?.supplier_id)
    .filter((id): id is string => !!id);
  const { data: suppliers } = await supabase
    .from('organisations')
    .select('id, legal_name')
    .in('id', supplierIds);

  const supplierMap = new Map((suppliers ?? []).map(s => [s.id, s.legal_name]));

  // Récupérer les enseignes (produits sur mesure)
  const enseigneIds = data
    .map(cp => cp.products?.enseigne_id)
    .filter((id): id is string => !!id);
  const enseigneMap = new Map<string, string>();
  if (enseigneIds.length > 0) {
    const { data: enseignes } = await supabase
      .from('enseignes')
      .select('id, name')
      .in('id', enseigneIds);
    (enseignes ?? []).forEach(e => enseigneMap.set(e.id, e.name));
  }

  // Récupérer les organisations assignées (produits sur mesure)
  const assignedClientIds = data
    .map(cp => cp.products?.assigned_client_id)
    .filter((id): id is string => !!id);
  const assignedClientMap = new Map<string, string>();
  if (assignedClientIds.length > 0) {
    const { data: assignedOrgs } = await supabase
      .from('organisations')
      .select('id, trade_name, legal_name')
      .in('id', assignedClientIds);
    (assignedOrgs ?? []).forEach(o =>
      assignedClientMap.set(o.id, o.trade_name ?? o.legal_name)
    );
  }

  // Récupérer les mismatches de prix entre catalogue et sélections
  const { data: selectionItems } = await supabase
    .from('linkme_selection_items')
    .select('product_id, base_price_ht')
    .in('product_id', productIds);

  // Compter les mismatches par product_id
  // Compare custom_price_ht (prix LinkMe catalogue) vs base_price_ht (prix LinkMe sélection)
  // NOTE: public_price_ht est informatif uniquement, ne PAS utiliser pour la comparaison
  const mismatchCountMap = new Map<string, number>();
  if (selectionItems) {
    const catalogPriceMap = new Map<string, number>();
    data.forEach(cp => {
      if (cp.custom_price_ht != null) {
        catalogPriceMap.set(cp.product_id, Number(cp.custom_price_ht));
      }
    });

    selectionItems.forEach(si => {
      const catalogPrice = catalogPriceMap.get(si.product_id);
      if (catalogPrice != null && Number(si.base_price_ht) !== catalogPrice) {
        mismatchCountMap.set(
          si.product_id,
          (mismatchCountMap.get(si.product_id) ?? 0) + 1
        );
      }
    });
  }

  // Mapper les données avec hiérarchie complète
  return data
    .map(cp => {
      const subcategoryId = cp.products?.subcategory_id;
      const hierarchy = subcategoryId ? hierarchyMap.get(subcategoryId) : null;

      return {
        id: cp.id,
        product_id: cp.product_id,
        is_enabled: cp.is_active ?? true,
        is_public_showcase: cp.is_public_showcase ?? false,
        is_featured: cp.is_featured ?? false,
        show_supplier: cp.show_supplier ?? false,
        min_margin_rate: cp.min_margin_rate ?? null,
        max_margin_rate: cp.max_margin_rate ?? null,
        suggested_margin_rate: cp.suggested_margin_rate ?? null,
        custom_title: cp.custom_title,
        custom_description: cp.custom_description,
        custom_selling_points: cp.custom_selling_points,
        linkme_commission_rate: cp.channel_commission_rate,
        public_price_ht: cp.public_price_ht ?? null,
        channel_commission_rate: cp.channel_commission_rate ?? null,
        buffer_rate: cp.buffer_rate ?? null,
        views_count: cp.views_count ?? 0,
        selections_count: cp.selections_count ?? 0,
        display_order: cp.display_order ?? 0,
        product_name: cp.products?.name ?? '',
        product_reference: cp.products?.sku ?? '',
        product_price_ht: cp.products?.cost_price ?? 0,
        product_selling_price_ht: cp.custom_price_ht ?? null,
        product_image_url: imageMap.get(cp.product_id) ?? null,
        product_stock_real: cp.products?.stock_real ?? 0,
        product_is_active: cp.products?.product_status === 'active',
        product_status: cp.products?.product_status ?? 'draft',
        subcategory_id: hierarchy?.subcategory_id ?? null,
        subcategory_name: hierarchy?.subcategory_name ?? null,
        category_id: hierarchy?.category_id ?? null,
        category_name: hierarchy?.category_name ?? null,
        family_id: hierarchy?.family_id ?? null,
        family_name: hierarchy?.family_name ?? null,
        category_full_path: hierarchy?.full_path ?? null,
        product_supplier_name: cp.products?.supplier_id
          ? (supplierMap.get(cp.products.supplier_id) ?? null)
          : null,
        enseigne_id: cp.products?.enseigne_id ?? null,
        enseigne_name: cp.products?.enseigne_id
          ? (enseigneMap.get(cp.products.enseigne_id) ?? null)
          : null,
        assigned_client_id: cp.products?.assigned_client_id ?? null,
        assigned_client_name: cp.products?.assigned_client_id
          ? (assignedClientMap.get(cp.products.assigned_client_id) ?? null)
          : null,
        is_sourced: !!(
          cp.products?.enseigne_id ?? cp.products?.assigned_client_id
        ),
        created_by_affiliate: cp.products?.created_by_affiliate ?? null,
        affiliate_commission_rate:
          cp.products?.affiliate_commission_rate ?? null,
        affiliate_payout_ht: cp.products?.affiliate_payout_ht ?? null,
        selections_price_mismatch: mismatchCountMap.get(cp.product_id) ?? 0,
      };
    })
    .filter(product => {
      if (!product.is_sourced) return true;
      if (product.enseigne_id && affiliatedEnseigneIds.has(product.enseigne_id))
        return true;
      if (
        product.assigned_client_id &&
        affiliatedOrgIds.has(product.assigned_client_id)
      )
        return true;
      return false;
    });
}

/**
 * Fetch tous les produits éligibles (actifs - stock non requis)
 */
export async function fetchEligibleProducts(): Promise<EligibleProduct[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('products')
    .select(
      `
      id,
      name,
      sku,
      cost_price,
      stock_real,
      product_status,
      subcategory_id,
      subcategories:subcategory_id(name)
    `
    )
    .eq('product_status', 'active')
    .order('name');

  if (error) {
    console.error('Erreur fetch produits éligibles:', error);
    throw error;
  }

  const productIds = (data ?? []).map(p => p.id);
  const { data: images } = await supabase
    .from('product_images')
    .select('product_id, public_url')
    .in('product_id', productIds)
    .eq('is_primary', true);

  const imageMap = new Map(
    (images ?? []).map(img => [img.product_id, img.public_url])
  );

  return (data ?? []).map(p => ({
    id: p.id,
    name: p.name,
    reference: p.sku,
    price_ht: p.cost_price ?? 0,
    primary_image_url: imageMap.get(p.id) ?? null,
    stock_real: p.stock_real ?? 0,
    is_active: p.product_status === 'active',
    family_name: null,
    category_name: p.subcategories?.name ?? null,
  }));
}
