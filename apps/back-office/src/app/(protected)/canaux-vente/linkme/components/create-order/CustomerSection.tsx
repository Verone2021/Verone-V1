'use client';

import { useState } from 'react';

import { CustomerOrganisationFormModal } from '@verone/organisations';
import { cn } from '@verone/utils';
import { Building2, User, Search, Plus, Check, Loader2 } from 'lucide-react';

import type { CustomerType } from '../../hooks/use-create-linkme-order-form';
import type {
  EnseigneOrganisationCustomer,
  EnseigneIndividualCustomer,
} from '../../hooks/use-linkme-enseigne-customers';

interface CustomerSectionProps {
  customerType: CustomerType;
  onCustomerTypeChange: (type: CustomerType) => void;
  selectedCustomerId: string;
  onSelectCustomer: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  showCreateForm: boolean;
  onToggleCreateForm: (show: boolean) => void;
  onCreateCustomer: () => void;
  isCreating: boolean;
  isLoading: boolean;
  filteredOrganisations: EnseigneOrganisationCustomer[];
  filteredIndividuals: EnseigneIndividualCustomer[];
  // Props pour le modal organisation unifié
  enseigneId?: string | null;
  onOrganisationCreated?: (orgId: string) => void;
  // Create form fields (particulier uniquement)
  newCustomerFirstName: string;
  onNewCustomerFirstNameChange: (v: string) => void;
  newCustomerLastName: string;
  onNewCustomerLastNameChange: (v: string) => void;
  newCustomerEmail: string;
  onNewCustomerEmailChange: (v: string) => void;
  newCustomerPhone: string;
  onNewCustomerPhoneChange: (v: string) => void;
}

export function CustomerSection({
  customerType,
  onCustomerTypeChange,
  selectedCustomerId,
  onSelectCustomer,
  searchQuery,
  onSearchChange,
  showCreateForm,
  onToggleCreateForm,
  onCreateCustomer,
  isCreating,
  isLoading,
  filteredOrganisations,
  filteredIndividuals,
  enseigneId,
  onOrganisationCreated,
  newCustomerFirstName,
  onNewCustomerFirstNameChange,
  newCustomerLastName,
  onNewCustomerLastNameChange,
  newCustomerEmail,
  onNewCustomerEmailChange,
  newCustomerPhone,
  onNewCustomerPhoneChange,
}: CustomerSectionProps) {
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);

  return (
    <div className="space-y-3 border-t pt-6">
      <label className="block text-sm font-medium text-gray-700">
        Client *
      </label>

      {/* Type de client */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => {
            onCustomerTypeChange('organization');
            onSelectCustomer('');
          }}
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
          onClick={() => {
            onCustomerTypeChange('individual');
            onSelectCustomer('');
          }}
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
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Rechercher un client..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <button
          onClick={() => {
            if (customerType === 'organization') {
              setIsOrgModalOpen(true);
            } else {
              onToggleCreateForm(!showCreateForm);
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

      {/* Modal création organisation (formulaire unifié complet) */}
      <CustomerOrganisationFormModal
        isOpen={isOrgModalOpen}
        onClose={() => setIsOrgModalOpen(false)}
        enseigneId={enseigneId}
        sourceType="linkme"
        onSuccess={org => {
          onOrganisationCreated?.(org.id);
          setIsOrgModalOpen(false);
        }}
      />

      {/* Formulaire création particulier (inline, gardé tel quel) */}
      {showCreateForm && customerType === 'individual' && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-3">
          <p className="text-sm font-medium text-purple-800">
            Nouveau particulier
          </p>

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

          <div className="flex gap-2">
            <button
              onClick={() => {
                void (async () => {
                  try {
                    onCreateCustomer();
                  } catch (error) {
                    console.error('[CustomerSection] Create failed:', error);
                  }
                })();
              }}
              disabled={
                isCreating ||
                !newCustomerFirstName.trim() ||
                !newCustomerLastName.trim()
              }
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isCreating ? (
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
              onClick={() => onToggleCreateForm(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Liste clients */}
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {isLoading ? (
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
