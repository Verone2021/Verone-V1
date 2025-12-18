'use client';

/**
 * Page Commandes Clients
 *
 * Utilise le composant SalesOrdersTable reutilisable depuis @verone/orders.
 * Affiche toutes les commandes (tous canaux confondus).
 *
 * Workflow commandes:
 * - draft → validated → partially_shipped → shipped → delivered
 * - Annulation possible (draft uniquement, ou devalider d'abord)
 * - Les triggers stock sont automatiques (agnostiques du canal)
 */

import Link from 'next/link';

import { SalesOrdersTable } from '@verone/orders';
import { ButtonUnified } from '@verone/ui';
import { Truck } from 'lucide-react';

import { updateSalesOrderStatus } from '@/app/actions/sales-orders';

export default function SalesOrdersClientsPage() {
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
        <Link href="/stocks/expeditions">
          <ButtonUnified variant="outline" icon={Truck}>
            Expeditions
          </ButtonUnified>
        </Link>
      </div>

      {/* Table des commandes */}
      <SalesOrdersTable
        channelId={null} // Toutes les commandes
        showChannelColumn
        showCustomerTypeFilter
        showPeriodFilter
        showKPIs
        allowValidate
        allowShip
        allowCancel
        allowDelete
        allowEdit
        updateStatusAction={updateSalesOrderStatus}
      />
    </div>
  );
}
