'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import type { Product } from '@verone/categories';
import {
  useCatalogue,
  useFamilies,
  useCategories,
  useSubcategories,
} from '@verone/categories';
import { useOrganisations } from '@verone/organisations';
import { useProductImagesBatch } from '@verone/products';
import { checkSLOCompliance, debounce } from '@verone/utils';
import { toast } from 'sonner';

import type { FilterState } from '@/components/catalogue/CatalogueFilterPanel';

import type { Filters } from './types';
import { useQuickEdit } from './use-quick-edit';
import { useCatalogueTabs } from './use-catalogue-tabs';

export function useCataloguePage() {
  const startTime = Date.now();
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    products,
    loading,
    error,
    total,
    setFilters: setCatalogueFilters,
    loadArchivedProducts,
    loadIncompleteProducts,
    archiveProduct,
    unarchiveProduct,
    deleteProduct,
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    nextPage,
    previousPage,
    itemsPerPage,
  } = useCatalogue();

  const { families } = useFamilies();
  const { allCategories } = useCategories();
  const { subcategories } = useSubcategories();

  const { organisations: allSuppliers } = useOrganisations({
    type: 'supplier',
    is_active: true,
  });

  const productIds = products.map(p => p.id);
  const { getPrimaryImage } = useProductImagesBatch(productIds);

  // Helper pour lire les filtres depuis l'URL
  const parseUrlFilters = useCallback(
    (): Filters => ({
      search: searchParams.get('q') ?? '',
      families: searchParams.get('families')?.split(',').filter(Boolean) ?? [],
      categories:
        searchParams.get('categories')?.split(',').filter(Boolean) ?? [],
      subcategories:
        searchParams.get('subcategories')?.split(',').filter(Boolean) ?? [],
      suppliers:
        searchParams.get('suppliers')?.split(',').filter(Boolean) ?? [],
      statuses: searchParams.get('statuses')?.split(',').filter(Boolean) ?? [],
      missingFields:
        searchParams.get('missing')?.split(',').filter(Boolean) ?? [],
    }),
    [searchParams]
  );

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(
    () => searchParams.get('q') ?? ''
  );
  const [filters, setFilters] = useState<Filters>(parseUrlFilters);

  const filtersRef = useRef<Record<string, unknown>>(
    filters as unknown as Record<string, unknown>
  );
  const loadArchivedProductsRef = useRef(loadArchivedProducts);
  const loadIncompleteProductsRef = useRef(loadIncompleteProducts);

  const tabs = useCatalogueTabs({
    itemsPerPage,
    loadArchivedProductsRef,
    loadIncompleteProductsRef,
    filtersRef,
  });

  // Set activeTab from URL param on mount
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'incomplete' || tab === 'archived') tabs.setActiveTab(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- One-time init from URL
  }, []);

  // Helper pour synchroniser filtres vers URL
  const syncFiltersToUrl = useCallback(
    (newFilters: Filters, tab?: string) => {
      const params = new URLSearchParams();
      if (newFilters.search) params.set('q', newFilters.search);
      if (tab && tab !== 'active') params.set('tab', tab);
      if (newFilters.families.length)
        params.set('families', newFilters.families.join(','));
      if (newFilters.categories.length)
        params.set('categories', newFilters.categories.join(','));
      if (newFilters.subcategories.length)
        params.set('subcategories', newFilters.subcategories.join(','));
      if (newFilters.suppliers.length)
        params.set('suppliers', newFilters.suppliers.join(','));
      if (newFilters.statuses.length)
        params.set('statuses', newFilters.statuses.join(','));
      if (newFilters.missingFields.length)
        params.set('missing', newFilters.missingFields.join(','));

      const qs = params.toString();
      router.replace(qs ? `?${qs}` : '/produits/catalogue', { scroll: false });
    },
    [router]
  );

  // Synchronise filtres vers useCatalogue + URL
  const applyFilters = useCallback(
    (newFilters: Filters, tab?: string) => {
      setFilters(newFilters);
      setCatalogueFilters({
        search: newFilters.search,
        families: newFilters.families,
        categories: newFilters.categories,
        subcategories: newFilters.subcategories,
        suppliers: newFilters.suppliers,
        statuses: newFilters.statuses,
        missingFields: newFilters.missingFields,
        page: 1,
      });
      syncFiltersToUrl(newFilters, tab ?? tabs.activeTab);
      const currentTab = tab ?? tabs.activeTab;
      if (currentTab === 'incomplete') {
        tabs.triggerIncompleteReload();
      }
    },
    [setCatalogueFilters, syncFiltersToUrl, tabs]
  );

  // Initialiser les filtres depuis l'URL au premier rendu
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      const urlFilters = parseUrlFilters();
      const hasUrlFilters =
        urlFilters.search !== '' ||
        urlFilters.families.length > 0 ||
        urlFilters.categories.length > 0 ||
        urlFilters.subcategories.length > 0 ||
        urlFilters.suppliers.length > 0 ||
        urlFilters.statuses.length > 0 ||
        urlFilters.missingFields.length > 0;

      if (hasUrlFilters) {
        setCatalogueFilters({
          search: urlFilters.search,
          families: urlFilters.families,
          categories: urlFilters.categories,
          subcategories: urlFilters.subcategories,
          suppliers: urlFilters.suppliers,
          statuses: urlFilters.statuses,
          missingFields: urlFilters.missingFields,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- One-time init from URL
  }, []);

  // Garder les refs à jour
  useEffect(() => {
    filtersRef.current = filters as unknown as Record<string, unknown>;
    loadArchivedProductsRef.current = loadArchivedProducts;
    loadIncompleteProductsRef.current = loadIncompleteProducts;
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const debouncedSearch = useMemo(
    () =>
      debounce((searchTerm: string) => {
        const newFilters = {
          ...(filtersRef.current as unknown as Filters),
          search: searchTerm,
        };
        applyFilters(newFilters);
      }, 300),
    [applyFilters]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearch(value);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    const newFilters = { ...filters, search: '' };
    applyFilters(newFilters);
  };

  const handleResetAllFilters = () => {
    setSearchInput('');
    const emptyFilters: Filters = {
      search: '',
      families: [],
      categories: [],
      subcategories: [],
      suppliers: [],
      statuses: [],
      missingFields: [],
    };
    applyFilters(emptyFilters);
  };

  const hasActiveFilters =
    filters.search !== '' ||
    filters.families.length > 0 ||
    filters.categories.length > 0 ||
    filters.subcategories.length > 0 ||
    filters.suppliers.length > 0 ||
    filters.statuses.length > 0 ||
    filters.missingFields.length > 0;

  const searchItems = useMemo(() => {
    return products.map(product => ({
      id: product.id,
      type: 'product' as const,
      title: product.name,
      subtitle: product.sku ?? undefined,
      url: `/produits/${product.id}`,
    }));
  }, [products]);

  const handleSearchSelect = (item: { url: string }) => {
    router.push(item.url);
    setPaletteOpen(false);
  };

  const handleFiltersChange = (newFilterState: FilterState) => {
    const newFilters: Filters = {
      search: newFilterState.search,
      families: newFilterState.families,
      categories: newFilterState.categories,
      subcategories: newFilterState.subcategories,
      suppliers: newFilterState.suppliers,
      statuses: newFilterState.statuses,
      missingFields: filters.missingFields,
    };
    applyFilters(newFilters);
  };

  const handleProductUpdated = useCallback(async () => {
    if (tabs.activeTab === 'incomplete') {
      try {
        const result = await loadIncompleteProductsRef.current({
          ...(filtersRef.current as unknown as Filters),
          page: tabs.incompletePage,
        });
        tabs.setIncompleteProducts(result.products);
        tabs.setIncompleteTotal(result.total);
      } catch (err) {
        console.error('[Catalogue] Refresh incompletes failed:', err);
      }
    }
  }, [tabs]);

  const quickEdit = useQuickEdit({
    subcategories,
    allSuppliers,
    onProductUpdated: async () => {
      quickEdit.setQuickEditTarget(null);
      await handleProductUpdated();
    },
  });

  const handleArchiveProduct = async (product: Product) => {
    try {
      if (product.archived_at) {
        await unarchiveProduct(product.id);
        console.warn('Produit restauré:', product.name);
        if (tabs.activeTab === 'archived') {
          const result = await loadArchivedProductsRef.current(
            filtersRef.current
          );
          tabs.setArchivedProducts(result.products);
        }
      } else {
        await archiveProduct(product.id);
        console.warn('Produit archivé:', product.name);
        if (tabs.activeTab === 'incomplete') {
          tabs.setIncompleteProducts(prev =>
            prev.filter(p => p.id !== product.id)
          );
        }
        if (tabs.activeTab === 'archived') {
          const result = await loadArchivedProductsRef.current(
            filtersRef.current
          );
          tabs.setArchivedProducts(result.products);
        }
        toast.success('Produit archivé', {
          description: `${product.name ?? 'Ce produit'} a été archivé.`,
        });
      }
    } catch (error) {
      console.error('Erreur archivage produit:', error);
      toast.error("Impossible d'archiver le produit.");
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    const confirmed = confirm(
      `Êtes-vous sûr de vouloir supprimer définitivement "${product.name}" ?\n\nCette action est irréversible !`
    );
    if (confirmed) {
      try {
        await deleteProduct(product.id);
        console.warn('Produit supprimé définitivement:', product.name);
      } catch (error) {
        console.error('Erreur suppression produit:', error);
      }
    }
  };

  const dashboardSLO = checkSLOCompliance(startTime, 'dashboard');

  return {
    // Data
    products,
    loading,
    error,
    total,
    // Hierarchy data
    families,
    allCategories,
    subcategories,
    allSuppliers,
    // Images
    getPrimaryImage,
    // UI state
    viewMode,
    setViewMode,
    paletteOpen,
    setPaletteOpen,
    searchInput,
    filters,
    // Pagination active tab
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    nextPage,
    previousPage,
    itemsPerPage,
    // SLO
    dashboardSLO,
    // Handlers
    handleSearchChange,
    handleClearSearch,
    handleResetAllFilters,
    hasActiveFilters,
    searchItems,
    handleSearchSelect,
    handleFiltersChange,
    applyFilters,
    syncFiltersToUrl,
    handleArchiveProduct,
    handleDeleteProduct,
    // Refs needed by page for ProductPhotosModal
    filtersRef,
    loadIncompleteProductsRef,
    handleProductUpdated,
    // Tabs state (spread from useCatalogueTabs)
    ...tabs,
    // Quick edit (spread from useQuickEdit)
    ...quickEdit,
  };
}
