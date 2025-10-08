/**
 * Hook Catalogue Vérone - Gestion état et API
 * Intégration Supabase avec RLS selon roles-permissions-v1.md
 * Performance: <2s dashboard selon SLOs
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '../lib/supabase/client';

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
  archived_at?: string | null;
  created_at: string;
  updated_at: string;
  // Nouvelles relations directes
  subcategory_id?: string;
  brand?: string;
  supplier_id?: string;
  supplier?: {
    id: string;
    name: string;
  };
  subcategories?: {
    id: string;
    name: string;
  };
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
  subcategories?: string[]; // Filtre par sous-catégories
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

  const supabase = useMemo(() => createClient(), []);

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
      .select('id, name, slug, level, parent_id, display_order, is_active')
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
        id, sku, name, slug,
        price_ht, cost_price, tax_rate,
        status, condition,
        primary_image_url,
        subcategory_id, supplier_id, brand,
        archived_at, created_at, updated_at,
        supplier:organisations!supplier_id(id, name),
        subcategories!subcategory_id(id, name)
      `, { count: 'exact' });

    // IMPORTANT : Exclure les produits archivés par défaut
    query = query.is('archived_at', null);

    // Filtres selon business rules
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
    }

    if (filters.statuses && filters.statuses.length > 0) {
      query = query.in('status', filters.statuses);
    }

    if (filters.subcategories && filters.subcategories.length > 0) {
      query = query.in('subcategory_id', filters.subcategories);
    }

    if (filters.priceMin !== undefined) {
      query = query.gte('price_ht', filters.priceMin); // Prix en euros NUMERIC(10,2)
    }

    if (filters.priceMax !== undefined) {
      query = query.lte('price_ht', filters.priceMax); // Prix en euros NUMERIC(10,2)
    }

    // Pagination - Augmenté pour afficher tous les produits importés
    const limit = filters.limit || 500; // Support jusqu'à 500 produits (largement suffisant pour les 241 importés)
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
  };;
  
  const loadArchivedProducts = async (filters: CatalogueFilters = {}) => {
    let query = supabase
      .from('products')
      .select(`
        id, sku, name, slug,
        price_ht, cost_price, tax_rate,
        status, condition,
        primary_image_url,
        subcategory_id, supplier_id, brand,
        archived_at, created_at, updated_at,
        supplier:organisations!supplier_id(id, name),
        subcategories!subcategory_id(id, name)
      `, { count: 'exact' });

    // IMPORTANT : Inclure SEULEMENT les produits archivés
    query = query.not('archived_at', 'is', null);

    // Filtres selon business rules
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
    }

    if (filters.statuses && filters.statuses.length > 0) {
      query = query.in('status', filters.statuses);
    }

    if (filters.subcategories && filters.subcategories.length > 0) {
      query = query.in('subcategory_id', filters.subcategories);
    }

    if (filters.priceMin !== undefined) {
      query = query.gte('price_ht', filters.priceMin);
    }

    if (filters.priceMax !== undefined) {
      query = query.lte('price_ht', filters.priceMax);
    }

    // Pagination
    const limit = filters.limit || 500;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);

    // Tri par date d'archivage (plus récent en premier)
    query = query.order('archived_at', { ascending: false });

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

  const archiveProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          status: 'discontinued',
          archived_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Retirer le produit de la liste active immédiatement
      setState(prev => ({
        ...prev,
        products: prev.products.filter(p => p.id !== id),
        total: prev.total - 1
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
          archived_at: null
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

      return true;

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
    loadArchivedProducts,
    createProduct,
    updateProduct,
    archiveProduct,
    unarchiveProduct,
    deleteProduct,
    setFilters,
    resetFilters,

    // Helpers
    getProductsBySubcategory: (subcategoryId: string) =>
      state.products.filter(p => p.subcategory_id === subcategoryId),

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
};;

export type { Product, ProductGroup, Category, CatalogueFilters, CatalogueState };