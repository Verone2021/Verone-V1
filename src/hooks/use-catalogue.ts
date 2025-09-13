/**
 * Hook Catalogue Vérone - Gestion état et API
 * Intégration Supabase avec RLS selon roles-permissions-v1.md
 * Performance: <2s dashboard selon SLOs
 */

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

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

interface Product {
  id: string;
  product_group_id: string;
  sku: string;
  name: string;
  slug: string;
  price_ht: number; // Prix en centimes
  cost_price?: number;
  tax_rate: number;
  status: 'in_stock' | 'out_of_stock' | 'preorder' | 'coming_soon' | 'discontinued';
  condition: 'new' | 'refurbished' | 'used';
  variant_attributes: Record<string, any>;
  dimensions?: Record<string, any>;
  weight?: number;
  primary_image_url: string;
  gallery_images: string[];
  video_url?: string;
  supplier_reference?: string;
  gtin?: string;
  created_at: string;
  updated_at: string;
}

interface Category {
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
  categories?: string[];
  statuses?: string[];
  priceMin?: number;
  priceMax?: number;
  limit?: number;
  offset?: number;
}

interface CatalogueState {
  productGroups: ProductGroup[];
  products: Product[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  filters: CatalogueFilters;
  total: number;
}

// Configuration Supabase (remplacer par variables d'environnement)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const useCatalogue = () => {
  const [state, setState] = useState<CatalogueState>({
    productGroups: [],
    products: [],
    categories: [],
    loading: true,
    error: null,
    filters: {},
    total: 0
  });

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Chargement initial des données
  useEffect(() => {
    loadCatalogueData();
  }, [state.filters]);

  const loadCatalogueData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Performance monitoring pour SLO <2s
      const startTime = performance.now();

      // Chargement parallèle pour optimiser performance
      const [categoriesResult, productsResult] = await Promise.all([
        loadCategories(),
        loadProducts(state.filters)
      ]);

      const loadTime = performance.now() - startTime;
      if (loadTime > 2000) {
        console.warn(`⚠️ SLO dashboard dépassé: ${Math.round(loadTime)}ms > 2000ms`);
      }

      setState(prev => ({
        ...prev,
        categories: categoriesResult,
        products: productsResult.products,
        total: productsResult.total,
        loading: false
      }));

    } catch (error) {
      console.error('Erreur chargement catalogue:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        loading: false
      }));
    }
  };

  const loadCategories = async (): Promise<Category[]> => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('level', { ascending: true })
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  };

  const loadProducts = async (filters: CatalogueFilters = {}) => {
    let query = supabase
      .from('products')
      .select(`
        *,
        product_groups!inner(
          id,
          name,
          category_id,
          status
        )
      `, { count: 'exact' });

    // Filtres selon business rules
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
    }

    if (filters.statuses && filters.statuses.length > 0) {
      query = query.in('status', filters.statuses);
    }

    if (filters.categories && filters.categories.length > 0) {
      query = query.in('product_groups.category_id', filters.categories);
    }

    if (filters.priceMin !== undefined) {
      query = query.gte('price_ht', filters.priceMin * 100); // Conversion euros -> centimes
    }

    if (filters.priceMax !== undefined) {
      query = query.lte('price_ht', filters.priceMax * 100);
    }

    // Pagination
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);

    // Tri par défaut
    query = query.order('updated_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      products: data || [],
      total: count || 0
    };
  };

  // Actions CRUD selon permissions RLS
  const createProduct = async (productData: Partial<Product>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
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
        )
      }));

      return data;

    } catch (error) {
      console.error('Erreur mise à jour produit:', error);
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Mise à jour optimiste du state
      setState(prev => ({
        ...prev,
        products: prev.products.filter(p => p.id !== id),
        total: prev.total - 1
      }));

    } catch (error) {
      console.error('Erreur suppression produit:', error);
      throw error;
    }
  };

  const setFilters = (newFilters: Partial<CatalogueFilters>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters }
    }));
  };

  const resetFilters = () => {
    setState(prev => ({
      ...prev,
      filters: {}
    }));
  };

  return {
    // État
    ...state,

    // Actions
    loadCatalogueData,
    createProduct,
    updateProduct,
    deleteProduct,
    setFilters,
    resetFilters,

    // Helpers
    getProductsByCategory: (categoryId: string) =>
      state.products.filter(p => p.product_groups?.category_id === categoryId),

    getCategoryById: (id: string) =>
      state.categories.find(c => c.id === id),

    // Stats utiles
    stats: {
      totalProducts: state.products.length,
      inStock: state.products.filter(p => p.status === 'in_stock').length,
      outOfStock: state.products.filter(p => p.status === 'out_of_stock').length,
      preorder: state.products.filter(p => p.status === 'preorder').length,
      comingSoon: state.products.filter(p => p.status === 'coming_soon').length
    }
  };
};

export type { Product, ProductGroup, Category, CatalogueFilters, CatalogueState };