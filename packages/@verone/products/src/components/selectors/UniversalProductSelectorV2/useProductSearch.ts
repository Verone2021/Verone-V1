/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, react-hooks/exhaustive-deps */
'use client';

import { useState, useEffect } from 'react';

import { createClient } from '@verone/utils/supabase/client';

import type { ProductData, ProductSearchFilters } from './types';

// ============================================================================
// HOOK - useProductSearch
// ============================================================================

export function useProductSearch(
  searchQuery: string,
  filters: ProductSearchFilters,
  excludeIds: string[] = [],
  debounceMs: number = 250
) {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchProducts();
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [
    searchQuery,
    filters.familyId,
    filters.categoryId,
    filters.subcategoryId,
    filters.creationMode,
    filters.sourcingType,
    filters.supplierId,
    filters.excludeProductsInVariantGroup,
  ]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('products')
        .select(
          `
          id,
          name,
          description,
          sku,
          product_status,
          creation_mode,
          sourcing_type,
          supplier_id,
          subcategory_id,
          stock_real,
          cost_price,
          eco_tax_default,
          created_at,
          updated_at,
          product_images!left (
            public_url,
            is_primary
          ),
          supplier:organisations!supplier_id (
            id,
            legal_name,
            trade_name,
            has_different_trade_name
          ),
          subcategory:subcategories!subcategory_id (
            id,
            name,
            slug,
            category:categories (
              id,
              name,
              slug,
              family:families (
                id,
                name,
                slug
              )
            )
          )
        `
        )
        .order('name', { ascending: true });

      // Filtre par création mode
      if (filters.creationMode) {
        query = query.eq('creation_mode', filters.creationMode);
      }

      // Filtre par sourcing_type
      if (filters.sourcingType) {
        query = query.eq('sourcing_type', filters.sourcingType);
      }

      // Filtre par statut produit (ex: consultations = seulement produits actifs)
      if (filters.productStatus) {
        query = query.eq(
          'product_status',
          filters.productStatus as
            | 'active'
            | 'draft'
            | 'preorder'
            | 'discontinued'
        );
      }

      // Filtre par fournisseur (CRITIQUE pour commandes fournisseurs)
      if (filters.supplierId) {
        query = query.eq('supplier_id', filters.supplierId);
      }

      // Filtre variant_group_id IS NULL (regle "1 produit = 1 variante max")
      // Utilise pour le contexte 'variants' afin d'exclure les produits deja membres d'un groupe
      if (filters.excludeProductsInVariantGroup) {
        query = query.is('variant_group_id', null);
      }

      // Filtre par sous-catégorie (plus spécifique)
      if (filters.subcategoryId) {
        query = query.eq('subcategory_id', filters.subcategoryId);
      }
      // Sinon filtre par catégorie (via subcategories)
      else if (filters.categoryId) {
        const { data: subcats } = await supabase
          .from('subcategories')
          .select('id')
          .eq('category_id', filters.categoryId);

        if (subcats && subcats.length > 0) {
          const subcatIds = subcats.map(s => s.id);
          query = query.in('subcategory_id', subcatIds);
        }
      }
      // Sinon filtre par famille (via categories → subcategories)
      else if (filters.familyId) {
        const { data: cats } = await supabase
          .from('categories')
          .select('id')
          .eq('family_id', filters.familyId);

        if (cats && cats.length > 0) {
          const catIds = cats.map(c => c.id);
          const { data: subcats } = await supabase
            .from('subcategories')
            .select('id')
            .in('category_id', catIds);

          if (subcats && subcats.length > 0) {
            const subcatIds = subcats.map(s => s.id);
            query = query.in('subcategory_id', subcatIds);
          }
        }
      }

      // Recherche texte (ILIKE)
      if (searchQuery.trim()) {
        query = query.or(
          `name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`
        );
      }

      const { data, error: rpcError } = await query.limit(100);

      if (rpcError) throw rpcError;

      const transformedData: ProductData[] = (data ?? []).map((item: any) => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        product_status: item.product_status,
        creation_mode: item.creation_mode,
        sourcing_type: item.sourcing_type,
        supplier_id: item.supplier_id,
        subcategory_id: item.subcategory_id,
        stock_real: item.stock_real,
        cost_price: item.cost_price, // ✅ Prix d'achat pour commandes fournisseurs
        eco_tax_default: item.eco_tax_default, // ✅ Éco-taxe par défaut
        created_at: item.created_at,
        updated_at: item.updated_at,
        archived_at: item.archived_at,
        product_images: item.product_images ?? [],
        supplier: item.supplier ?? null,
        subcategory: item.subcategory ?? null,
      }));

      const filteredData = transformedData.filter(
        p => !excludeIds.includes(p.id)
      );

      setProducts(filteredData);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Erreur lors du chargement des produits';
      setError(message);
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
  };
}
