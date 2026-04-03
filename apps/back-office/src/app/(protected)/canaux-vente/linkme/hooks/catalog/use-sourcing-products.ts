/**
 * Hook pour les produits sur mesure (sourcés) du catalogue LinkMe
 */

import { useQuery } from '@tanstack/react-query';
import { fetchSourcingProducts } from './fetchers-detail';

/**
 * Hook: récupère les produits sur mesure (sourcés)
 * Produits avec enseigne_id ou assigned_client_id
 * Utilisé pour l'onglet "Produits sur mesure" dans le catalogue LinkMe
 */
export function useSourcingProducts() {
  return useQuery({
    queryKey: ['linkme-sourcing-products'],
    queryFn: fetchSourcingProducts,
    staleTime: 300_000,
    refetchOnWindowFocus: true,
  });
}
