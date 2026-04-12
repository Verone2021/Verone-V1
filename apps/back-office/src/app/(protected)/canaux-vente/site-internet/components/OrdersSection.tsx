/**
 * OrdersSection - Commandes du canal Site Internet
 *
 * Utilise SalesOrdersTable de @verone/orders avec channelId filter.
 * Pattern identique a LinkMe (CommandesClient.tsx).
 */

'use client';

import { useCallback } from 'react';

import { useRouter } from 'next/navigation';

import { SalesOrdersTable } from '@verone/orders';
import type { SalesOrder } from '@verone/orders';

import { updateSalesOrderStatus } from '@/app/actions/sales-orders';

import { SITE_INTERNET_CHANNEL_ID } from '../constants';

export function OrdersSection() {
  const router = useRouter();

  const handleViewOrder = useCallback(
    (order: SalesOrder) => {
      router.push(`/commandes/clients/${order.id}/details`);
    },
    [router]
  );

  return (
    <SalesOrdersTable
      channelId={SITE_INTERNET_CHANNEL_ID}
      onViewOrder={handleViewOrder}
      showChannelColumn={false}
      showKPIs
      allowValidate
      allowShip
      allowCancel
      allowEdit
      enablePagination
      defaultItemsPerPage={20}
      updateStatusAction={updateSalesOrderStatus}
    />
  );
}
