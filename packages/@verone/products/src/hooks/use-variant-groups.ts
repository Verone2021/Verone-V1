'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

import { useToast } from '@verone/common/hooks';
import type { VariantGroup, VariantGroupFilters } from '@verone/types';
import logger from '@verone/utils/logger';
import { createClient } from '@verone/utils/supabase/client';

import type {
  FetchedProduct,
  ProductImageRef,
} from './types/variant-group.types';
import { useVariantGroupArchive } from './use-variant-group-archive';
import { useVariantGroupCrud } from './use-variant-group-crud';
import { useVariantGroupProducts } from './use-variant-group-products';

export function useVariantGroups(filters?: VariantGroupFilters) {
  const [variantGroups, setVariantGroups] = useState<VariantGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Utiliser useRef pour créer le client UNE SEULE FOIS
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  // Récupérer tous les groupes de variantes
  const fetchVariantGroups = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('variant_groups')
        .select(
          `
          id, name, base_sku, subcategory_id, variant_type,
          product_count, has_common_supplier, supplier_id,
          dimensions_length, dimensions_width, dimensions_height, dimensions_unit,
          style, suitable_rooms,
          common_weight, has_common_weight,
          common_cost_price, has_common_cost_price, common_eco_tax,
          common_material, has_common_material,
          common_color, has_common_color,
          archived_at, created_at, updated_at
        `
        )
        .is('archived_at', null) // IMPORTANT : Exclure les groupes archivés par défaut
        .order('created_at', { ascending: false });

      // Appliquer les filtres
      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }
      if (filters?.subcategory_id) {
        query = query.eq('subcategory_id', filters.subcategory_id);
      }
      if (filters?.variant_type) {
        query = query.eq('variant_type', filters.variant_type);
      }
      if (filters?.is_active !== undefined) {
        if (filters.is_active) {
          query = query.gt('product_count', 0);
        }
      }
      if (filters?.has_products) {
        query = query.gt('product_count', 0);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        setError(fetchError.message);
        logger.error('Erreur fetch variant groups', fetchError, {
          operation: 'fetch_variant_groups_failed',
        });
        return;
      }

      // Récupérer tous les produits des groupes en une seule requête
      const groupIds = (data || []).map(g => g.id);
      let allProducts: FetchedProduct[] = [];

      if (groupIds.length > 0) {
        const { data: productsData } = await supabase
          .from('products')
          .select(
            'id, name, sku, stock_status, product_status, variant_group_id, variant_position, cost_price, weight, variant_attributes'
          )
          .in('variant_group_id', groupIds)
          .order('variant_position', { ascending: true });

        allProducts = (productsData ?? []) as FetchedProduct[];
      }

      // Récupérer les images des produits en une requête
      const productIds = allProducts.map(p => p.id);
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
      const productsWithImages = allProducts.map(product => ({
        ...product,
        image_url: allImages.find(img => img.product_id === product.id)
          ?.public_url,
      }));

      // Grouper les produits par variant_group_id
      const groupsWithProducts = (data || []).map(group => ({
        ...group,
        products: productsWithImages.filter(
          p => p.variant_group_id === group.id
        ),
        product_count: productsWithImages.filter(
          p => p.variant_group_id === group.id
        ).length,
      }));

      setVariantGroups(groupsWithProducts as VariantGroup[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      logger.error('Erreur chargement variant groups', err as Error, {
        operation: 'load_variant_groups_failed',
      });
    } finally {
      setLoading(false);
    }
  }, [
    supabase,
    filters?.search,
    filters?.subcategory_id,
    filters?.variant_type,
    filters?.is_active,
    filters?.has_products,
  ]);

  useEffect(() => {
    void fetchVariantGroups();
  }, [fetchVariantGroups]);

  // Composer les sous-hooks en passant les dépendances partagées
  const deps = { supabase, toast, fetchVariantGroups };

  const { createVariantGroup, deleteVariantGroup, updateVariantGroup } =
    useVariantGroupCrud(deps);

  const {
    addProductsToGroup,
    createProductInGroup,
    updateProductInGroup,
    removeProductFromGroup,
  } = useVariantGroupProducts(deps);

  const {
    archiveVariantGroup,
    unarchiveVariantGroup,
    loadArchivedVariantGroups,
    getAvailableProducts,
  } = useVariantGroupArchive(deps);

  return {
    variantGroups,
    loading,
    error,
    createVariantGroup,
    updateVariantGroup,
    addProductsToGroup,
    createProductInGroup,
    updateProductInGroup,
    removeProductFromGroup,
    deleteVariantGroup,
    archiveVariantGroup,
    unarchiveVariantGroup,
    loadArchivedVariantGroups,
    getAvailableProducts,
    refetch: fetchVariantGroups,
  };
}
