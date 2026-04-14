'use client';

import { useState, useCallback } from 'react';

import { useToast } from '@verone/common/hooks';
import { createClient } from '@verone/utils/supabase/client';

import { useVariantProductCreate } from './use-variant-products-create';

export { useVariantProductCreate };

export interface VariantProduct {
  id: string;
  sku: string;
  name: string;
  cost_price: number;
  stock_status: 'in_stock' | 'out_of_stock' | 'coming_soon';
  product_status: 'active' | 'preorder' | 'discontinued' | 'draft';
  variant_attributes?: Record<string, unknown>;
  variant_group_id: string | null;
  variant_position: number;
  is_variant_parent: boolean;
  stock_quantity?: number;
  created_at: string;
  updated_at: string;
}

export function useVariantProducts() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  const { createVariantProduct, createQuickVariantProduct } =
    useVariantProductCreate();

  const addProductToVariantGroup = async (
    productId: string,
    variantGroupId: string,
    position?: number
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { data: existingProducts } = await supabase
        .from('products')
        .select('id')
        .eq('variant_group_id', variantGroupId)
        .is('archived_at', null);

      if (existingProducts && existingProducts.length >= 30) {
        toast({
          title: 'Erreur',
          description:
            'Maximum 30 variantes par groupe (limite Google Merchant Center)',
          variant: 'destructive',
        });
        return false;
      }

      let finalPosition = position;
      if (!finalPosition) {
        const { data: maxPositionData } = await supabase
          .from('products')
          .select('variant_position')
          .eq('variant_group_id', variantGroupId)
          .order('variant_position', { ascending: false })
          .limit(1);
        finalPosition = (maxPositionData?.[0]?.variant_position ?? 0) + 1;
      }

      const { data: productCheck } = await supabase
        .from('products')
        .select('variant_group_id, name')
        .eq('id', productId)
        .single();

      if (productCheck?.variant_group_id) {
        toast({
          title: 'Erreur',
          description: `Le produit "${productCheck.name}" fait déjà partie d'un groupe de variantes`,
          variant: 'destructive',
        });
        return false;
      }

      const { error: updateError } = await supabase
        .from('products')
        .update({
          variant_group_id: variantGroupId,
          variant_position: finalPosition,
          updated_at: new Date().toISOString(),
        })
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
        description: 'Produit ajouté au groupe de variantes',
      });
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      toast({
        title: 'Erreur',
        description: "Impossible d'ajouter le produit au groupe",
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeProductFromVariantGroup = async (
    productId: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('products')
        .update({
          variant_group_id: null,
          variant_position: 1,
          is_variant_parent: false,
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
        description: 'Produit retiré du groupe de variantes',
      });
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      toast({
        title: 'Erreur',
        description: 'Impossible de retirer le produit du groupe',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const reorderProductsInGroup = async (
    variantGroupId: string,
    productPositions: { productId: string; position: number }[]
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const updates = productPositions.map(({ productId, position }) =>
        supabase
          .from('products')
          .update({
            variant_position: position,
            updated_at: new Date().toISOString(),
          })
          .eq('id', productId)
          .eq('variant_group_id', variantGroupId)
      );

      const results = await Promise.all(updates);
      const hasError = results.some(result => result.error);

      if (hasError) {
        toast({
          title: 'Erreur',
          description: 'Impossible de réorganiser tous les produits',
          variant: 'destructive',
        });
        return false;
      }

      toast({ title: 'Succès', description: 'Ordre des produits mis à jour' });
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      toast({
        title: 'Erreur',
        description: 'Impossible de réorganiser les produits',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const setVariantParent = async (
    productId: string,
    variantGroupId: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      await supabase
        .from('products')
        .update({
          is_variant_parent: false,
          updated_at: new Date().toISOString(),
        })
        .eq('variant_group_id', variantGroupId);

      const { error } = await supabase
        .from('products')
        .update({
          is_variant_parent: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId)
        .eq('variant_group_id', variantGroupId);

      if (error) {
        toast({
          title: 'Erreur',
          description: error.message,
          variant: 'destructive',
        });
        return false;
      }

      toast({ title: 'Succès', description: 'Produit parent défini' });
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      toast({
        title: 'Erreur',
        description: 'Impossible de définir le produit parent',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getAvailableProductsForVariantGroup = useCallback(
    async (search?: string, limit?: number) => {
      try {
        let query = supabase
          .from('products')
          .select(
            'id, name, sku, cost_price, stock_status, product_status, variant_group_id'
          )
          .is('variant_group_id', null)
          .is('archived_at', null)
          .neq('creation_mode', 'sourcing')
          .order('created_at', { ascending: false });

        if (search) {
          query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
        }
        if (limit) {
          query = query.limit(limit);
        }

        const { data, error } = await query;
        if (error) {
          console.error('Error fetching available products:', error);
          return [];
        }
        return data ?? [];
      } catch (err) {
        console.error('Error in getAvailableProductsForVariantGroup:', err);
        return [];
      }
    },
    [supabase]
  );

  return {
    loading,
    error,
    addProductToVariantGroup,
    removeProductFromVariantGroup,
    createVariantProduct,
    createQuickVariantProduct,
    reorderProductsInGroup,
    setVariantParent,
    getAvailableProductsForVariantGroup,
  };
}
