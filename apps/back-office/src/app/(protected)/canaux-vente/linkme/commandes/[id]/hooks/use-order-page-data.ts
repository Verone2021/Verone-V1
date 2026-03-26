/**
 * Hook: useOrderPageData
 *
 * Agrege state, fetching et handlers pour la page detail commande LinkMe.
 * Retourne tout ce dont le composant a besoin pour render.
 */

import { useCallback, useEffect, useState } from 'react';

import { useOrderHistory, type OrderHistoryEvent } from '@verone/orders';

import {
  useOrganisationContactsBO,
  useEnseigneContactsBO,
  type ContactBO,
} from '../../../hooks/use-organisation-contacts-bo';

import type { OrderWithDetails, EnrichedOrderItem } from '../components/types';

import { fetchOrderById } from '../utils/fetch-order';
import { useOrderPageState } from './use-order-page-state';
import { useOrderPageHandlers } from './use-order-page-handlers';

export interface OrderPageData {
  order: OrderWithDetails | null;
  enrichedItems: EnrichedOrderItem[];
  isLoading: boolean;
  error: string | null;
  availableContacts: ContactBO[];
  historyEvents: OrderHistoryEvent[];
  historyLoading: boolean;
  pageState: ReturnType<typeof useOrderPageState>;
  handlers: ReturnType<typeof useOrderPageHandlers>;
}

export function useOrderPageData(orderId: string): OrderPageData {
  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [enrichedItems, setEnrichedItems] = useState<EnrichedOrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { events: historyEvents, loading: historyLoading } =
    useOrderHistory(orderId);

  const pageState = useOrderPageState();

  const enseigneId = order?.organisation?.enseigne_id ?? null;
  const organisationId = order?.organisation?.id ?? null;
  const ownerType = order?.linkmeDetails?.owner_type;
  const isSuccursale = ownerType === 'propre' || ownerType === 'succursale';

  const { data: enseigneContactsData } = useEnseigneContactsBO(
    isSuccursale ? enseigneId : null
  );
  const { data: orgContactsData } = useOrganisationContactsBO(
    !isSuccursale ? organisationId : null
  );
  const availableContacts: ContactBO[] =
    (isSuccursale
      ? enseigneContactsData?.contacts
      : orgContactsData?.contacts) ?? [];

  const doFetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchOrderById(orderId);
      setOrder(result.order);
      setEnrichedItems(result.enrichedItems);
    } catch (err) {
      console.error('[useOrderPageData] Fetch failed:', err);
      setError(
        err instanceof Error ? err.message : 'Erreur lors du chargement'
      );
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  const refetch = useCallback(() => {
    void doFetch().catch(err => {
      console.error('[useOrderPageData] Refetch failed:', err);
    });
  }, [doFetch]);

  useEffect(() => {
    if (orderId) refetch();
  }, [orderId, refetch]);

  const handlers = useOrderPageHandlers({
    orderId,
    order,
    isSuccursale,
    organisationId,
    enseigneId,
    pageState,
    refetch,
  });

  return {
    order,
    enrichedItems,
    isLoading,
    error,
    availableContacts,
    historyEvents,
    historyLoading,
    pageState,
    handlers,
  };
}
