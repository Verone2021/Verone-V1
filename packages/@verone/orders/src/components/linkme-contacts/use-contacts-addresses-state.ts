/**
 * use-contacts-addresses-state — Hook centralisant tous les états UI open/show
 * pour les 4 sections (billing contact, billing address, delivery contact, delivery address)
 *
 * @module use-contacts-addresses-state
 */

import { useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface ContactsAddressesState {
  // Open states (accordéon)
  billingContactOpen: boolean;
  billingAddressOpen: boolean;
  deliveryContactOpen: boolean;
  deliveryAddressOpen: boolean;

  // Form visibility states
  showNewBillingContactForm: boolean;
  showNewBillingAddressForm: boolean;
  showNewDeliveryContactForm: boolean;
  showNewDeliveryAddressForm: boolean;

  // Setters
  setBillingContactOpen: (value: boolean) => void;
  setBillingAddressOpen: (value: boolean) => void;
  setDeliveryContactOpen: (value: boolean) => void;
  setDeliveryAddressOpen: (value: boolean) => void;

  setShowNewBillingContactForm: (value: boolean) => void;
  setShowNewBillingAddressForm: (value: boolean) => void;
  setShowNewDeliveryContactForm: (value: boolean) => void;
  setShowNewDeliveryAddressForm: (value: boolean) => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function useContactsAddressesState(): ContactsAddressesState {
  // Open states (accordéon)
  const [billingContactOpen, setBillingContactOpen] = useState(true);
  const [billingAddressOpen, setBillingAddressOpen] = useState(false);
  const [deliveryContactOpen, setDeliveryContactOpen] = useState(false);
  const [deliveryAddressOpen, setDeliveryAddressOpen] = useState(false);

  // Form visibility states
  const [showNewBillingContactForm, setShowNewBillingContactForm] =
    useState(false);
  const [showNewBillingAddressForm, setShowNewBillingAddressForm] =
    useState(false);
  const [showNewDeliveryContactForm, setShowNewDeliveryContactForm] =
    useState(false);
  const [showNewDeliveryAddressForm, setShowNewDeliveryAddressForm] =
    useState(false);

  return {
    billingContactOpen,
    billingAddressOpen,
    deliveryContactOpen,
    deliveryAddressOpen,

    showNewBillingContactForm,
    showNewBillingAddressForm,
    showNewDeliveryContactForm,
    showNewDeliveryAddressForm,

    setBillingContactOpen,
    setBillingAddressOpen,
    setDeliveryContactOpen,
    setDeliveryAddressOpen,

    setShowNewBillingContactForm,
    setShowNewBillingAddressForm,
    setShowNewDeliveryContactForm,
    setShowNewDeliveryAddressForm,
  };
}
