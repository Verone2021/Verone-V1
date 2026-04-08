'use client';

import { useState } from 'react';

import { Building2, User, Search, Plus, Check, Loader2 } from 'lucide-react';

import { CustomerOrganisationFormModal } from '@verone/organisations';
import { cn } from '@verone/utils';

import type {
  EnseigneOrganisationCustomer,
  EnseigneIndividualCustomer,
} from '../../../hooks/linkme/use-linkme-enseigne-customers';
import { CustomerCreateForm } from './CustomerCreateForm';
import type { CustomerType } from './types';

interface CustomerSectionProps {
  customerType: CustomerType;
  onCustomerTypeChange: (type: CustomerType) => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  showCreateForm: boolean;
  onToggleCreateForm: () => void;
  filteredOrganisations: EnseigneOrganisationCustomer[];
  filteredIndividuals: EnseigneIndividualCustomer[];
  customersLoading: boolean;
  selectedCustomerId: string;
  onSelectCustomer: (id: string) => void;
  // Props pour le modal org (remplace le formulaire inline org)
  enseigneId?: string;
  onOrganisationCreated?: (orgId: string) => void;
  // Formulaire création particulier (gardé en inline)
  newCustomerFirstName: string;
  onNewCustomerFirstNameChange: (v: string) => void;
  newCustomerLastName: string;
  onNewCustomerLastNameChange: (v: string) => void;
  newCustomerEmail: string;
  onNewCustomerEmailChange: (v: string) => void;
  newCustomerPhone: string;
  onNewCustomerPhoneChange: (v: string) => void;
  // Legacy org props (still needed for individual form + backward compat)
  newCustomerName: string;
  onNewCustomerNameChange: (v: string) => void;
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

export function CustomerSection({
  customerType,
  onCustomerTypeChange,
  searchQuery,
  onSearchQueryChange,
  showCreateForm,
  onToggleCreateForm,
  filteredOrganisations,
  filteredIndividuals,
  customersLoading,
  selectedCustomerId,
  onSelectCustomer,
  enseigneId,
  onOrganisationCreated,
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
}: CustomerSectionProps) {
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Client *
      </label>

      {/* Type de client */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onCustomerTypeChange('organization')}
          className={cn(
            'flex items-center gap-2 p-3 rounded-lg border-2 transition-all',
            customerType === 'organization'
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-200 hover:border-gray-300'
          )}
        >
          <Building2
            className={cn(
              'h-5 w-5',
              customerType === 'organization'
                ? 'text-purple-600'
                : 'text-gray-400'
            )}
          />
          <span
            className={cn(
              'font-medium',
              customerType === 'organization'
                ? 'text-purple-700'
                : 'text-gray-600'
            )}
          >
            Organisation
          </span>
        </button>
        <button
          onClick={() => onCustomerTypeChange('individual')}
          className={cn(
            'flex items-center gap-2 p-3 rounded-lg border-2 transition-all',
            customerType === 'individual'
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-200 hover:border-gray-300'
          )}
        >
          <User
            className={cn(
              'h-5 w-5',
              customerType === 'individual'
                ? 'text-purple-600'
                : 'text-gray-400'
            )}
          />
          <span
            className={cn(
              'font-medium',
              customerType === 'individual'
                ? 'text-purple-700'
                : 'text-gray-600'
            )}
          >
            Particulier
          </span>
        </button>
      </div>

      {/* Recherche + Nouveau */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchQueryChange(e.target.value)}
            placeholder="Rechercher un client..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <button
          onClick={() => {
            if (customerType === 'organization') {
              setIsOrgModalOpen(true);
            } else {
              onToggleCreateForm();
            }
          }}
          className={cn(
            'flex items-center gap-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors',
            showCreateForm
              ? 'bg-purple-600 text-white border-purple-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          )}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nouveau</span>
        </button>
      </div>

      {/* Modal création organisation (remplace le formulaire inline) */}
      <CustomerOrganisationFormModal
        isOpen={isOrgModalOpen}
        onClose={() => setIsOrgModalOpen(false)}
        enseigneId={enseigneId}
        onSuccess={org => {
          onOrganisationCreated?.(org.id);
          setIsOrgModalOpen(false);
        }}
      />

      {/* Formulaire création particulier (inline, gardé tel quel) */}
      {showCreateForm && customerType === 'individual' && (
        <CustomerCreateForm
          customerType={customerType}
          newCustomerName={newCustomerName}
          onNewCustomerNameChange={onNewCustomerNameChange}
          newCustomerFirstName={newCustomerFirstName}
          onNewCustomerFirstNameChange={onNewCustomerFirstNameChange}
          newCustomerLastName={newCustomerLastName}
          onNewCustomerLastNameChange={onNewCustomerLastNameChange}
          newCustomerEmail={newCustomerEmail}
          onNewCustomerEmailChange={onNewCustomerEmailChange}
          newCustomerPhone={newCustomerPhone}
          onNewCustomerPhoneChange={onNewCustomerPhoneChange}
          newOrgOwnershipType={newOrgOwnershipType}
          onNewOrgOwnershipTypeChange={onNewOrgOwnershipTypeChange}
          newOrgAddress={newOrgAddress}
          onNewOrgAddressChange={onNewOrgAddressChange}
          newOrgPostalCode={newOrgPostalCode}
          onNewOrgPostalCodeChange={onNewOrgPostalCodeChange}
          newOrgCity={newOrgCity}
          onNewOrgCityChange={onNewOrgCityChange}
          isCreatingCustomer={isCreatingCustomer}
          onCreateCustomer={onCreateCustomer}
          onCancelCreateForm={onCancelCreateForm}
        />
      )}

      {/* Liste clients */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {customersLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          </div>
        ) : customerType === 'organization' ? (
          filteredOrganisations.length > 0 ? (
            filteredOrganisations.map(org => (
              <button
                key={org.id}
                onClick={() => onSelectCustomer(org.id)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
                  selectedCustomerId === org.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <Building2 className="h-4 w-4 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{org.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {org.email ?? org.city ?? "Pas d'email"}
                  </p>
                </div>
                {selectedCustomerId === org.id && (
                  <Check className="h-4 w-4 text-purple-600" />
                )}
              </button>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">
              Aucune organisation trouvée
            </p>
          )
        ) : filteredIndividuals.length > 0 ? (
          filteredIndividuals.map(individual => (
            <button
              key={individual.id}
              onClick={() => onSelectCustomer(individual.id)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
                selectedCustomerId === individual.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <User className="h-4 w-4 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{individual.full_name}</p>
                <p className="text-xs text-gray-500 truncate">
                  {individual.email ?? individual.city ?? "Pas d'email"}
                </p>
              </div>
              {selectedCustomerId === individual.id && (
                <Check className="h-4 w-4 text-purple-600" />
              )}
            </button>
          ))
        ) : (
          <p className="text-center text-gray-500 py-4">
            Aucun particulier trouvé
          </p>
        )}
      </div>
    </div>
  );
}
