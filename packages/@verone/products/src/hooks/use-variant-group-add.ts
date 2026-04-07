'use client';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { AddProductsToGroupData } from '@verone/types';
import logger from '@verone/utils/logger';

import { generateProductSKU } from '@verone/products/utils';

import type { ToastFn } from './types/variant-group.types';

interface GroupForAdd {
  name: string;
  base_sku: string;
  product_count: number | null;
  dimensions_length: number | null;
  dimensions_width: number | null;
  dimensions_height: number | null;
  dimensions_unit: string | null;
  suitable_rooms: string[] | null;
  subcategory_id: string | null;
  variant_type: string | null;
}

interface ProductVariantAttrs {
  variant_attributes: Record<string, unknown> | null;
}

export interface VariantGroupAddDeps {
  supabase: SupabaseClient;
  toast: ToastFn;
  fetchVariantGroups: () => Promise<void>;
}

// Ajouter des produits existants à un groupe
export async function addProductsToGroup(
  deps: VariantGroupAddDeps,
  data: AddProductsToGroupData
): Promise<boolean> {
  const { supabase, toast, fetchVariantGroups } = deps;

  try {
    // Vérifier que les produits ne sont pas déjà dans un groupe
    const { data: existingProducts, error: checkError } = await supabase
      .from('products')
      .select('id, name, variant_group_id')
      .in('id', data.product_ids)
      .not('variant_group_id', 'is', null);

    if (checkError) {
      toast({
        title: 'Erreur',
        description: checkError.message,
        variant: 'destructive',
      });
      return false;
    }

    if (existingProducts && existingProducts.length > 0) {
      toast({
        title: 'Attention',
        description: `${existingProducts.length} produit(s) déjà dans un groupe`,
        variant: 'destructive',
      });
      return false;
    }

    const { data: rawGroupData, error: groupError } = await supabase
      .from('variant_groups')
      .select(
        'name, base_sku, product_count, dimensions_length, dimensions_width, dimensions_height, dimensions_unit, style, suitable_rooms, subcategory_id, variant_type'
      )
      .eq('id', data.variant_group_id)
      .single();

    if (groupError) {
      toast({
        title: 'Erreur',
        description: groupError.message,
        variant: 'destructive',
      });
      return false;
    }

    const groupData = rawGroupData as unknown as GroupForAdd;
    const currentCount = groupData?.product_count ?? 0;
    const hasDimensions =
      groupData?.dimensions_length ??
      groupData?.dimensions_width ??
      groupData?.dimensions_height;
    const dimensions = hasDimensions
      ? {
          length: groupData?.dimensions_length ?? null,
          width: groupData?.dimensions_width ?? null,
          height: groupData?.dimensions_height ?? null,
          unit: groupData?.dimensions_unit ?? 'cm',
        }
      : null;

    const updates = data.product_ids.map((productId, index) => ({
      id: productId,
      variant_group_id: data.variant_group_id,
      variant_position: currentCount + index + 1,
    }));

    for (const update of updates) {
      const { data: rawProductData } = await supabase
        .from('products')
        .select('variant_attributes')
        .eq('id', update.id)
        .single();

      const productData =
        rawProductData as unknown as ProductVariantAttrs | null;
      let productName = groupData?.name ?? 'Produit';
      let productSKU = '';

      if (productData?.variant_attributes) {
        const attrs = productData.variant_attributes;
        const variantType = groupData?.variant_type ?? 'color';
        const variantValue = attrs[variantType] as string | undefined;
        if (variantValue) {
          productName = `${groupData?.name} - ${variantValue}`;
          productSKU = generateProductSKU(
            groupData?.base_sku ?? '',
            variantValue
          );
        }
      }

      const { error: updateError } = await supabase
        .from('products')
        .update({
          variant_group_id: update.variant_group_id,
          variant_position: update.variant_position,
          name: productName,
          ...(productSKU && { sku: productSKU }),
          subcategory_id: groupData?.subcategory_id,
          ...(dimensions && { dimensions }),
        })
        .eq('id', update.id);

      if (updateError) {
        logger.error('Erreur update produit', updateError, {
          operation: 'update_product_in_group_failed',
        });
        toast({
          title: 'Erreur',
          description: `Impossible d'ajouter le produit`,
          variant: 'destructive',
        });
        return false;
      }
    }

    const { error: countError } = await supabase
      .from('variant_groups')
      .update({
        product_count: currentCount + data.product_ids.length,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.variant_group_id);

    if (countError) {
      logger.error('Erreur update count', countError, {
        operation: 'update_variant_count_failed',
      });
    }

    toast({
      title: 'Succès',
      description: `${data.product_ids.length} produit(s) ajouté(s) au groupe`,
    });
    await fetchVariantGroups();
    return true;
  } catch (err) {
    logger.error('Erreur ajout produits', err as Error, {
      operation: 'add_products_to_group_failed',
    });
    toast({
      title: 'Erreur',
      description: "Impossible d'ajouter les produits",
      variant: 'destructive',
    });
    return false;
  }
}
