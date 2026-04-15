'use client';

import { useState, useEffect } from 'react';

import { calculateMinimumSellingPrice } from '@verone/finance/utils';
import { createClient } from '@verone/utils/supabase/client';

import type { Product } from './use-products';

export function useProduct(id: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('products')
          .select(
            `
            id,
            sku,
            name,
            slug,
            cost_price,
            stock_status,
            product_status,
            condition,
            variant_attributes,
            dimensions,
            weight,
            video_url,
            supplier_reference,
            gtin,
            stock_quantity,
            min_stock,
            supplier_page_url,
            supplier_id,
            margin_percentage,
            target_margin_percentage,
            availability_type,
            description,
            technical_description,
            selling_points,
            product_type,
            assigned_client_id,
            creation_mode,
            created_at,
            updated_at,
            supplier:organisations!supplier_id (
              id,
              legal_name,
              trade_name,
              type
            ),
            product_images!left (
              public_url,
              is_primary
            )
          `
          )
          .eq('id', id)
          .single();

        if (fetchError) {
          setError(fetchError.message);
          return;
        }

        if (data) {
          const supplierCost = data.cost_price;
          const margin = data.margin_percentage ?? 0;

          const minimumSellingPrice =
            supplierCost && margin
              ? calculateMinimumSellingPrice(supplierCost, margin)
              : 0;

          const primaryImage = data.product_images?.find(img => img.is_primary);
          const primaryImageUrl =
            primaryImage?.public_url ??
            data.product_images?.[0]?.public_url ??
            null;

          setProduct({
            ...data,
            primary_image_url: primaryImageUrl,
            minimumSellingPrice,
          } as unknown as Product);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    void fetchProduct();
  }, [id, supabase]);

  return { product, loading, error };
}
