'use client';

/**
 * useSalesOrdersQuery — lecture seule via cache TanStack Query
 *
 * [BO-PERF-TANSTACK-001] Hook léger pour les consumers qui ont besoin
 * de la liste des commandes en lecture seule (sans mutations).
 *
 * Le cache ['sales_orders', 'list'] est alimenté par useFetchOrdersList
 * chaque fois que fetchOrders() est appelé sans filtres. Ce hook retourne
 * les données directement depuis le cache — aucun refetch si les données
 * sont fraîches (staleTime 30s).
 *
 * Usage :
 *   const { data: orders = [], isLoading } = useSalesOrdersQuery();
 *
 * Règle : NE PAS utiliser pour les pages avec mutations — utiliser
 * useSalesOrders() à la place qui expose fetchOrders, updateStatus, etc.
 */

import { useQuery } from '@tanstack/react-query';

import type { SalesOrder } from './types/sales-order.types';

export function useSalesOrdersQuery() {
  return useQuery<SalesOrder[]>({
    queryKey: ['sales_orders', 'list'],
    // Pas de queryFn : ce hook consomme uniquement le cache alimenté par
    // useFetchOrdersList → fetchOrders(). Si le cache est vide (page
    // visitée sans passer par SalesOrdersTable), retourne [].
    queryFn: () => Promise.resolve([] as SalesOrder[]),
    staleTime: 30_000,
    // initialData vide — le cache est peuplé par les instances qui ont
    // un useSalesOrders() avec fetchOrders() actif.
    initialData: [],
  });
}
