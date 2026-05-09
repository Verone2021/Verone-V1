'use client';

/**
 * Client Component — Commandes Clients
 *
 * Reçoit preloadedOrders depuis le Server Component page.tsx pour
 * l'affichage immédiat sans aller-retour réseau au premier rendu.
 * Les hooks interactifs (router, searchParams, modals) restent ici.
 *
 * [BO-PERF-ORDERS-001] Extraction depuis page.tsx pour permettre SSR.
 */

import { useCallback, useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import type { SalesOrder } from '@verone/orders';
import { SalesOrderFormModal, SalesOrdersTable } from '@verone/orders';
import {
  ButtonUnified,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Truck } from 'lucide-react';

import { updateSalesOrderStatus } from '@/app/actions/sales-orders';

const CHANNEL_IDS = {
  all: null,
  linkme: '93c68db1-5a30-4168-89ec-6383152be405',
  siteInternet: '0c2639e9-df80-41fa-84d0-9da96a128f7f',
} as const;

type ChannelFilter = 'all' | 'linkme' | 'siteInternet';

interface SalesOrdersClientsPageProps {
  preloadedOrders: SalesOrder[];
}

export function SalesOrdersClientsPage({
  preloadedOrders,
}: SalesOrdersClientsPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [cameFrom] = useState(() => searchParams.get('from'));

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setShowCreateModal(true);
      router.replace('/commandes/clients', { scroll: false });
    }
  }, [searchParams, router]);

  const handleModalClose = useCallback(
    (open: boolean) => {
      setShowCreateModal(open);
      if (!open && cameFrom === 'ventes') {
        router.push('/ventes');
      }
    },
    [cameFrom, router]
  );

  const handleCreateLinkMeOrder = useCallback(() => {
    router.push('/canaux-vente/linkme/commandes?action=new');
  }, [router]);

  const handleCreateClick = useCallback(() => {
    if (channelFilter === 'linkme') {
      handleCreateLinkMeOrder();
    } else {
      setShowCreateModal(true);
    }
  }, [channelFilter, handleCreateLinkMeOrder]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Back-office - Commandes clients
          </h1>
          <p className="text-gray-600 mt-1">
            Gestion des commandes et expeditions clients
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={channelFilter}
            onValueChange={(value: ChannelFilter) => setChannelFilter(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrer par canal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les canaux</SelectItem>
              <SelectItem value="siteInternet">Site Internet</SelectItem>
              <SelectItem value="linkme">LinkMe</SelectItem>
            </SelectContent>
          </Select>
          <Link href="/stocks/expeditions">
            <ButtonUnified variant="outline" icon={Truck}>
              Expeditions
            </ButtonUnified>
          </Link>
        </div>
      </div>

      <SalesOrderFormModal
        open={showCreateModal}
        onOpenChange={handleModalClose}
        onLinkMeClick={handleCreateLinkMeOrder}
      />

      <SalesOrdersTable
        channelId={CHANNEL_IDS[channelFilter]}
        showChannelColumn={channelFilter === 'all'}
        showKPIs
        allowValidate
        allowShip
        allowCancel
        allowDelete
        allowEdit
        updateStatusAction={updateSalesOrderStatus}
        enablePagination
        defaultItemsPerPage={20}
        sortableColumns={{
          date: true,
          client: false,
          amount: true,
          orderNumber: true,
        }}
        onCreateClick={handleCreateClick}
        onLinkMeClick={handleCreateLinkMeOrder}
        preloadedOrders={channelFilter === 'all' ? preloadedOrders : undefined}
      />
    </div>
  );
}
