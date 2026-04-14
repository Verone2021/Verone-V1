'use client';

import { useState } from 'react';

import { useToast } from '@verone/common/hooks';
import { createClient } from '@verone/utils/supabase/client';

interface CreateVariantProductData {
  name: string;
  variant_attributes: {
    color?: string;
    size?: string;
    material?: string;
    pattern?: string;
    [key: string]: unknown;
  };
  cost_price: number;
  stock_quantity?: number;
  image_url?: string;
  subcategory_id?: string;
  supplier_id?: string;
}

interface QuickVariantProductData {
  color?: string;
  size?: string;
  material?: string;
  pattern?: string;
  cost_price: number;
  image_url?: string;
}

export function useVariantProductCreate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  const createVariantProduct = async (
    variantGroupId: string,
    baseProductId: string,
    data: CreateVariantProductData
  ) => {
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
        return null;
      }

      const { data: baseProduct, error: baseError } = await supabase
        .from('products')
        .select(
          'sku, subcategory_id, supplier_id, brand, description, technical_description'
        )
        .eq('id', baseProductId)
        .single();

      if (baseError ?? !baseProduct) {
        toast({
          title: 'Erreur',
          description: 'Produit de base introuvable',
          variant: 'destructive',
        });
        return null;
      }

      const { data: maxPositionData } = await supabase
        .from('products')
        .select('variant_position')
        .eq('variant_group_id', variantGroupId)
        .order('variant_position', { ascending: false })
        .limit(1);

      const nextPosition = (maxPositionData?.[0]?.variant_position ?? 0) + 1;

      const variantSuffix = Object.entries(data.variant_attributes)
        .filter(([, value]) => value)
        .map(
          ([key, value]) =>
            `${key.charAt(0).toUpperCase()}${String(value).substring(0, 3)}`
        )
        .join('-');

      const newSku = `${baseProduct.sku}-${variantSuffix}`;

      const { data: newProduct, error: createError } = await supabase
        .from('products')
        .insert([
          {
            sku: newSku,
            name: data.name,
            cost_price: data.cost_price,
            stock_status: 'in_stock' as const,
            product_status: 'active' as const,
            variant_attributes: data.variant_attributes,
            variant_group_id: variantGroupId,
            variant_position: nextPosition,
            stock_quantity: data.stock_quantity ?? 0,
            subcategory_id: data.subcategory_id ?? baseProduct.subcategory_id,
            supplier_id: data.supplier_id ?? baseProduct.supplier_id,
            brand: baseProduct.brand,
            description: baseProduct.description,
            technical_description: baseProduct.technical_description,
          } as unknown as import('@verone/types').Database['public']['Tables']['products']['Insert'],
        ])
        .select(
          'id, name, sku, cost_price, stock_status, product_status, variant_attributes, variant_group_id, variant_position, created_at, updated_at'
        )
        .single();

      if (createError) {
        toast({
          title: 'Erreur',
          description: createError.message,
          variant: 'destructive',
        });
        return null;
      }

      if (data.image_url && newProduct) {
        await supabase.from('product_images').insert([
          {
            product_id: newProduct.id,
            image_url: data.image_url,
            is_primary: true,
            display_order: 1,
          },
        ] as unknown as import('@verone/types').Database['public']['Tables']['product_images']['Insert'][]);
      }

      toast({
        title: 'Succès',
        description: `Produit "${data.name}" créé dans le groupe de variantes`,
      });
      return newProduct;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le produit variante',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createQuickVariantProduct = async (
    variantGroupId: string,
    baseProductId: string,
    groupName: string,
    data: QuickVariantProductData
  ) => {
    const variantName = `${groupName} - ${Object.entries(data)
      .filter(
        ([key, value]) => value && key !== 'cost_price' && key !== 'image_url'
      )
      .map(([, value]) => String(value))
      .join(' ')}`;

    return createVariantProduct(variantGroupId, baseProductId, {
      name: variantName,
      variant_attributes: {
        color: data.color,
        size: data.size,
        material: data.material,
        pattern: data.pattern,
      },
      cost_price: data.cost_price,
      stock_quantity: 0,
      image_url: data.image_url,
    });
  };

  return { loading, error, createVariantProduct, createQuickVariantProduct };
}
