'use client';

import type { SupabaseClient } from '@supabase/supabase-js';

import logger from '@verone/utils/logger';

import type { VariantGroupUpdateData } from '../types/variant-group.types';

/** Propager le fournisseur à tous les produits du groupe */
export async function propagateSupplierToProducts(
  supabase: SupabaseClient,
  groupId: string,
  supplierId: string
): Promise<void> {
  logger.info('Propagation fournisseur aux produits', {
    operation: 'propagate_supplier_to_products',
    groupId,
    supplierId,
  });

  const { error } = await supabase
    .from('products')
    .update({ supplier_id: supplierId })
    .eq('variant_group_id', groupId);

  if (error) {
    logger.error('Erreur propagation fournisseur', error, {
      operation: 'propagate_supplier_failed',
    });
  } else {
    logger.info('Fournisseur propagé avec succès', {
      operation: 'propagate_supplier_success',
    });
  }
}

/** Propager le poids à tous les produits du groupe */
export async function propagateWeightToProducts(
  supabase: SupabaseClient,
  groupId: string,
  weight: number
): Promise<void> {
  logger.info('Propagation poids aux produits', {
    operation: 'propagate_weight_to_products',
    groupId,
    weight,
  });

  const { error } = await supabase
    .from('products')
    .update({ weight })
    .eq('variant_group_id', groupId);

  if (error) {
    logger.error('Erreur propagation poids', error, {
      operation: 'propagate_weight_failed',
    });
  } else {
    logger.info('Poids propagé avec succès', {
      operation: 'propagate_weight_success',
    });
  }
}

/** Propager le prix d'achat (et optionnellement l'éco-taxe) à tous les produits */
export async function propagateCostPriceToProducts(
  supabase: SupabaseClient,
  groupId: string,
  costPrice: number,
  ecoTax?: number | null
): Promise<void> {
  logger.info("Propagation prix d'achat aux produits", {
    operation: 'propagate_cost_price_to_products',
    groupId,
    costPrice,
  });

  const { error } = await supabase
    .from('products')
    .update({ cost_price: costPrice })
    .eq('variant_group_id', groupId);

  if (error) {
    logger.error("Erreur propagation prix d'achat", error, {
      operation: 'propagate_cost_price_failed',
    });
    return;
  }

  logger.info("Prix d'achat propagé avec succès", {
    operation: 'propagate_cost_price_success',
  });

  if (ecoTax !== undefined && ecoTax !== null) {
    logger.info('Propagation éco-taxe aux produits', {
      operation: 'propagate_eco_tax_to_products',
      groupId,
      ecoTax,
    });

    const { error: ecoTaxError } = await supabase
      .from('products')
      .update({ eco_tax_default: ecoTax })
      .eq('variant_group_id', groupId);

    if (ecoTaxError) {
      logger.error('Erreur propagation éco-taxe', ecoTaxError, {
        operation: 'propagate_eco_tax_failed',
      });
    } else {
      logger.info('Éco-taxe propagée avec succès', {
        operation: 'propagate_eco_tax_success',
      });
    }
  }
}

/** Propager les attributs communs (dimensions, sous-catégorie, poids, noms) aux produits */
export async function propagateCommonAttributesToProducts(
  supabase: SupabaseClient,
  groupId: string,
  data: VariantGroupUpdateData
): Promise<void> {
  const needsPropagation =
    data.common_dimensions !== undefined ||
    data.style !== undefined ||
    data.suitable_rooms !== undefined ||
    data.subcategory_id !== undefined ||
    data.name !== undefined ||
    data.common_weight !== undefined;

  if (!needsPropagation) return;

  const productsUpdateData: Record<string, unknown> = {};

  if (data.common_dimensions !== undefined) {
    productsUpdateData.dimensions = data.common_dimensions;
  }
  if (data.suitable_rooms !== undefined) {
    productsUpdateData.suitable_rooms = data.suitable_rooms;
  }
  if (data.subcategory_id !== undefined) {
    productsUpdateData.subcategory_id = data.subcategory_id;
  }
  if (data.common_weight !== undefined) {
    productsUpdateData.weight = data.common_weight;
  }

  // Si le nom du groupe change, mettre à jour les noms des produits individuellement
  if (data.name !== undefined) {
    const { data: products } = await supabase
      .from('products')
      .select('id, variant_attributes')
      .eq('variant_group_id', groupId);

    if (products && products.length > 0) {
      const { data: groupInfo } = await supabase
        .from('variant_groups')
        .select('variant_type')
        .eq('id', groupId)
        .single();

      const variantType =
        (groupInfo as { variant_type?: string } | null)?.variant_type ??
        'color';

      for (const product of products) {
        const attrs = product.variant_attributes as Record<
          string,
          unknown
        > | null;
        const variantValue = attrs?.[variantType] as string | undefined;
        if (variantValue) {
          await supabase
            .from('products')
            .update({ name: `${data.name} - ${variantValue}` })
            .eq('id', product.id);
        }
      }
    }
  }

  if (Object.keys(productsUpdateData).length > 0) {
    const { error } = await supabase
      .from('products')
      .update(productsUpdateData)
      .eq('variant_group_id', groupId);

    if (error) {
      logger.error('Erreur propagation attributs communs', error, {
        operation: 'propagate_common_attributes_failed',
      });
      // Ne pas faire échouer toute l'opération
    }
  }
}
