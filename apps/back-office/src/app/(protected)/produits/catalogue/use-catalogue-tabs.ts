'use client';

import { useState, useEffect, useMemo } from 'react';

import type { Product } from '@verone/categories';
import { useProductImagesBatch } from '@verone/products';

type LoadArchivedProducts = (
  filters: Record<string, unknown>
) => Promise<{ products: unknown[]; total: number }>;

type LoadIncompleteProducts = (
  filters: Record<string, unknown>
) => Promise<{ products: unknown[]; total: number }>;

interface UseCatalogueTabsOptions {
  itemsPerPage: number;
  loadArchivedProductsRef: React.MutableRefObject<LoadArchivedProducts>;
  loadIncompleteProductsRef: React.MutableRefObject<LoadIncompleteProducts>;
  filtersRef: React.MutableRefObject<Record<string, unknown>>;
}

export function useCatalogueTabs({
  itemsPerPage,
  loadArchivedProductsRef,
  loadIncompleteProductsRef,
  filtersRef,
}: UseCatalogueTabsOptions) {
  const [archivedProducts, setArchivedProducts] = useState<Product[]>([]);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [incompleteProducts, setIncompleteProducts] = useState<Product[]>([]);
  const [incompleteTotal, setIncompleteTotal] = useState(0);
  const [incompleteLoading, setIncompleteLoading] = useState(false);
  const [incompletePage, setIncompletePage] = useState(1);
  const [incompleteReloadKey, setIncompleteReloadKey] = useState(0);
  const [activeTab, setActiveTab] = useState<
    'active' | 'incomplete' | 'archived'
  >('active');

  const incompleteProductIds = useMemo(
    () => incompleteProducts.map(p => p.id),
    [incompleteProducts]
  );
  const { getPrimaryImage: getIncompletePrimaryImage } =
    useProductImagesBatch(incompleteProductIds);

  // Charger le compteur incomplets au montage
  useEffect(() => {
    const loadCount = async () => {
      try {
        const result = await loadIncompleteProductsRef.current({ limit: 1 });
        setIncompleteTotal(result.total);
      } catch (error) {
        console.error('Erreur compteur incomplets:', error);
      }
    };
    void loadCount().catch(() => {
      /* handled above */
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refs are stable
  }, []);

  // Charger les produits archivés/incomplets quand on change d'onglet
  useEffect(() => {
    if (activeTab === 'archived') {
      const loadData = async () => {
        setArchivedLoading(true);
        try {
          const result = await loadArchivedProductsRef.current(
            filtersRef.current
          );
          setArchivedProducts(result.products as Product[]);
        } catch (error) {
          console.error('Erreur chargement produits archivés:', error);
        } finally {
          setArchivedLoading(false);
        }
      };
      void loadData().catch(error => {
        console.error('[Catalogue] loadData failed:', error);
      });
    }

    if (activeTab === 'incomplete') {
      const loadData = async () => {
        setIncompleteLoading(true);
        try {
          const result = await loadIncompleteProductsRef.current({
            ...filtersRef.current,
            page: incompletePage,
          });
          setIncompleteProducts(result.products as Product[]);
          setIncompleteTotal(result.total);
        } catch (error) {
          console.error('Erreur chargement produits incomplets:', error);
        } finally {
          setIncompleteLoading(false);
        }
      };
      void loadData().catch(error => {
        console.error('[Catalogue] loadIncomplete failed:', error);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refs are stable, incompleteReloadKey triggers reload
  }, [activeTab, incompletePage, incompleteReloadKey]);

  // Pagination incomplete tab
  const incompleteTotalPages = Math.max(
    1,
    Math.ceil(incompleteTotal / itemsPerPage)
  );
  const incompleteHasNextPage = incompletePage < incompleteTotalPages;
  const incompleteHasPreviousPage = incompletePage > 1;

  const triggerIncompleteReload = () => {
    setIncompletePage(1);
    setIncompleteReloadKey(k => k + 1);
  };

  return {
    activeTab,
    setActiveTab,
    archivedProducts,
    setArchivedProducts,
    archivedLoading,
    incompleteProducts,
    setIncompleteProducts,
    incompleteTotal,
    setIncompleteTotal,
    incompleteLoading,
    incompletePage,
    setIncompletePage,
    incompleteTotalPages,
    incompleteHasNextPage,
    incompleteHasPreviousPage,
    getIncompletePrimaryImage,
    triggerIncompleteReload,
  };
}
