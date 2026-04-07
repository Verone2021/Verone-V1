'use client';

import { useState } from 'react';

export interface ContactsAddressesState {
  billingContactOpen: boolean;
  setBillingContactOpen: (v: boolean) => void;
  billingAddressOpen: boolean;
  setBillingAddressOpen: (v: boolean) => void;
  deliveryContactOpen: boolean;
  setDeliveryContactOpen: (v: boolean) => void;
  deliveryAddressOpen: boolean;
  setDeliveryAddressOpen: (v: boolean) => void;
  showNewBillingContactForm: boolean;
  setShowNewBillingContactForm: (v: boolean) => void;
  showNewBillingAddressForm: boolean;
  setShowNewBillingAddressForm: (v: boolean) => void;
  showNewDeliveryContactForm: boolean;
  setShowNewDeliveryContactForm: (v: boolean) => void;
  showNewDeliveryAddressForm: boolean;
  setShowNewDeliveryAddressForm: (v: boolean) => void;
}

export function useContactsAddressesState(): ContactsAddressesState {
  const [billingContactOpen, setBillingContactOpen] = useState(true);
  const [billingAddressOpen, setBillingAddressOpen] = useState(false);
  const [deliveryContactOpen, setDeliveryContactOpen] = useState(false);
  const [deliveryAddressOpen, setDeliveryAddressOpen] = useState(false);

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
    setBillingContactOpen,
    billingAddressOpen,
    setBillingAddressOpen,
    deliveryContactOpen,
    setDeliveryContactOpen,
    deliveryAddressOpen,
    setDeliveryAddressOpen,
    showNewBillingContactForm,
    setShowNewBillingContactForm,
    showNewBillingAddressForm,
    setShowNewBillingAddressForm,
    showNewDeliveryContactForm,
    setShowNewDeliveryContactForm,
    showNewDeliveryAddressForm,
    setShowNewDeliveryAddressForm,
  };
}
