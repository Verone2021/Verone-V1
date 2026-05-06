/**
 * Types locaux pour la page Messagerie (BO-MSG-001).
 * EmailMessage vient de @verone/types (email-messages.ts).
 */

export type {
  EmailMessage,
  EmailMessageEnriched,
  EmailBrand,
} from '@verone/types';

export type EmailMessageBrand = 'verone' | 'linkme';

export interface MessagerieFilters {
  brand: EmailMessageBrand | 'all';
  toAddress: string;
  status: 'all' | 'read' | 'unread';
  search: string;
}
