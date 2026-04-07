import type { LinkMeOrderItemInput } from '../../../hooks/linkme/use-linkme-orders';
import type { ContactsAddressesData } from '../../linkme-contacts';

export type CustomerType = 'organization' | 'individual';

// Type pour les sélections retournées par useLinkMeSelectionsByAffiliate
export type AffiliateSelection = {
  id: string;
  name: string;
  slug: string;
  products_count: number | null;
  archived_at: string | null;
};

export interface CartItem extends LinkMeOrderItemInput {
  id: string;
  tax_rate: number; // TVA par ligne (0.20 = 20%)
}

export interface CreateLinkMeOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pré-sélectionner un affilié */
  preselectedAffiliateId?: string;
}

export const EMPTY_CONTACTS_ADDRESSES_DATA: ContactsAddressesData = {
  billingContact: null,
  billingAddress: null,
  deliveryContact: null,
  deliverySameAsBillingContact: false,
  deliveryAddress: null,
  deliverySameAsBillingAddress: false,
};

/** Arrondi monétaire à 2 décimales */
export const roundMoney = (value: number): number =>
  Math.round(value * 100) / 100;
