/**
 * @protected — NE PAS MODIFIER SANS APPROBATION ROMEO
 *
 * Ce hook fournit le formulaire de creation client dans le flow commande LinkMe.
 * resetNewCustomerForm DOIT rester dans useCallback (reference stable).
 * Sans useCallback → boucle infinie de resets dans use-create-linkme-order-form.
 *
 * Incident : 16 avril 2026 — commit fbf2a71db — 48h de casse en production.
 */
'use client';

import { useState, useCallback } from 'react';

export interface NewCustomerFormState {
  newCustomerName: string;
  setNewCustomerName: (v: string) => void;
  newCustomerFirstName: string;
  setNewCustomerFirstName: (v: string) => void;
  newCustomerLastName: string;
  setNewCustomerLastName: (v: string) => void;
  newCustomerEmail: string;
  setNewCustomerEmail: (v: string) => void;
  newCustomerPhone: string;
  setNewCustomerPhone: (v: string) => void;
  newOrgOwnershipType: 'succursale' | 'franchise' | null;
  setNewOrgOwnershipType: (v: 'succursale' | 'franchise' | null) => void;
  newOrgAddress: string;
  setNewOrgAddress: (v: string) => void;
  newOrgPostalCode: string;
  setNewOrgPostalCode: (v: string) => void;
  newOrgCity: string;
  setNewOrgCity: (v: string) => void;
  resetNewCustomerForm: () => void;
}

export function useNewCustomerForm(): NewCustomerFormState {
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerFirstName, setNewCustomerFirstName] = useState('');
  const [newCustomerLastName, setNewCustomerLastName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newOrgOwnershipType, setNewOrgOwnershipType] = useState<
    'succursale' | 'franchise' | null
  >(null);
  const [newOrgAddress, setNewOrgAddress] = useState('');
  const [newOrgPostalCode, setNewOrgPostalCode] = useState('');
  const [newOrgCity, setNewOrgCity] = useState('');

  const resetNewCustomerForm = useCallback(() => {
    setNewCustomerName('');
    setNewCustomerFirstName('');
    setNewCustomerLastName('');
    setNewCustomerEmail('');
    setNewCustomerPhone('');
    setNewOrgOwnershipType(null);
    setNewOrgAddress('');
    setNewOrgPostalCode('');
    setNewOrgCity('');
  }, []);

  return {
    newCustomerName,
    setNewCustomerName,
    newCustomerFirstName,
    setNewCustomerFirstName,
    newCustomerLastName,
    setNewCustomerLastName,
    newCustomerEmail,
    setNewCustomerEmail,
    newCustomerPhone,
    setNewCustomerPhone,
    newOrgOwnershipType,
    setNewOrgOwnershipType,
    newOrgAddress,
    setNewOrgAddress,
    newOrgPostalCode,
    setNewOrgPostalCode,
    newOrgCity,
    setNewOrgCity,
    resetNewCustomerForm,
  };
}
