'use client';

import { useState } from 'react';

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

  const resetNewCustomerForm = () => {
    setNewCustomerName('');
    setNewCustomerFirstName('');
    setNewCustomerLastName('');
    setNewCustomerEmail('');
    setNewCustomerPhone('');
    setNewOrgOwnershipType(null);
    setNewOrgAddress('');
    setNewOrgPostalCode('');
    setNewOrgCity('');
  };

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
