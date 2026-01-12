/**
 * Hook Catalogue Vérone - Gestion état et API
 * Intégration Supabase avec RLS selon roles-permissions-v1.md
 * Performance: <2s dashboard selon SLOs
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

import { createClient } from '@verone/utils/supabase/client';

// Types selon ERD-CATALOGUE-V1.md
interface ProductGroup {
  id: string;
  name: string;
  description?: string;
  slug: string;
  category_id: string;
  brand?: string;
  status: 'draft' | 'active' | 'inactive' | 'discontinued';
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  cost_price: number; // Prix en centimes
  tax_rate: number;
  stock_status: 'in_stock' | 'out_of_stock' | 'coming_soon';
  product_status: 'active' | 'preorder' | 'discontinued' | 'draft';
  condition: 'new' | 'refurbished' | 'used';
  variant_attributes: Record<string, any>;
  dimensions?: Record<string, any>;
  weight?: number;
  primary_image_url: string;
  gallery_images: string[];
  video_url?: string;
  supplier_reference?: string;
  gtin?: string;
  archived_at?: string | null;
  created_at: string;
  updated_at: string;
  // Nouvelles relations directes
  subcategory_id?: string;
  brand?: string;
  supplier_id?: string;
  supplier?: {
    id: string;
    legal_name: string;
    trade_name: string | null;
  };
  subcategories?: {
    id: string;
    name: string;
  };

  // ✅ STOCK - Propriétés manquantes alignées avec DB
  stock_real?: number; // Stock réel physique
  min_stock?: number; // Stock minimum
  stock_quantity?: number; // Stock quantity (legacy)
  stock_forecasted_in?: number;
  stock_forecasted_out?: number;
}

export interface Category {
  id: string;
  parent_id?: string;
  name: string;
  slug: string;
  level: number;
  google_category_id?: number;
  facebook_category?: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface CatalogueFilters {
  search?: string;
  families?: string[]; // ✅ NOUVEAU: Filtre par familles (niveau 0)
  categories?: string[]; // ✅ NOUVEAU: Filtre par catégories (niveau 1)
  subcategories?: string[]; // Filtre par sous-catégories (niveau 2)
  statuses?: string[];
  suppliers?: string[]; // Filtre par fournisseurs (supplier_id)
  priceMin?: number;
  priceMax?: number;
  limit?: number;
  offset?: number;
  page?: number; // Page courante (1-indexed)
}

const ITEMS_PER_PAGE = 24; // Optimized: 3 rows × 4 columns × 2 viewport

interface CatalogueState {
  productGroups: ProductGroup[];
  products: Product[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  total: number;
}

export const useCatalogue = () => {
  // ✅ FIX P0-2: Séparer filters du state principal pour casser circular dependency
  const [filters, setFiltersState] = useState<CatalogueFilters>({});

  const [state, setState] = useState<CatalogueState>({
    productGroups: [],
    products: [],
    categories: [],
    loading: true,
    error: null,
    total: 0,
  });

  // ✅ Singleton déjà mémorisé - pas besoin de useMemo
  const supabase = createClient();

  // ✅ FIX P0-2: loadCatalogueData dépend maintenant de filters séparé (pas de circular dependency)
  const loadCatalogueData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Performance monitoring pour SLO <2s
      const startTime = performance.now();

      // Chargement parallèle pour optimiser performance
      const [categoriesResult, productsResult] = await Promise.all([
        loadCategories(),
        loadProducts(filters),
      ]);

      const loadTime = performance.now() - startTime;
      if (loadTime > 2000) {
        console.warn(
          `⚠️ SLO dashboard dépassé: ${Math.round(loadTime)}ms > 2000ms`
        );
      }

      setState(prev => ({
        ...prev,
        categories: categoriesResult,
        products: productsResult.products as any,
        total: productsResult.total,
        loading: false,
      }));
    } catch (error) {
      console.error('Erreur chargement catalogue:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        loading: false,
      }));
    }
  }, [filters]); // ✅ FIX P0-2: Dependency sur filters séparé (pas de circular)

  // ✅ FIX P0-2: useEffect trigger sur filters change
  useEffect(() => {
    loadCatalogueData();
  }, [loadCatalogueData]);

  const loadCategories = async (): Promise<Category[]> => {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, level, display_order, is_active')
      .eq('is_active', true)
      .order('level', { ascending: true })
      .order('display_order', { ascending: true });

    if (error) throw error;
    return (data || []) as any;
  };

  // ✅ NOUVEAU: Fonction helper pour résoudre les subcategory_ids depuis families/categories
  const resolveSubcategoryIds = async (
    filters: CatalogueFilters
  ): Promise<string[]> => {
    const subcategoryIds = new Set<string>();

    // Ajouter les sous-catégories directement sélectionnées
    if (filters.subcategories?.length) {
      filters.subcategories.forEach(id => subcategoryIds.add(id));
    }

    // Si des catégories sont sélectionnées, récupérer leurs sous-catégories
    if (filters.categories?.length) {
      const { data: subcats } = await supabase
        .from('subcategories')
        .select('id')
        .in('category_id', filters.categories);

      subcats?.forEach(sub => subcategoryIds.add(sub.id));
    }

    // Si des familles sont sélectionnées, récupérer toutes les sous-catégories via les catégories
    if (filters.families?.length) {
      // D'abord récupérer les catégories de ces familles
      const { data: cats } = await supabase
        .from('categories')
        .select('id')
        .in('family_id', filters.families);

      if (cats?.length) {
        const categoryIds = cats.map(c => c.id);
        const { data: subcats } = await supabase
          .from('subcategories')
          .select('id')
          .in('category_id', categoryIds);

        subcats?.forEach(sub => subcategoryIds.add(sub.id));
      }
    }

    return Array.from(subcategoryIds);
  };

  const loadProducts = async (filters: CatalogueFilters = {}) => {
    // ✅ FIX PAGINATION: Utiliser count: 'exact' pour le total réel
    let query = supabase.from('products').select(
      `
        id, sku, name, slug,
        stock_status, product_status, condition,
        subcategory_id, supplier_id, brand,
        archived_at, created_at, updated_at,
        supplier:organisations!supplier_id(id, legal_name, trade_name),
        subcategories!subcategory_id(id, name),
        product_images!left(public_url, is_primary)
      `,
      { count: 'exact' }
    );

    // IMPORTANT : Exclure les produits archivés par défaut
    query = query.is('archived_at', null);

    // ✅ RÉGRESSION FIX: Exclure les produits en mode sourcing du catalogue
    query = query.neq('creation_mode', 'sourcing');

    // Filtres selon business rules
    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`
      );
    }

    if (filters.statuses && filters.statuses.length > 0) {
      query = query.in('product_status', filters.statuses as any);
    }

    // ✅ NOUVEAU: Filtre hiérarchique (families → categories → subcategories)
    const hasHierarchyFilter =
      (filters.families?.length ?? 0) > 0 ||
      (filters.categories?.length ?? 0) > 0 ||
      (filters.subcategories?.length ?? 0) > 0;

    if (hasHierarchyFilter) {
      const resolvedSubcategoryIds = await resolveSubcategoryIds(filters);
      if (resolvedSubcategoryIds.length > 0) {
        query = query.in('subcategory_id', resolvedSubcategoryIds);
      } else {
        // Si aucune sous-catégorie résolue mais filtre actif, retourner vide
        return { products: [], total: 0 };
      }
    }

    // Filtre par fournisseurs
    if (filters.suppliers && filters.suppliers.length > 0) {
      query = query.in('supplier_id', filters.suppliers);
    }

    // Pagination - Calcul basé sur page (1-indexed) ou offset
    const limit = filters.limit || ITEMS_PER_PAGE;
    const page = filters.page || 1;
    const offset = filters.offset ?? (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Tri par défaut
    query = query.order('updated_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    // ✅ BR-TECH-002: Enrichir avec primary_image_url depuis product_images
    const enrichedProducts = (data || []).map(product => ({
      ...product,
      primary_image_url:
        product.product_images?.find((img: any) => img.is_primary)
          ?.public_url ||
        product.product_images?.[0]?.public_url ||
        null,
    }));

    return {
      products: enrichedProducts,
      total: count || 0, // ✅ Utiliser le count exact de Supabase
    };
  };

  const loadArchivedProducts = async (filters: CatalogueFilters = {}) => {
    let query = supabase.from('products').select(`
        id, sku, name, slug,
        stock_status, product_status, condition,
        subcategory_id, supplier_id, brand,
        archived_at, created_at, updated_at,
        supplier:organisations!supplier_id(id, legal_name, trade_name),
        subcategories!subcategory_id(id, name),
        product_images!left(public_url, is_primary)
      `);

    // IMPORTANT : Inclure SEULEMENT les produits archivés
    query = query.not('archived_at', 'is', null);

    // Filtres selon business rules
    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`
      );
    }

    if (filters.statuses && filters.statuses.length > 0) {
      query = query.in('product_status', filters.statuses as any);
    }

    // ✅ Filtre hiérarchique (families → categories → subcategories)
    const hasHierarchyFilter =
      (filters.families?.length ?? 0) > 0 ||
      (filters.categories?.length ?? 0) > 0 ||
      (filters.subcategories?.length ?? 0) > 0;

    if (hasHierarchyFilter) {
      const resolvedSubcategoryIds = await resolveSubcategoryIds(filters);
      if (resolvedSubcategoryIds.length > 0) {
        query = query.in('subcategory_id', resolvedSubcategoryIds);
      } else {
        return { products: [], total: 0 };
      }
    }

    // Filtre par fournisseurs
    if (filters.suppliers && filters.suppliers.length > 0) {
      query = query.in('supplier_id', filters.suppliers);
    }

    // Pagination - Optimisé
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);

    // Tri par date d'archivage (plus récent en premier)
    query = query.order('archived_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    // ✅ BR-TECH-002: Enrichir avec primary_image_url depuis product_images
    const enrichedProducts = (data || []).map(product => ({
      ...product,
      primary_image_url:
        product.product_images?.find((img: any) => img.is_primary)
          ?.public_url ||
        product.product_images?.[0]?.public_url ||
        null,
    }));

    return {
      products: enrichedProducts,
      total: enrichedProducts.length,
    };
  };

  // Actions CRUD selon permissions RLS
  const createProduct = async (productData: Partial<Product>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([productData] as any)
        .select()
        .single();

      if (error) throw error;

      // Rafraîchir la liste
      loadCatalogueData();
      return data;
    } catch (error) {
      console.error('Erreur création produit:', error);
      throw error;
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Mise à jour optimiste du state
      setState(prev => ({
        ...prev,
        products: prev.products.map(p =>
          p.id === id ? { ...p, ...updates } : p
        ),
      }));

      return data;
    } catch (error) {
      console.error('Erreur mise à jour produit:', error);
      throw error;
    }
  };

  const archiveProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          product_status: 'discontinued',
          archived_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      // Retirer le produit de la liste active immédiatement
      setState(prev => ({
        ...prev,
        products: prev.products.filter(p => p.id !== id),
        total: prev.total - 1,
      }));

      return true;
    } catch (error) {
      console.error('❌ Erreur archivage produit:', error);
      throw error;
    }
  };

  const unarchiveProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          archived_at: null,
        })
        .eq('id', id);

      if (error) throw error;

      // Recharger les données pour synchroniser les listes
      await loadCatalogueData();

      return true;
    } catch (error) {
      console.error('Erreur restauration produit:', error);
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Erreur Supabase DELETE:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw error;
      }

      // Mise à jour optimiste du state
      setState(prev => ({
        ...prev,
        products: prev.products.filter(p => p.id !== id),
        total: prev.total - 1,
      }));

      console.log('✅ Produit supprimé avec succès:', id);
      return true;
    } catch (error) {
      console.error('❌ Erreur suppression produit:', error);
      // Log plus détaillé de l'erreur
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  };

  // ✅ FIX P0-2: setFilters utilise maintenant state séparé
  const setFilters = (newFilters: Partial<CatalogueFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  };

  // ✅ FIX P0-2: resetFilters utilise maintenant state séparé
  const resetFilters = () => {
    setFiltersState({});
  };

  // ✅ PAGINATION: Calculs de pagination
  const currentPage = filters.page || 1;
  const totalPages = Math.ceil(state.total / ITEMS_PER_PAGE);
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        setFiltersState(prev => ({ ...prev, page }));
      }
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      goToPage(currentPage + 1);
    }
  }, [hasNextPage, currentPage, goToPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      goToPage(currentPage - 1);
    }
  }, [hasPreviousPage, currentPage, goToPage]);

  return {
    // État
    ...state,
    filters, // ✅ FIX P0-2: Exposer filters séparé

    // Actions
    loadCatalogueData,
    loadArchivedProducts,
    createProduct,
    updateProduct,
    archiveProduct,
    unarchiveProduct,
    deleteProduct,
    setFilters,
    resetFilters,

    // ✅ PAGINATION: Exposer état et actions de pagination
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    nextPage,
    previousPage,
    itemsPerPage: ITEMS_PER_PAGE,

    // Helpers
    getProductsBySubcategory: (subcategoryId: string) =>
      state.products.filter(p => p.subcategory_id === subcategoryId),

    getCategoryById: (id: string) => state.categories.find(c => c.id === id),

    // ✅ FIX 3.3: Stats utiles - MÉMORISÉES pour éviter recalcul à chaque render
    stats: useMemo(
      () => ({
        totalProducts: state.total, // Utiliser total réel, pas length de page
        inStock: state.products.filter(p => p.stock_status === 'in_stock')
          .length,
        outOfStock: state.products.filter(
          p => p.stock_status === 'out_of_stock'
        ).length,
        preorder: state.products.filter(p => p.product_status === 'preorder')
          .length,
        comingSoon: state.products.filter(p => p.stock_status === 'coming_soon')
          .length,
      }),
      [state.products, state.total]
    ), // ✅ Recalculer seulement quand products change
  };
};

// Export types already exported via export interface above
export type { ProductGroup, CatalogueFilters, CatalogueState };
