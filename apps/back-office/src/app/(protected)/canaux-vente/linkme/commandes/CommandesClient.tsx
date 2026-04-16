'use client';

/**
 * Page Commandes LinkMe
 *
 * Utilise le composant SalesOrdersTable reutilisable depuis @verone/orders.
 * Filtre les commandes par channel_id = LINKME_CHANNEL_ID.
 *
 * Fonctionnalites:
 * - Meme workflow que /commandes/clients (Valider, Expedier, Annuler)
 * - Modal de creation specifique LinkMe (CreateLinkMeOrderModal)
 * - Modal d'edition specifique LinkMe (EditLinkMeOrderModal)
 * - Colonnes additionnelles: indicateur validation (pastille), Canal, Marge
 * - Filtre "En attente de validation" avec badge rouge/vert
 *
 * Les triggers stock sont automatiques et identiques pour tous les canaux.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { SalesOrdersTable } from '@verone/orders';
import type { SalesOrder } from '@verone/orders';
import { Button } from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import { AlertCircle, CheckCircle2, Circle } from 'lucide-react';

import { updateSalesOrderStatus } from '@/app/actions/sales-orders';

import { CreateLinkMeOrderModal } from '../components/CreateLinkMeOrderModal';
import { PendingOrderCards } from '../components/PendingOrderCards';
import { usePendingOrdersCount } from '../hooks/use-linkme-order-actions';

// ID du canal LinkMe
const LINKME_CHANNEL_ID = '93c68db1-5a30-4168-89ec-6383152be405';

// Fonction pour determiner le canal de la commande
// 3 canaux mutuellement exclusifs:
// Calculer la marge affilié depuis les items de la commande
function getAffiliateMargin(order: SalesOrder): number {
  if (!order.sales_order_items) return 0;
  return order.sales_order_items.reduce(
    (sum, item) => sum + (item.retrocession_amount ?? 0),
    0
  );
}

export default function CommandesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldAutoOpenCreate = searchParams.get('action') === 'new';
  const [filterPendingValidation, setFilterPendingValidation] = useState(false);

  // Nettoyer le query param après ouverture automatique du modal
  useEffect(() => {
    if (shouldAutoOpenCreate) {
      router.replace('/canaux-vente/linkme/commandes', { scroll: false });
    }
  }, [shouldAutoOpenCreate, router]);

  // Navigation vers page détail LinkMe au lieu du modal générique
  const handleViewOrder = useCallback(
    (order: SalesOrder) => {
      router.push(`/canaux-vente/linkme/commandes/${order.id}/details`);
    },
    [router]
  );

  // Compter les commandes en attente de validation via hook dédié
  const { data: pendingValidationCount = 0 } = usePendingOrdersCount();

  // Colonnes additionnelles pour LinkMe (approbation + commission)
  const additionalColumns = useMemo(
    () => [
      {
        key: 'validation_dot',
        header: '',
        cell: (order: SalesOrder) => {
          if (order.pending_admin_validation) {
            return (
              <span title="En attente de validation">
                <Circle className="h-2.5 w-2.5 fill-orange-500 text-orange-500" />
              </span>
            );
          }
          if (order.confirmed_at) {
            return (
              <span title="Approuvée">
                <Circle className="h-2.5 w-2.5 fill-green-500 text-green-500" />
              </span>
            );
          }
          return null;
        },
      },
      {
        key: 'margin',
        header: 'Commission HT',
        cell: (order: SalesOrder) => {
          const margin = getAffiliateMargin(order);
          return margin > 0 ? (
            <span className="text-orange-600 font-medium">
              {formatCurrency(margin)}
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-6 p-6">
      {/* En-tete */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Back-office - Canaux de vente LinkMe - Commandes
        </h1>
        <p className="text-gray-600 mt-1">
          Commandes via le canal affilies - Meme workflow que les commandes
          generales
        </p>
      </div>

      {/* Bouton toggle filtre "En attente" */}
      <div className="flex items-center gap-3">
        <Button
          variant={filterPendingValidation ? 'default' : 'outline'}
          onClick={() => setFilterPendingValidation(!filterPendingValidation)}
          className={`gap-2 ${
            pendingValidationCount > 0
              ? filterPendingValidation
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'border-red-300 text-red-700 hover:bg-red-50'
              : filterPendingValidation
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'border-green-300 text-green-700 hover:bg-green-50'
          }`}
        >
          {pendingValidationCount > 0 ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          {pendingValidationCount} en attente d&apos;approbation
        </Button>
      </div>

      {/* Vue conditionnelle : Cartes d'approbation OU Table complète */}
      {filterPendingValidation ? (
        <PendingOrderCards />
      ) : (
        <SalesOrdersTable
          channelId={LINKME_CHANNEL_ID}
          onViewOrder={handleViewOrder}
          showChannelColumn={false}
          showKPIs
          allowValidate
          allowShip
          allowCancel
          allowDelete
          enablePagination
          defaultItemsPerPage={10}
          additionalColumns={additionalColumns}
          updateStatusAction={updateSalesOrderStatus}
          initialCreateOpen={shouldAutoOpenCreate}
          renderCreateModal={({ open, onClose, onSuccess }) => (
            <CreateLinkMeOrderModal
              isOpen={open}
              onClose={() => {
                onClose();
                onSuccess();
              }}
            />
          )}
        />
      )}
    </div>
  );
}
