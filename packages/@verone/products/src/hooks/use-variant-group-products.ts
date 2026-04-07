'use client';

import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  AddProductsToGroupData,
  EditableProductFields,
  VariantType,
} from '@verone/types';
import logger from '@verone/utils/logger';

import { generateProductSKU } from '@verone/products/utils';

import type { ToastFn } from './types/variant-group.types';
import {
  assertUniqueVariantValue,
  buildNewProductForGroup,
} from './utils/variant-group-product-builder';
import { addProductsToGroup as addProductsToGroupFn } from './use-variant-group-add';

interface GroupForCreate {
  name: string;
  base_sku: string;
  product_count: number | null;
  subcategory_id: string | null;
  common_dimensions: unknown;
  style: string | null;
  suitable_rooms: string[] | null;
  has_common_supplier: boolean | null;
  supplier_id: string | null;
}

export interface VariantGroupProductsDeps {
  supabase: SupabaseClient;
  toast: ToastFn;
  fetchVariantGroups: () => Promise<void>;
}

export function useVariantGroupProducts(deps: VariantGroupProductsDeps) {
  const { supabase, toast, fetchVariantGroups } = deps;

  const addProductsToGroup = (data: AddProductsToGroupData): Promise<boolean> =>
    addProductsToGroupFn(deps, data);

  // Créer un nouveau produit directement dans le groupe avec auto-naming
  const createProductInGroup = async (
    groupId: string,
    variantValue: string,
    variantType: VariantType
  ): Promise<boolean> => {
    try {
      const { data: group, error: groupError } = await supabase
        .from('variant_groups')
        .select(
          'name, base_sku, product_count, subcategory_id, common_dimensions, style, suitable_rooms, has_common_supplier, supplier_id'
        )
        .eq('id', groupId)
        .single();

      if (groupError || !group) {
        throw new Error('Groupe introuvable');
      }

      const typedGroup = group as unknown as GroupForCreate;

      // Vérifier l'unicité des attributs variantes dans le groupe
      const { data: existingProducts } = await supabase
        .from('products')
        .select('variant_attributes')
        .eq('variant_group_id', groupId);

      if (existingProducts && existingProducts.length > 0) {
        assertUniqueVariantValue(existingProducts, variantType, variantValue);
      }

      const { productName, product: newProduct } = buildNewProductForGroup(
        typedGroup,
        groupId,
        variantValue,
        variantType
      );

      logger.info('Création produit dans groupe', {
        operation: 'create_product_in_group',
        productName,
        groupId,
        hasCommonSupplier: typedGroup.has_common_supplier,
        supplierId: typedGroup.supplier_id,
        willInheritSupplier:
          typedGroup.has_common_supplier && typedGroup.supplier_id,
      });

      const { error: createError, data: createdProduct } = await supabase
        .from('products')
        .insert(newProduct)
        .select(
          'id, name, sku, variant_group_id, variant_position, cost_price, product_status, stock_status'
        )
        .single();

      if (createError) {
        logger.error('Erreur création produit', createError, {
          operation: 'create_product_failed',
        });
        throw createError;
      }

      logger.info('Produit créé avec succès', {
        operation: 'create_product_success',
        productId: createdProduct.id,
        sku: createdProduct.sku,
      });

      const { error: updateError } = await supabase
        .from('variant_groups')
        .update({
          product_count: (typedGroup.product_count ?? 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', groupId);

      if (updateError) {
        logger.error('Erreur mise à jour compteur', updateError, {
          operation: 'update_variant_counter_failed',
        });
      }

      toast({
        title: 'Produit créé',
        description: `"${productName}" créé avec succès dans le groupe`,
      });
      return true;
    } catch (err) {
      logger.error('Erreur createProductInGroup', err as Error, {
        operation: 'create_product_in_group_exception',
      });
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le produit',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Mettre à jour un produit dans un groupe
  const updateProductInGroup = async (
    productId: string,
    updates: Partial<EditableProductFields>
  ): Promise<boolean> => {
    try {
      const finalUpdates = { ...updates };

      if (updates.variant_attributes) {
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('variant_group_id')
          .eq('id', productId)
          .single();

        const typedProduct = product as unknown as {
          variant_group_id: string | null;
        } | null;
        if (productError || !typedProduct?.variant_group_id) {
          throw new Error('Produit ou groupe introuvable');
        }

        const { data: group, error: groupError } = await supabase
          .from('variant_groups')
          .select('name, base_sku, variant_type')
          .eq('id', typedProduct.variant_group_id)
          .single();

        if (groupError || !group) {
          throw new Error('Groupe introuvable');
        }

        const typedGroupForUpdate = group as unknown as {
          name: string;
          base_sku: string;
          variant_type: string | null;
        };
        const variantType = typedGroupForUpdate.variant_type ?? 'color';
        const variantValue = updates.variant_attributes[variantType];

        if (variantValue) {
          finalUpdates.name = `${typedGroupForUpdate.name} - ${variantValue}`;
          finalUpdates.sku = generateProductSKU(
            typedGroupForUpdate.base_sku,
            variantValue
          );
        }
      }

      const { error: updateError } = await supabase
        .from('products')
        .update({
          ...finalUpdates,
          updated_at: new Date().toISOString(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dimensions type mismatch avec Supabase Json
        } as any)
        .eq('id', productId);

      if (updateError) {
        logger.error('Erreur mise à jour produit', updateError, {
          operation: 'update_product_failed',
        });
        toast({
          title: 'Erreur',
          description: updateError.message,
          variant: 'destructive',
        });
        return false;
      }

      toast({ title: 'Succès', description: 'Produit mis à jour avec succès' });
      return true;
    } catch (err) {
      logger.error('Erreur updateProductInGroup', err as Error, {
        operation: 'update_product_in_group_exception',
      });
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le produit',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Retirer un produit d'un groupe
  const removeProductFromGroup = async (
    productId: string
  ): Promise<boolean> => {
    try {
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('variant_group_id, variant_position')
        .eq('id', productId)
        .single();

      if (fetchError || !product?.variant_group_id) {
        toast({
          title: 'Erreur',
          description: 'Produit non trouvé ou pas dans un groupe',
          variant: 'destructive',
        });
        return false;
      }

      const { error: updateError } = await supabase
        .from('products')
        .update({ variant_group_id: null, variant_position: null })
        .eq('id', productId);

      if (updateError) {
        toast({
          title: 'Erreur',
          description: updateError.message,
          variant: 'destructive',
        });
        return false;
      }

      // Réorganiser les positions des autres produits
      const { data: remainingProducts } = await supabase
        .from('products')
        .select('id')
        .eq('variant_group_id', product.variant_group_id)
        .order('variant_position', { ascending: true });

      if (remainingProducts) {
        for (let i = 0; i < remainingProducts.length; i++) {
          await supabase
            .from('products')
            .update({ variant_position: i + 1 })
            .eq('id', remainingProducts[i].id);
        }
      }

      const { error: countError } = await supabase
        .from('variant_groups')
        .update({
          product_count: remainingProducts?.length ?? 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', product.variant_group_id);

      if (countError) {
        logger.error('Erreur update count', countError, {
          operation: 'update_variant_count_failed',
        });
      }

      // Rafraîchir AVANT le toast pour éviter l'erreur React state update
      await fetchVariantGroups();
      toast({ title: 'Succès', description: 'Produit retiré du groupe' });
      return true;
    } catch (err) {
      logger.error('Erreur retrait produit', err as Error, {
        operation: 'remove_product_from_group_failed',
      });
      toast({
        title: 'Erreur',
        description: 'Impossible de retirer le produit',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    addProductsToGroup,
    createProductInGroup,
    updateProductInGroup,
    removeProductFromGroup,
  };
}
