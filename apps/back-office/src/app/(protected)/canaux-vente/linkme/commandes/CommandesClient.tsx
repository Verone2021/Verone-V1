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

import { useState, useMemo } from 'react';

import { SalesOrdersTable } from '@verone/orders';
import type { SalesOrder } from '@verone/orders';
import { Button } from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import { AlertCircle, CheckCircle2, Circle } from 'lucide-react';

import { updateSalesOrderStatus } from '@/app/actions/sales-orders';

import { CreateLinkMeOrderModal } from '../components/CreateLinkMeOrderModal';
import { EditLinkMeOrderModal } from '../components/EditLinkMeOrderModal';
import { PendingOrderCards } from '../components/PendingOrderCards';
import { usePendingOrdersCount } from '../hooks/use-linkme-order-actions';

// ID du canal LinkMe
const LINKME_CHANNEL_ID = '93c68db1-5a30-4168-89ec-6383152be405';

// Fonction pour determiner le canal de la commande
// 3 canaux mutuellement exclusifs:
// 1. Affilié = commande créée par un affilié depuis l'app LinkMe
// 2. Sélection publique = commande créée par client final via catalogue public
// 3. Manuel = commande créée manuellement par admin dans le back-office
function getOrderChannel(order: SalesOrder): {
  label: string;
  color: string;
  bg: string;
} {
  // Canal 1: Commande créée par un affilié depuis l'app LinkMe
  if (order.created_by_affiliate_id) {
    return {
      label: 'Affilié',
      color: 'text-teal-700',
      bg: 'bg-teal-100',
    };
  }

  // Canal 2: Commande via sélection publique (client final)
  if (order.linkme_selection_id) {
    return {
      label: 'Sélection publique',
      color: 'text-amber-700',
      bg: 'bg-amber-100',
    };
  }

  // Canal 3: Créée manuellement par admin dans le back-office
  return {
    label: 'Manuel',
    color: 'text-blue-700',
    bg: 'bg-blue-100',
  };
}

// Calculer la marge affilié depuis les items de la commande
function getAffiliateMargin(order: SalesOrder): number {
  if (!order.sales_order_items) return 0;
  return order.sales_order_items.reduce(
    (sum, item) => sum + (item.retrocession_amount ?? 0),
    0
  );
}

export default function CommandesClient() {
  const [filterPendingValidation, setFilterPendingValidation] = useState(false);

  // Compter les commandes en attente de validation via hook dédié
  const { data: pendingValidationCount = 0 } = usePendingOrdersCount();

  // Colonnes additionnelles pour LinkMe (avec colonne Canal et Approbation)
  const additionalColumns = useMemo(
    () => [
      {
        key: 'order_channel',
        header: 'Canal',
        cell: (order: SalesOrder) => {
          const channel = getOrderChannel(order);
          return (
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${channel.bg} ${channel.color}`}
            >
              {channel.label}
            </span>
          );
        },
      },
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
        header: 'Marge Affilie',
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
        <h1 className="text-3xl font-bold text-gray-900">Commandes LinkMe</h1>
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
          showChannelColumn={false}
          showKPIs
          allowValidate
          allowShip
          allowCancel
          allowDelete
          allowEdit
          enablePagination
          defaultItemsPerPage={10}
          additionalColumns={additionalColumns}
          updateStatusAction={updateSalesOrderStatus}
          renderCreateModal={({ open, onClose, onSuccess }) => (
            <CreateLinkMeOrderModal
              isOpen={open}
              onClose={() => {
                onClose();
                onSuccess();
              }}
            />
          )}
          renderEditModal={({ orderId, open, onClose, onSuccess }) => (
            <EditLinkMeOrderModal
              isOpen={open}
              orderId={orderId}
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
