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
 * - Colonnes additionnelles: Affilie, Selection, Marge
 *
 * Les triggers stock sont automatiques et identiques pour tous les canaux.
 */

import { useState, useEffect, useMemo } from 'react';

import { SalesOrdersTable } from '@verone/orders';
import type { SalesOrder } from '@verone/orders';
import { Badge } from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';

import { updateSalesOrderStatus } from '@/app/actions/sales-orders';

import { CreateLinkMeOrderModal } from '../components/CreateLinkMeOrderModal';
import { EditLinkMeOrderModal } from '../components/EditLinkMeOrderModal';

// ID du canal LinkMe
const LINKME_CHANNEL_ID = '93c68db1-5a30-4168-89ec-6383152be405';

// Type pour les donnees enrichies LinkMe
interface LinkMeEnrichedData {
  [orderId: string]: {
    affiliate_name: string | null;
    affiliate_type: 'enseigne' | 'organisation' | null;
    selection_name: string | null;
    total_affiliate_margin: number;
  };
}

export default function LinkMeOrdersPage() {
  const [enrichedData, setEnrichedData] = useState<LinkMeEnrichedData>({});
  const [isLoadingEnriched, setIsLoadingEnriched] = useState(true);
  const supabase = createClient();

  // Fetch donnees enrichies LinkMe (affilie, selection, marge)
  useEffect(() => {
    async function fetchEnrichedData() {
      setIsLoadingEnriched(true);
      try {
        // Utiliser la RPC existante pour avoir les donnees enrichies
        const { data: ordersData, error } = await (supabase as any).rpc(
          'get_linkme_orders',
          { p_affiliate_id: null }
        );

        if (error) {
          console.error('Erreur fetch LinkMe enriched data:', error);
          return;
        }

        // Construire un map des donnees enrichies par order_id
        const enriched: LinkMeEnrichedData = {};
        (ordersData || []).forEach((order: any) => {
          enriched[order.id] = {
            affiliate_name: order.affiliate_name || null,
            affiliate_type: order.affiliate_type || null,
            selection_name: order.selection_name || null,
            total_affiliate_margin: order.total_affiliate_margin || 0,
          };
        });

        setEnrichedData(enriched);
      } catch (error) {
        console.error('Erreur fetch enriched data:', error);
      } finally {
        setIsLoadingEnriched(false);
      }
    }

    fetchEnrichedData();
  }, [supabase]);

  // Colonnes additionnelles pour LinkMe
  const additionalColumns = useMemo(
    () => [
      {
        key: 'affiliate',
        header: 'Affilie',
        cell: (order: SalesOrder) => {
          const data = enrichedData[order.id];
          if (isLoadingEnriched) {
            return <span className="text-gray-400 text-xs">...</span>;
          }
          return data?.affiliate_name ? (
            <Badge variant="outline" className="text-xs">
              {data.affiliate_name}
            </Badge>
          ) : (
            <span className="text-gray-400">-</span>
          );
        },
      },
      {
        key: 'selection',
        header: 'Selection',
        cell: (order: SalesOrder) => {
          const data = enrichedData[order.id];
          if (isLoadingEnriched) {
            return <span className="text-gray-400 text-xs">...</span>;
          }
          return data?.selection_name ? (
            <span className="text-sm text-gray-700">{data.selection_name}</span>
          ) : (
            <span className="text-gray-400">-</span>
          );
        },
      },
      {
        key: 'margin',
        header: 'Marge Affilie',
        cell: (order: SalesOrder) => {
          const data = enrichedData[order.id];
          if (isLoadingEnriched) {
            return <span className="text-gray-400 text-xs">...</span>;
          }
          return data?.total_affiliate_margin ? (
            <span className="text-orange-600 font-medium">
              {formatCurrency(data.total_affiliate_margin)}
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          );
        },
      },
    ],
    [enrichedData, isLoadingEnriched]
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

      {/* Table des commandes */}
      <SalesOrdersTable
        channelId={LINKME_CHANNEL_ID}
        showChannelColumn={false}
        showCustomerTypeFilter={false}
        showPeriodFilter={false}
        showKPIs
        allowValidate
        allowShip
        allowCancel
        allowDelete
        allowEdit
        additionalColumns={additionalColumns}
        updateStatusAction={updateSalesOrderStatus}
        renderCreateModal={({ open, onClose, onSuccess }) => (
          <CreateLinkMeOrderModal
            isOpen={open}
            onClose={() => {
              onClose();
              // Rafraichir les donnees enrichies apres creation
              setIsLoadingEnriched(true);
              supabase
                .rpc('get_linkme_orders', { p_affiliate_id: undefined })
                .then(({ data }) => {
                  const enriched: LinkMeEnrichedData = {};
                  (data || []).forEach((order: any) => {
                    enriched[order.id] = {
                      affiliate_name: order.affiliate_name || null,
                      affiliate_type: order.affiliate_type || null,
                      selection_name: order.selection_name || null,
                      total_affiliate_margin: order.total_affiliate_margin || 0,
                    };
                  });
                  setEnrichedData(enriched);
                  setIsLoadingEnriched(false);
                });
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
    </div>
  );
}
