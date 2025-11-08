'use client';

import { useState, useCallback } from 'react';

import { createClient } from '@verone/utils/supabase/client';
import { useToast } from '@/shared/modules/common/hooks';

export interface VariantProduct {
  id: string;
  sku: string;
  name: string;
  cost_price: number;
  stock_status: 'in_stock' | 'out_of_stock' | 'coming_soon';
  product_status: 'active' | 'preorder' | 'discontinued' | 'draft';
  variant_attributes?: any;
  variant_group_id: string | null;
  variant_position: number;
  is_variant_parent: boolean;
  stock_quantity?: number;
  main_image_url?: string;
  created_at: string;
  updated_at: string;
}

interface CreateVariantProductData {
  name: string;
  variant_attributes: {
    color?: string;
    size?: string;
    material?: string;
    pattern?: string;
    [key: string]: any;
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

export function useVariantProducts() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  // Ajouter un produit existant à un groupe de variantes
  const addProductToVariantGroup = async (
    productId: string,
    variantGroupId: string,
    position?: number
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Vérifier le nombre de produits existants dans le groupe (limite Google Merchant Center)
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

      // Déterminer la position si non fournie
      let finalPosition = position;
      if (!finalPosition) {
        const { data: maxPositionData } = await supabase
          .from('products')
          .select('variant_position')
          .eq('variant_group_id', variantGroupId)
          .order('variant_position', { ascending: false })
          .limit(1);

        finalPosition = (maxPositionData?.[0]?.variant_position || 0) + 1;
      }

      // Vérifier que le produit n'est pas déjà dans un groupe
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

      // Mettre à jour le produit
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

  // Retirer un produit d'un groupe de variantes
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

  // Créer un nouveau produit directement dans un groupe de variantes
  const createVariantProduct = async (
    variantGroupId: string,
    baseProductId: string,
    data: CreateVariantProductData
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Vérifier la limite de 30 produits
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

      // Récupérer les informations du produit de base
      const { data: baseProduct, error: baseError } = await supabase
        .from('products')
        .select(
          'sku, subcategory_id, supplier_id, brand, description, technical_description'
        )
        .eq('id', baseProductId)
        .single();

      if (baseError || !baseProduct) {
        toast({
          title: 'Erreur',
          description: 'Produit de base introuvable',
          variant: 'destructive',
        });
        return null;
      }

      // Déterminer la position du nouveau produit
      const { data: maxPositionData } = await supabase
        .from('products')
        .select('variant_position')
        .eq('variant_group_id', variantGroupId)
        .order('variant_position', { ascending: false })
        .limit(1);

      const nextPosition = (maxPositionData?.[0]?.variant_position || 0) + 1;

      // Générer un SKU unique basé sur le SKU de base
      const variantSuffix = Object.entries(data.variant_attributes)
        .filter(([_, value]) => value)
        .map(
          ([key, value]) =>
            `${key.charAt(0).toUpperCase()}${value.toString().substring(0, 3)}`
        )
        .join('-');

      const newSku = `${baseProduct.sku}-${variantSuffix}`;

      // Créer le nouveau produit
      const { data: newProduct, error: createError } = await supabase
        .from('products')
        .insert([
          {
            sku: newSku,
            name: data.name,
            cost_price: data.cost_price,
            stock_status: 'in_stock',
            product_status: 'active',
            variant_attributes: data.variant_attributes,
            variant_group_id: variantGroupId,
            variant_position: nextPosition,
            is_variant_parent: false,
            stock_quantity: data.stock_quantity || 0,
            subcategory_id: data.subcategory_id || baseProduct.subcategory_id,
            supplier_id: data.supplier_id || baseProduct.supplier_id,
            brand: baseProduct.brand,
            description: baseProduct.description,
            technical_description: baseProduct.technical_description,
          },
        ])
        .select()
        .single();

      if (createError) {
        toast({
          title: 'Erreur',
          description: createError.message,
          variant: 'destructive',
        });
        return null;
      }

      // Ajouter l'image si fournie
      if (data.image_url && newProduct) {
        await supabase.from('product_images').insert([
          {
            product_id: newProduct.id,
            image_url: data.image_url,
            is_primary: true,
            display_order: 1,
          },
        ] as any);
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

  // Créer rapidement un produit variante avec données minimales (comme demandé)
  const createQuickVariantProduct = async (
    variantGroupId: string,
    baseProductId: string,
    groupName: string,
    data: QuickVariantProductData
  ) => {
    // Générer automatiquement le nom du produit à partir du groupe et des attributs
    const variantName = `${groupName} - ${Object.entries(data)
      .filter(
        ([key, value]) => value && key !== 'cost_price' && key !== 'image_url'
      )
      .map(([_, value]) => value)
      .join(' ')}`;

    const fullProductData: CreateVariantProductData = {
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
    };

    return await createVariantProduct(
      variantGroupId,
      baseProductId,
      fullProductData
    );
  };

  // Mettre à jour l'ordre des produits dans un groupe
  const reorderProductsInGroup = async (
    variantGroupId: string,
    productPositions: { productId: string; position: number }[]
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Mettre à jour toutes les positions en une transaction
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

      toast({
        title: 'Succès',
        description: 'Ordre des produits mis à jour',
      });

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

  // Définir un produit comme parent du groupe de variantes
  const setVariantParent = async (
    productId: string,
    variantGroupId: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // D'abord, retirer le statut parent de tous les autres produits du groupe
      await supabase
        .from('products')
        .update({
          is_variant_parent: false,
          updated_at: new Date().toISOString(),
        })
        .eq('variant_group_id', variantGroupId);

      // Puis définir le nouveau parent
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

      toast({
        title: 'Succès',
        description: 'Produit parent défini',
      });

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

  // Récupérer tous les produits disponibles pour ajout à un groupe
  const getAvailableProductsForVariantGroup = useCallback(
    async (search?: string, limit?: number) => {
      try {
        let query = supabase
          .from('products')
          .select(
            'id, name, sku, cost_price, stock_status, product_status, variant_group_id'
          )
          .is('variant_group_id', null) // Seulement les produits non assignés
          .is('archived_at', null)
          .neq('creation_mode', 'sourcing') // Exclure les produits en sourcing
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

        return data || [];
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
