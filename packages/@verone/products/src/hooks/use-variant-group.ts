'use client';

import { useState, useEffect, useRef } from 'react';

import type { VariantGroup } from '@verone/types';
import { createClient } from '@verone/utils/supabase/client';

import type { ProductImageRef } from './types/variant-group.types';

// Hook pour récupérer un groupe de variantes spécifique avec ses produits
export function useVariantGroup(groupId: string) {
  const [variantGroup, setVariantGroup] = useState<VariantGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  useEffect(() => {
    const fetchVariantGroup = async () => {
      if (!groupId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setVariantGroup(null);

      try {
        // Récupérer le groupe de variantes avec jointures
        const { data: groupData, error: fetchError } = await supabase
          .from('variant_groups')
          .select(
            `
            *,
            subcategory:subcategories (
              id,
              name,
              category:categories!inner (
                id,
                name,
                family:families!inner (
                  id,
                  name
                )
              )
            ),
            supplier:organisations!variant_groups_supplier_id_fkey (
              id,
              legal_name,
              trade_name
            )
          `
          )
          .eq('id', groupId)
          .maybeSingle();

        if (fetchError) {
          setLoading(false);
          setError(fetchError.message);
          setVariantGroup(null);
          return;
        }

        // Récupérer les produits du groupe avec prix et attributs
        const { data: productsData } = await supabase
          .from('products')
          .select(
            `
            id,
            name,
            sku,
            stock_status,
            product_status,
            variant_group_id,
            variant_position,
            cost_price,
            weight,
            variant_attributes,
            supplier:organisations!products_supplier_id_fkey (
              id,
              legal_name,
              trade_name
            )
          `
          )
          .eq('variant_group_id', groupId)
          .order('variant_position', { ascending: true });

        const products = productsData ?? [];

        // Récupérer les images des produits
        const productIds = products.map(p => p.id);
        let allImages: ProductImageRef[] = [];

        if (productIds.length > 0) {
          const { data: imagesData } = await supabase
            .from('product_images')
            .select('product_id, public_url')
            .in('product_id', productIds)
            .order('display_order', { ascending: true });

          allImages = (imagesData ?? []) as ProductImageRef[];
        }

        // Associer les images aux produits
        const productsWithImages = products.map(product => ({
          ...product,
          image_url: allImages.find(img => img.product_id === product.id)
            ?.public_url,
        }));

        // Construire l'objet groupe complet
        const groupWithProducts = {
          ...groupData,
          products: productsWithImages,
          product_count: productsWithImages.length,
        };

        setVariantGroup(groupWithProducts as VariantGroup);
        setLoading(false);
        setError(null);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur inconnue';
        setLoading(false);
        setError(errorMessage);
        setVariantGroup(null);
      }
    };

    void fetchVariantGroup();
  }, [groupId, supabase]);

  return { variantGroup, loading, error };
}

// Re-export types for consumers
export type {
  FetchedProduct,
  ProductImageRef,
  VariantGroupUpdateData,
} from './types/variant-group.types';
