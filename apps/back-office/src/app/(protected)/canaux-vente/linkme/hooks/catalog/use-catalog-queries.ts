/**
 * Hooks query pour le catalogue LinkMe (liste, éligibles, stats)
 */

import { useQuery } from '@tanstack/react-query';
import {
  fetchLinkMeCatalogProducts,
  fetchEligibleProducts,
} from './fetchers-list';

/**
 * Hook: récupère les produits du catalogue LinkMe
 */
export function useLinkMeCatalogProducts() {
  return useQuery({
    queryKey: ['linkme-catalog-products'],
    queryFn: fetchLinkMeCatalogProducts,
    staleTime: 300_000,
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook: récupère les produits éligibles (tous produits actifs)
 */
export function useEligibleProducts() {
  return useQuery({
    queryKey: ['linkme-eligible-products'],
    queryFn: fetchEligibleProducts,
    staleTime: 60000,
  });
}

/**
 * Hook: statistiques du catalogue
 */
export function useLinkMeCatalogStats() {
  return useQuery({
    queryKey: ['linkme-catalog-stats'],
    queryFn: async () => {
      const products = await fetchLinkMeCatalogProducts();

      if (!products) return null;

      const enabled = products.filter(p => p.is_enabled).length;
      const showcase = products.filter(p => p.is_public_showcase).length;
      const featured = products.filter(p => p.is_featured).length;

      return {
        total: products.length,
        enabled,
        showcase,
        featured,
        enabledPercentage:
          products.length > 0 ? (enabled / products.length) * 100 : 0,
      };
    },
    staleTime: 60000,
  });
}
