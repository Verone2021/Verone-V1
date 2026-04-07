'use client';

import { useRef } from 'react';

import { useToast } from '@verone/common/hooks';
import logger from '@verone/utils/logger';
import { createClient } from '@verone/utils/supabase/client';

import { generateProductSKU } from '@verone/products/utils';

// Hook pour l'édition des attributs de produits dans un groupe de variantes
export function useProductVariantEditing() {
  const { toast } = useToast();
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  // Mettre à jour le prix d'un produit
  const updateProductPrice = async (
    productId: string,
    price: number
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          cost_price: price,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId);

      if (error) {
        toast({
          title: 'Erreur',
          description: error.message,
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Succès',
        description: 'Prix mis à jour',
      });
      return true;
    } catch (err) {
      logger.error('Erreur mise à jour prix', err as Error, {
        operation: 'update_product_price_failed',
      });
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le prix',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Mettre à jour un attribut de variante d'un produit
  const updateProductVariantAttribute = async (
    productId: string,
    attributeKey: string,
    value: string
  ): Promise<boolean> => {
    try {
      // Récupérer les attributs actuels ET les infos du groupe
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select(
          `
          variant_attributes,
          variant_group_id,
          variant_groups (
            name,
            base_sku,
            variant_type
          )
        `
        )
        .eq('id', productId)
        .single();

      if (fetchError) {
        toast({
          title: 'Erreur',
          description: fetchError.message,
          variant: 'destructive',
        });
        return false;
      }

      // Mettre à jour l'attribut spécifique
      const updatedAttributes = {
        ...((product?.variant_attributes ?? {}) as Record<string, unknown>),
        [attributeKey]: value,
      };

      // Récupérer les infos du groupe pour régénérer nom et SKU
      const groupData = (
        product as {
          variant_groups?: {
            name: string;
            base_sku: string;
            variant_type?: string;
          };
        }
      )?.variant_groups;

      // Préparer les données de mise à jour
      const updateData: Record<string, unknown> = {
        variant_attributes: updatedAttributes,
        updated_at: new Date().toISOString(),
      };

      // Si le produit appartient à un groupe, régénérer automatiquement nom ET SKU
      if (groupData?.name && groupData.base_sku) {
        const variantType = groupData.variant_type ?? attributeKey;
        const variantValue = updatedAttributes[variantType] as
          | string
          | undefined;

        if (variantValue) {
          // Générer le nouveau nom : "{group_name} - {variant_value}"
          updateData.name = `${groupData.name} - ${variantValue}`;

          // Générer le nouveau SKU : "{BASE_SKU}-{VARIANT_VALUE}"
          updateData.sku = generateProductSKU(groupData.base_sku, variantValue);
        }
      }

      const { error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId);

      if (updateError) {
        toast({
          title: 'Erreur',
          description: updateError.message,
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Succès',
        description: `${attributeKey === 'color' ? 'Couleur' : attributeKey === 'material' ? 'Matière' : attributeKey} mise à jour`,
      });
      return true;
    } catch (err) {
      logger.error('Erreur mise à jour attribut', err as Error, {
        operation: 'update_product_attribute_failed',
      });
      toast({
        title: 'Erreur',
        description: "Impossible de mettre à jour l'attribut",
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    updateProductPrice,
    updateProductVariantAttribute,
  };
}
