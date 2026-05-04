/**
 * Hooks: gestion des items d'une sélection (ajout, retrait, réordre, marge)
 *
 * @module use-selection-items
 * @since 2026-04-14 (extrait de use-user-selection.ts)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Database } from '@verone/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  DEFAULT_SELECTION_ITEM_MARGIN,
  DEFAULT_PRODUCT_MARGIN_PERCENTAGE,
} from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';

import { useUserAffiliate } from './use-user-affiliate';

// ============================================================================
// TYPES
// ============================================================================

export interface SelectionItem {
  id: string;
  selection_id: string;
  product_id: string;
  base_price_ht: number;
  margin_rate: number;
  selling_price_ht: number;
  custom_description: string | null;
  is_featured: boolean;
  is_hidden_by_staff: boolean;
  display_order: number;
  product_name: string;
  product_reference: string;
  product_image_url: string | null;
  product_cloudflare_image_id: string | null;
  product_stock_real: number;
  product_stock_forecasted: number;
  category_name: string | null;
  subcategory_name: string | null;
  product_status: 'active' | 'preorder' | 'discontinued' | 'draft';
  is_affiliate_product: boolean;
  affiliate_commission_rate: number | null;
}

interface SelectionItemWithProduct {
  id: string;
  selection_id: string;
  product_id: string;
  base_price_ht: number | null;
  margin_rate: number | null;
  selling_price_ht: number | null;
  custom_description: string | null;
  is_featured: boolean | null;
  is_hidden_by_staff: boolean | null;
  display_order: number | null;
  product: {
    name: string;
    sku: string;
    stock_real: number | null;
    stock_forecasted_in: number | null;
    stock_forecasted_out: number | null;
    product_status: string | null;
    subcategory: {
      name: string;
      category: { name: string } | null;
    } | null;
    created_by_affiliate: string | null;
    affiliate_commission_rate: number | null;
  } | null;
}

interface ProductImageRow {
  product_id: string;
  public_url: string | null;
  cloudflare_image_id: string | null;
}

interface ChannelPricingWithProducts {
  custom_price_ht: number | null;
  min_margin_rate: number | null;
  max_margin_rate: number | null;
  suggested_margin_rate: number | null;
  products: {
    cost_price: number | null;
    eco_tax_default: number | null;
    margin_percentage: number | null;
  } | null;
}

// ============================================================================
// QUERY HOOKS
// ============================================================================

export function useSelectionItems(selectionId: string | null) {
  return useQuery({
    queryKey: ['selection-items', selectionId],
    queryFn: async (): Promise<SelectionItem[]> => {
      if (!selectionId) return [];

      const supabase: SupabaseClient<Database> = createClient();
      const { data, error } = await supabase
        .from('linkme_selection_items')
        .select(
          `
          id,
          selection_id,
          product_id,
          base_price_ht,
          margin_rate,
          selling_price_ht,
          custom_description,
          is_featured,
          is_hidden_by_staff,
          display_order,
          product:products(
            name,
            sku,
            stock_real,
            stock_forecasted_in,
            stock_forecasted_out,
            product_status,
            subcategory:subcategories(
              name,
              category:categories(name)
            ),
            created_by_affiliate,
            affiliate_commission_rate
          )
        `
        )
        .eq('selection_id', selectionId)
        .order('display_order', { ascending: true })
        .returns<SelectionItemWithProduct[]>();

      if (error) {
        console.error('Erreur fetch selection items:', error);
        throw error;
      }

      const productIds = (data ?? []).map(item => item.product_id);
      let imageMap = new Map<string, string | null>();
      let cloudflareImageMap = new Map<string, string | null>();

      if (productIds.length > 0) {
        const { data: images } = await supabase
          .from('product_images')
          .select('product_id, public_url, cloudflare_image_id')
          .in('product_id', productIds)
          .eq('is_primary', true)
          .returns<ProductImageRow[]>();

        imageMap = new Map(
          (images ?? []).map(img => [img.product_id, img.public_url])
        );
        cloudflareImageMap = new Map(
          (images ?? []).map(img => [img.product_id, img.cloudflare_image_id])
        );
      }

      return (data ?? []).map(item => ({
        id: item.id,
        selection_id: item.selection_id,
        product_id: item.product_id,
        base_price_ht: item.base_price_ht ?? 0,
        margin_rate: item.margin_rate ?? DEFAULT_SELECTION_ITEM_MARGIN,
        selling_price_ht: item.selling_price_ht ?? 0,
        custom_description: item.custom_description,
        is_featured: item.is_featured ?? false,
        is_hidden_by_staff: item.is_hidden_by_staff ?? false,
        display_order: item.display_order ?? 0,
        product_name: item.product?.name ?? '',
        product_reference: item.product?.sku ?? '',
        product_image_url: imageMap.get(item.product_id) ?? null,
        product_cloudflare_image_id:
          cloudflareImageMap.get(item.product_id) ?? null,
        product_stock_real: item.product?.stock_real ?? 0,
        product_stock_forecasted:
          (item.product?.stock_real ?? 0) +
          (item.product?.stock_forecasted_in ?? 0) -
          (item.product?.stock_forecasted_out ?? 0),
        category_name: item.product?.subcategory?.category?.name ?? null,
        subcategory_name: item.product?.subcategory?.name ?? null,
        product_status: (item.product?.product_status ?? 'active') as
          | 'active'
          | 'preorder'
          | 'discontinued'
          | 'draft',
        is_affiliate_product: !!item.product?.created_by_affiliate,
        affiliate_commission_rate:
          item.product?.affiliate_commission_rate ?? null,
      }));
    },
    enabled: !!selectionId,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useSelectionProductIds(selectionId: string | null) {
  return useQuery({
    queryKey: ['selection-product-ids', selectionId],
    queryFn: async (): Promise<string[]> => {
      if (!selectionId) return [];

      const supabase: SupabaseClient<Database> = createClient();
      const { data, error } = await supabase
        .from('linkme_selection_items')
        .select('product_id')
        .eq('selection_id', selectionId)
        .returns<{ product_id: string }[]>();

      if (error) {
        console.error('Erreur fetch selection product ids:', error);
        return [];
      }

      return (data ?? []).map(item => item.product_id);
    },
    enabled: !!selectionId,
    staleTime: 2 * 60 * 1000,
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

export function useAddToSelection() {
  const queryClient = useQueryClient();
  const { data: affiliate } = useUserAffiliate();

  return useMutation({
    mutationFn: async (input: {
      selectionId: string;
      productId: string;
      catalogProductId: string;
    }) => {
      if (!affiliate) throw new Error('Aucun compte affilié trouvé');

      const supabase: SupabaseClient<Database> = createClient();
      const { data: catalogProduct, error: cpError } = await supabase
        .from('channel_pricing')
        .select(
          `custom_price_ht, min_margin_rate, max_margin_rate, suggested_margin_rate, products!inner(cost_price, eco_tax_default, margin_percentage)`
        )
        .eq('id', input.catalogProductId)
        .single<ChannelPricingWithProducts>();

      if (cpError) throw new Error('Produit non trouvé dans le catalogue');

      const product = catalogProduct.products;
      const costPrice = product?.cost_price ?? 0;
      const ecoTax = product?.eco_tax_default ?? 0;
      const marginPct =
        product?.margin_percentage ?? DEFAULT_PRODUCT_MARGIN_PERCENTAGE;
      const calculatedPrice =
        costPrice > 0 ? (costPrice + ecoTax) * (1 + marginPct / 100) : 0;
      const basePriceHt = catalogProduct.custom_price_ht ?? calculatedPrice;
      const marginRate =
        catalogProduct.suggested_margin_rate ?? affiliate.default_margin_rate;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACK_OFFICE_URL ?? 'http://localhost:3000'}/api/linkme/selections/add-item`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            selection_id: input.selectionId,
            product_id: input.productId,
            base_price_ht: basePriceHt,
            margin_rate: marginRate,
          }),
        }
      );

      const result = (await response.json()) as {
        message?: string;
        item?: unknown;
      };

      if (!response.ok) {
        if (response.status === 409)
          throw new Error('Ce produit est déjà dans votre sélection');
        throw new Error(result.message ?? "Erreur lors de l'ajout du produit");
      }

      return result.item as SelectionItem;
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['selection-items', variables.selectionId],
      });
      await queryClient.invalidateQueries({ queryKey: ['user-selections'] });
    },
  });
}

export function useAddToSelectionWithMargin() {
  const queryClient = useQueryClient();
  const { data: affiliate } = useUserAffiliate();

  return useMutation({
    mutationFn: async (input: {
      selectionId: string;
      productId: string;
      catalogProductId: string;
      marginRate: number;
    }) => {
      if (!affiliate) throw new Error('Aucun compte affilié trouvé');

      const supabase: SupabaseClient<Database> = createClient();
      const { data: catalogProduct, error: cpError } = await supabase
        .from('channel_pricing')
        .select(
          `custom_price_ht, min_margin_rate, max_margin_rate, products!inner(cost_price, eco_tax_default, margin_percentage)`
        )
        .eq('id', input.catalogProductId)
        .single<ChannelPricingWithProducts>();

      if (cpError) throw new Error('Produit non trouvé dans le catalogue');

      const minMargin = catalogProduct.min_margin_rate ?? 1;
      const maxMargin = catalogProduct.max_margin_rate ?? 50;

      if (input.marginRate < minMargin || input.marginRate > maxMargin) {
        throw new Error(
          `La marge doit être entre ${minMargin}% et ${maxMargin}%`
        );
      }

      const product = catalogProduct.products;
      const costPrice = product?.cost_price ?? 0;
      const ecoTax = product?.eco_tax_default ?? 0;
      const marginPct =
        product?.margin_percentage ?? DEFAULT_PRODUCT_MARGIN_PERCENTAGE;
      const calculatedPrice =
        costPrice > 0 ? (costPrice + ecoTax) * (1 + marginPct / 100) : 0;
      const basePriceHt = catalogProduct.custom_price_ht ?? calculatedPrice;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACK_OFFICE_URL ?? 'http://localhost:3000'}/api/linkme/selections/add-item`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            selection_id: input.selectionId,
            product_id: input.productId,
            base_price_ht: basePriceHt,
            margin_rate: input.marginRate,
          }),
        }
      );

      const result = (await response.json()) as {
        message?: string;
        item?: unknown;
      };

      if (!response.ok) {
        if (response.status === 409)
          throw new Error('Ce produit est déjà dans votre sélection');
        throw new Error(result.message ?? "Erreur lors de l'ajout du produit");
      }

      return result.item as SelectionItem;
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['selection-items', variables.selectionId],
      });
      await queryClient.invalidateQueries({ queryKey: ['user-selections'] });
    },
  });
}

export function useRemoveFromSelection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { itemId: string; selectionId: string }) => {
      const supabase: SupabaseClient<Database> = createClient();
      const { error } = await supabase
        .from('linkme_selection_items')
        .delete()
        .eq('id', input.itemId);

      if (error) throw error;

      const { count } = await supabase
        .from('linkme_selection_items')
        .select('*', { count: 'exact', head: true })
        .eq('selection_id', input.selectionId);

      await supabase
        .from('linkme_selections')
        .update({
          products_count: count ?? 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.selectionId);
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['selection-items', variables.selectionId],
      });
      await queryClient.invalidateQueries({ queryKey: ['user-selections'] });
    },
  });
}

export function useUpdateItemMargin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      itemId: string;
      selectionId: string;
      marginRate: number;
    }) => {
      const supabase: SupabaseClient<Database> = createClient();
      const { error } = await supabase
        .from('linkme_selection_items')
        .update({
          margin_rate: input.marginRate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.itemId);

      if (error) throw error;
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['selection-items', variables.selectionId],
      });
    },
  });
}

export function useReorderProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      selectionId: string;
      orderedItemIds: string[];
    }) => {
      const supabase: SupabaseClient<Database> = createClient();
      const updates = input.orderedItemIds.map((itemId, index) =>
        supabase
          .from('linkme_selection_items')
          .update({
            display_order: index,
            updated_at: new Date().toISOString(),
          })
          .eq('id', itemId)
      );

      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error);
      if (errors.length > 0)
        throw new Error('Erreur lors de la réorganisation');
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['selection-items', variables.selectionId],
      });
    },
  });
}

export function useUpdateAffiliateProductPrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      itemId: string;
      selectionId: string;
      newPriceHt: number;
    }) => {
      const supabase: SupabaseClient<Database> = createClient();
      const { error } = await supabase
        .from('linkme_selection_items')
        .update({
          selling_price_ht: input.newPriceHt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.itemId);

      if (error) throw error;
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['selection-items', variables.selectionId],
      });
    },
  });
}
