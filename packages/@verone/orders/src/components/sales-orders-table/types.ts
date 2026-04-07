import type React from 'react';

import type {
  SalesOrder,
  SalesOrderStatus,
} from '../../hooks/use-sales-orders';

export interface SalesOrdersTableProps {
  /** ID du canal de vente pour filtrer (null = toutes les commandes) */
  channelId?: string | null;

  /** Afficher la colonne Canal */
  showChannelColumn?: boolean;

  /** Afficher les KPIs */
  showKPIs?: boolean;

  /** Autoriser la validation */
  allowValidate?: boolean;

  /** Autoriser l'expedition */
  allowShip?: boolean;

  /** Autoriser l'annulation */
  allowCancel?: boolean;

  /** Autoriser la suppression */
  allowDelete?: boolean;

  /** Autoriser l'edition (modal standard) */
  allowEdit?: boolean;

  /** Colonnes personnalisees (pour LinkMe: Affilie, Marge) */
  additionalColumns?: Array<{
    key: string;
    header: string;
    cell: (order: SalesOrder) => React.ReactNode;
  }>;

  /** Callback custom pour le bouton "Nouvelle commande" (ex: redirection) */
  onCreateClick?: () => void;

  /** Callback quand l'utilisateur clique "LinkMe" dans le wizard canal (ex: redirection) */
  onLinkMeClick?: () => void;

  /** Ouvrir le modal de creation au montage (ex: ?action=new) */
  initialCreateOpen?: boolean;

  /** Render custom du modal de creation */
  renderCreateModal?: (props: {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
  }) => React.ReactNode;

  /** Render custom du modal d'edition */
  renderEditModal?: (props: {
    orderId: string;
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
  }) => React.ReactNode;

  /** Callback apres creation */
  onOrderCreated?: () => void;

  /** Callback apres mise a jour */
  onOrderUpdated?: () => void;

  /** Server Action pour update status (doit etre passee depuis l'app) */
  updateStatusAction?: (
    orderId: string,
    newStatus: SalesOrderStatus,
    userId: string
  ) => Promise<{ success: boolean; error?: string }>;

  /** Render custom element a droite du header (ex: bouton filtre) */
  renderHeaderRight?: () => React.ReactNode;

  /** Filtre personnalise applique sur les commandes */
  customFilter?: (order: SalesOrder) => boolean;

  /** Activer la pagination */
  enablePagination?: boolean;

  /** Nombre d'items par page par defaut (10 ou 20) */
  defaultItemsPerPage?: 10 | 20;

  /** Commandes pre-chargees (evite double fetch quand parent fetch deja) */
  preloadedOrders?: SalesOrder[];

  /** Controle colonnes triables */
  sortableColumns?: {
    date?: boolean;
    client?: boolean;
    amount?: boolean;
    orderNumber?: boolean;
  };

  /** Callback custom pour le bouton "Voir" (remplace le modal par defaut) */
  onViewOrder?: (order: SalesOrder) => void;
}
