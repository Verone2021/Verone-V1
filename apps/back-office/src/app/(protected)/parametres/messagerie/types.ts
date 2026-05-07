/**
 * Types pour la page Messagerie HUB unifié (BO-MSG-018).
 *
 * Re-export depuis @verone/notifications pour éviter la duplication.
 * Les types canoniques vivent dans le hook `useCommunications`.
 */

export type {
  Communication,
  CommunicationDirection,
  CommunicationBrand,
  CommunicationKind,
} from '@verone/notifications';

export interface MessagerieFilters {
  direction: 'all' | 'sent' | 'received';
  brand: 'all' | 'verone' | 'linkme';
  kind: 'all' | 'inbound_email' | 'document' | 'consultation' | 'info_request';
  toAddress: string;
  status: 'all' | 'read' | 'unread';
  search: string;
}
