'use client';

import { Check, Loader2 } from 'lucide-react';

import { cn } from '@verone/utils';

import type { CustomerType } from './types';

interface CustomerCreateFormProps {
  customerType: CustomerType;
  newCustomerName: string;
  onNewCustomerNameChange: (v: string) => void;
  newCustomerFirstName: string;
  onNewCustomerFirstNameChange: (v: string) => void;
  newCustomerLastName: string;
  onNewCustomerLastNameChange: (v: string) => void;
  newCustomerEmail: string;
  onNewCustomerEmailChange: (v: string) => void;
  newCustomerPhone: string;
  onNewCustomerPhoneChange: (v: string) => void;
  newOrgOwnershipType: 'succursale' | 'franchise' | null;
  onNewOrgOwnershipTypeChange: (v: 'succursale' | 'franchise' | null) => void;
  newOrgAddress: string;
  onNewOrgAddressChange: (v: string) => void;
  newOrgPostalCode: string;
  onNewOrgPostalCodeChange: (v: string) => void;
  newOrgCity: string;
  onNewOrgCityChange: (v: string) => void;
  isCreatingCustomer: boolean;
  onCreateCustomer: () => void;
  onCancelCreateForm: () => void;
}

export function CustomerCreateForm({
  customerType,
  newCustomerName,
  onNewCustomerNameChange,
  newCustomerFirstName,
  onNewCustomerFirstNameChange,
  newCustomerLastName,
  onNewCustomerLastNameChange,
  newCustomerEmail,
  onNewCustomerEmailChange,
  newCustomerPhone,
  onNewCustomerPhoneChange,
  newOrgOwnershipType,
  onNewOrgOwnershipTypeChange,
  newOrgAddress,
  onNewOrgAddressChange,
  newOrgPostalCode,
  onNewOrgPostalCodeChange,
  newOrgCity,
  onNewOrgCityChange,
  isCreatingCustomer,
  onCreateCustomer,
  onCancelCreateForm,
}: CustomerCreateFormProps) {
  return (
    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-3">
      <p className="text-sm font-medium text-purple-800">
        {customerType === 'organization'
          ? 'Nouvelle organisation'
          : 'Nouveau particulier'}
      </p>

      {customerType === 'organization' ? (
        <input
          type="text"
          value={newCustomerName}
          onChange={e => onNewCustomerNameChange(e.target.value)}
          placeholder="Nom de l'organisation *"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={newCustomerFirstName}
            onChange={e => onNewCustomerFirstNameChange(e.target.value)}
            placeholder="Prénom *"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            type="text"
            value={newCustomerLastName}
            onChange={e => onNewCustomerLastNameChange(e.target.value)}
            placeholder="Nom *"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <input
          type="email"
          value={newCustomerEmail}
          onChange={e => onNewCustomerEmailChange(e.target.value)}
          placeholder="Email"
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <input
          type="tel"
          value={newCustomerPhone}
          onChange={e => onNewCustomerPhoneChange(e.target.value)}
          placeholder="Téléphone"
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {customerType === 'organization' && (
        <div className="space-y-1">
          <label className="block text-xs text-purple-700">
            Type de point de vente
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() =>
                onNewOrgOwnershipTypeChange(
                  newOrgOwnershipType === 'succursale' ? null : 'succursale'
                )
              }
              className={cn(
                'px-3 py-1.5 rounded-lg border text-sm transition-all',
                newOrgOwnershipType === 'succursale'
                  ? 'border-purple-500 bg-purple-100 text-purple-700 font-medium'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              )}
            >
              Propre (succursale)
            </button>
            <button
              type="button"
              onClick={() =>
                onNewOrgOwnershipTypeChange(
                  newOrgOwnershipType === 'franchise' ? null : 'franchise'
                )
              }
              className={cn(
                'px-3 py-1.5 rounded-lg border text-sm transition-all',
                newOrgOwnershipType === 'franchise'
                  ? 'border-purple-500 bg-purple-100 text-purple-700 font-medium'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              )}
            >
              Franchise
            </button>
          </div>
        </div>
      )}

      {customerType === 'organization' && (
        <div className="space-y-2">
          <label className="block text-xs text-purple-700">
            Adresse du restaurant
          </label>
          <input
            type="text"
            value={newOrgAddress}
            onChange={e => onNewOrgAddressChange(e.target.value)}
            placeholder="Adresse (rue, numéro)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={newOrgPostalCode}
              onChange={e => onNewOrgPostalCodeChange(e.target.value)}
              placeholder="Code postal"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="text"
              value={newOrgCity}
              onChange={e => onNewOrgCityChange(e.target.value)}
              placeholder="Ville"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onCreateCustomer}
          disabled={
            isCreatingCustomer ||
            (customerType === 'organization' && !newCustomerName.trim()) ||
            (customerType === 'individual' &&
              (!newCustomerFirstName.trim() || !newCustomerLastName.trim()))
          }
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          {isCreatingCustomer ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Création...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Créer et sélectionner
            </>
          )}
        </button>
        <button
          onClick={onCancelCreateForm}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white text-sm"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
