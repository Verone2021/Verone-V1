'use client';

/**
 * Page Commandes Clients
 *
 * Utilise le composant SalesOrdersTable reutilisable depuis @verone/orders.
 * Affiche toutes les commandes (tous canaux confondus).
 * Filtre par canal disponible: Tous, Site Internet, LinkMe
 *
 * Workflow commandes:
 * - draft → validated → partially_shipped → shipped → delivered
 * - Annulation possible (draft uniquement, ou devalider d'abord)
 * - Les triggers stock sont automatiques (agnostiques du canal)
 */

import { useState } from 'react';

import Link from 'next/link';

import { SalesOrdersTable } from '@verone/orders';
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

// IDs des canaux de vente
const CHANNEL_IDS = {
  all: null,
  linkme: '93c68db1-5a30-4168-89ec-6383152be405',
  siteInternet: '0c2639e9-df80-41fa-84d0-9da96a128f7f',
} as const;

type ChannelFilter = 'all' | 'linkme' | 'siteInternet';

export default function SalesOrdersClientsPage() {
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');

  return (
    <div className="space-y-6 p-6">
      {/* En-tete */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Commandes Clients
          </h1>
          <p className="text-gray-600 mt-1">
            Gestion des commandes et expeditions clients
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Filtre par canal */}
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

      {/* Table des commandes */}
      <SalesOrdersTable
        channelId={CHANNEL_IDS[channelFilter]}
        showChannelColumn={channelFilter === 'all'}
        showCustomerTypeFilter
        showPeriodFilter
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
          client: false, // ❌ Retirer tri client
          amount: true,
          orderNumber: true, // ✅ Ajouter tri numéro
        }}
        showEnseigneFilter // ✅ Ajouter filtres enseigne/org
      />
    </div>
  );
}
