/**
 * Hook: useLinkMeOrders
 * Gestion des commandes LinkMe
 * =====================================================
 * CORRECTIF 2025-12-07 : Mapping DB corrigé
 * - customer_id au lieu de customer_organisation_id/individual_customer_id
 * - order_number généré via generate_so_number
 * - created_by récupéré depuis la session
 * =====================================================
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchLinkMeOrders,
  fetchLinkMeOrderById,
} from './use-linkme-orders.fetchers';
import {
  createLinkMeOrder,
  updateLinkMeOrder,
} from './use-linkme-orders.mutations';

export { LINKME_CHANNEL_ID } from './use-linkme-orders.types';
export type {
  LinkMeOrder,
  LinkMeOrderItem,
  LinkMeOrderItemInput,
  CreateLinkMeOrderInput,
  UpdateLinkMeOrderInput,
  LinkMeDetailsInput,
} from './use-linkme-orders.types';

/**
 * Hook: récupère les commandes LinkMe
 */
export function useLinkMeOrders() {
  return useQuery({
    queryKey: ['linkme-orders'],
    queryFn: fetchLinkMeOrders,
    staleTime: 300_000,
  });
}

/**
 * Hook: créer une commande LinkMe
 */
export function useCreateLinkMeOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLinkMeOrder,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['linkme-orders'] }),
        queryClient.invalidateQueries({ queryKey: ['sales-orders'] }),
      ]);
    },
  });
}

/**
 * Hook: récupère une commande LinkMe par ID
 */
export function useLinkMeOrder(orderId: string | null) {
  return useQuery({
    queryKey: ['linkme-order', orderId],
    queryFn: () => fetchLinkMeOrderById(orderId!),
    enabled: !!orderId,
    staleTime: 300_000,
  });
}

/**
 * Hook: mettre à jour une commande LinkMe
 */
export function useUpdateLinkMeOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateLinkMeOrder,
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['linkme-orders'] }),
        queryClient.invalidateQueries({
          queryKey: ['linkme-order', variables.id],
        }),
        queryClient.invalidateQueries({ queryKey: ['sales-orders'] }),
      ]);
    },
  });
}
