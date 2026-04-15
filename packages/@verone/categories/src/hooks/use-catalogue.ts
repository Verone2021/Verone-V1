/**
 * Hook Catalogue Vérone - Gestion état et API
 * Intégration Supabase avec RLS selon roles-permissions-v1.md
 * Performance: <2s dashboard selon SLOs
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

import type {
  CatalogueFilters,
  CatalogueState,
  Product,
} from './catalogue-types';
import { ITEMS_PER_PAGE } from './catalogue-types';
import {
  loadCategories,
  loadProducts,
  loadArchivedProducts,
  loadIncompleteProducts,
} from './use-catalogue-data';
import {
  createProduct as createProductMutation,
  updateProduct as updateProductMutation,
  archiveProduct as archiveProductMutation,
  unarchiveProduct as unarchiveProductMutation,
  deleteProduct as deleteProductMutation,
} from './use-catalogue-mutations';

export const useCatalogue = () => {
  const [filters, setFiltersState] = useState<CatalogueFilters>({});

  const [state, setState] = useState<CatalogueState>({
    productGroups: [],
    products: [],
    categories: [],
    loading: true,
    error: null,
    total: 0,
  });

  const loadCatalogueData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const startTime = performance.now();

      const [categoriesResult, productsResult] = await Promise.all([
        loadCategories(),
        loadProducts(filters, ITEMS_PER_PAGE),
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
        products: productsResult.products as Product[],
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadCategories and loadProducts are stable async functions
  }, [filters]);

  useEffect(() => {
    void loadCatalogueData().catch(err => {
      console.error('[useCatalogue] loadCatalogueData failed:', err);
    });
  }, [loadCatalogueData]);

  // CRUD
  const createProduct = async (productData: Partial<Product>) => {
    try {
      return await createProductMutation(productData, () => {
        void loadCatalogueData().catch(err => {
          console.error('[useCatalogue] Refresh after create failed:', err);
        });
      });
    } catch (error) {
      console.error('Erreur création produit:', error);
      throw error;
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      return await updateProductMutation(id, updates, (pid, upd) => {
        setState(prev => ({
          ...prev,
          products: prev.products.map(p =>
            p.id === pid ? { ...p, ...upd } : p
          ),
        }));
      });
    } catch (error) {
      console.error('Erreur mise à jour produit:', error);
      throw error;
    }
  };

  const archiveProduct = async (id: string) => {
    try {
      return await archiveProductMutation(id, pid => {
        setState(prev => ({
          ...prev,
          products: prev.products.filter(p => p.id !== pid),
          total: prev.total - 1,
        }));
      });
    } catch (error) {
      console.error('Erreur archivage produit:', error);
      throw error;
    }
  };

  const unarchiveProduct = async (id: string) => {
    try {
      return await unarchiveProductMutation(id, loadCatalogueData);
    } catch (error) {
      console.error('Erreur restauration produit:', error);
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      return await deleteProductMutation(id, pid => {
        setState(prev => ({
          ...prev,
          products: prev.products.filter(p => p.id !== pid),
          total: prev.total - 1,
        }));
      });
    } catch (error) {
      console.error('Erreur suppression produit:', error);
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
      }
      throw error;
    }
  };

  const setFilters = useCallback((newFilters: Partial<CatalogueFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState({});
  }, []);

  const currentPage = filters.page ?? 1;
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
    if (hasNextPage) goToPage(currentPage + 1);
  }, [hasNextPage, currentPage, goToPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) goToPage(currentPage - 1);
  }, [hasPreviousPage, currentPage, goToPage]);

  return {
    ...state,
    filters,
    loadCatalogueData,
    loadArchivedProducts,
    loadIncompleteProducts,
    createProduct,
    updateProduct,
    archiveProduct,
    unarchiveProduct,
    deleteProduct,
    setFilters,
    resetFilters,
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    nextPage,
    previousPage,
    itemsPerPage: ITEMS_PER_PAGE,
    getProductsBySubcategory: (subcategoryId: string) =>
      state.products.filter(p => p.subcategory_id === subcategoryId),
    getCategoryById: (id: string) => state.categories.find(c => c.id === id),
    stats: useMemo(
      () => ({
        totalProducts: state.total,
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
    ),
  };
};

export type {
  Product,
  CatalogueFilters,
  CatalogueState,
} from './catalogue-types';
export type { Category } from './catalogue-types';
