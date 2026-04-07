/**
 * ContactsAddressesSection — Types exportés
 *
 * @module ContactsAddressesSection.types
 */

// ============================================================================
// TYPES PUBLICS
// ============================================================================

/** Selected billing/delivery contact */
export interface SelectedContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
}

/** Selected billing/delivery address */
export interface SelectedAddress {
  mode: 'restaurant' | 'enseigne' | 'existing' | 'new';
  addressId?: string | null;
  customAddress?: {
    addressLine1: string;
    postalCode: string;
    city: string;
    country: string;
  } | null;
}

export interface ContactsAddressesData {
  billingContact: SelectedContact | null;
  billingAddress: SelectedAddress | null;
  deliveryContact: SelectedContact | null;
  deliverySameAsBillingContact: boolean;
  deliveryAddress: SelectedAddress | null;
  deliverySameAsBillingAddress: boolean;
}

// ============================================================================
// TYPES INTERNES (props du composant principal)
// ============================================================================

export interface ContactsAddressesSectionProps {
  /** ID de l'organisation (restaurant) sélectionnée */
  organisationId: string | null;
  /** Données actuelles */
  data: ContactsAddressesData;
  /** Callback de mise à jour */
  onUpdate: (data: Partial<ContactsAddressesData>) => void;
  /** Afficher cette section */
  visible?: boolean;
}
