/**
 * Constants, types, and helper functions for SalesOrdersTable
 */

import type {
  SalesOrder,
  SalesOrderStatus,
} from '../../hooks/use-sales-orders';

// Canaux de vente connus
export const LINKME_CHANNEL_ID = '93c68db1-5a30-4168-89ec-6383152be405';
export const SITE_INTERNET_CHANNEL_ID = '0c2639e9-df80-41fa-84d0-9da96a128f7f';

export const statusLabels: Record<SalesOrderStatus, string> = {
  pending_approval: "En attente d'approbation",
  draft: 'Brouillon',
  validated: 'Validee',
  partially_shipped: 'Partiellement expediee',
  shipped: 'Expediee',
  cancelled: 'Annulee',
};

export const statusColors: Record<SalesOrderStatus, string> = {
  pending_approval: 'bg-orange-100 text-orange-800',
  draft: 'bg-gray-100 text-gray-800',
  validated: 'bg-blue-100 text-blue-800',
  partially_shipped: 'bg-amber-100 text-amber-800',
  shipped: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export type SortColumn = 'date' | 'client' | 'amount' | 'order_number' | null;
export type SortDirection = 'asc' | 'desc';

export const isOrderEditable = (
  order: SalesOrder,
  channelId?: string | null
) => {
  // Si on filtre par canal, les commandes sont editables via le modal custom
  if (channelId) return true;
  // Sinon, seules les commandes sans canal specifique sont editables
  return (
    !order.channel_id ||
    (order.channel_id !== LINKME_CHANNEL_ID &&
      order.channel_id !== SITE_INTERNET_CHANNEL_ID)
  );
};

export const getChannelRedirectUrl = (order: SalesOrder) => {
  if (order.channel_id === LINKME_CHANNEL_ID) {
    if (order.status === 'draft' && order.pending_admin_validation === true) {
      return '/canaux-vente/linkme/approbations';
    }
    return '/canaux-vente/linkme/commandes';
  }
  if (order.channel_id === SITE_INTERNET_CHANNEL_ID) {
    return '/canaux-vente/site-internet/commandes';
  }
  return null;
};
