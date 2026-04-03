/* eslint-disable max-lines */
// TODO: [BO-MAXLINES-002] Further split JSX into sub-components
'use client';

import Image from 'next/image';

import { CategoryFilterCombobox } from '@verone/categories';
import { cn } from '@verone/utils';
import {
  X,
  ShoppingCart,
  Building2,
  User,
  Package,
  Plus,
  Minus,
  Trash2,
  AlertCircle,
  Check,
  Loader2,
  Search,
  Store,
  Layers,
  Eye,
} from 'lucide-react';

import type {
  EnseigneOrganisationCustomer,
  EnseigneIndividualCustomer,
} from '../hooks/use-linkme-enseigne-customers';
import {
  useCreateLinkMeOrderForm,
  type AffiliateSelection,
} from '../hooks/use-create-linkme-order-form';
import { ContactsAddressesSection } from './contacts';

interface CreateLinkMeOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pré-sélectionner un affilié */
  preselectedAffiliateId?: string;
}

/**
 * Modal de création de commande LinkMe
 * Formulaire tout-en-un (style SalesOrderFormModal)
 * Workflow: Type affilié → Affilié → Sélection → Client → Produits → Validation
 */
export function CreateLinkMeOrderModal({
  isOpen,
  onClose,
  preselectedAffiliateId,
}: CreateLinkMeOrderModalProps) {
  const form = useCreateLinkMeOrderForm({
    isOpen,
    onClose,
    preselectedAffiliateId,
  });

  // Destructure for JSX convenience
  const {
    affiliateType,
    setAffiliateType,
    selectedAffiliateId,
    setSelectedAffiliateId,
    selectedSelectionId,
    setSelectedSelectionId,
    customerType,
    setCustomerType,
    selectedCustomerId,
    setSelectedCustomerId,
    cart,
    shippingCostHt,
    setShippingCostHt,
    handlingCostHt,
    setHandlingCostHt,
    insuranceCostHt,
    setInsuranceCostHt,
    fraisTaxRate,
    setFraisTaxRate,
    productSearchQuery,
    setProductSearchQuery,
    selectedSubcategoryId,
    setSelectedSubcategoryId,
    searchQuery,
    setSearchQuery,
    orderDate,
    setOrderDate,
    internalNotes,
    setInternalNotes,
    showCreateForm,
    setShowCreateForm,
    previewSelectionId,
    setPreviewSelectionId,
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
    contactsAddressesData,
    setContactsAddressesData,
    affiliates,
    affiliatesLoading,
    selections,
    selectionsLoading,
    selectionDetails,
    selectionDetailsLoading,
    previewSelection,
    previewLoading,
    selectedAffiliate,
    customers,
    createOrganisation,
    createIndividualCustomer,
    selectedCustomer,
    filteredOrganisations,
    filteredIndividuals,
    filteredSelectionItems,
    cartTotals,
    handleCreateCustomer,
    addProductFromSelection,
    updateQuantity,
    updateUnitPrice,
    updateRetrocessionRate,
    updateCommissionRate,
    removeFromCart,
    canSubmit,
    handleSubmit,
    createOrder,
  } = form;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  Back-office - Canal de vente LinkMe - Nouvelle commande
                </h2>
                <p className="text-sm text-gray-500">
                  Créer une commande depuis une sélection affilié
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content - Formulaire tout-en-un */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Section 1: Type d'affilié */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Type d&apos;affilié *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setAffiliateType('enseigne')}
                  className={cn(
                    'flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left',
                    affiliateType === 'enseigne'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <Store
                    className={cn(
                      'h-5 w-5',
                      affiliateType === 'enseigne'
                        ? 'text-purple-600'
                        : 'text-gray-400'
                    )}
                  />
                  <div>
                    <p
                      className={cn(
                        'font-medium',
                        affiliateType === 'enseigne'
                          ? 'text-purple-700'
                          : 'text-gray-700'
                      )}
                    >
                      Enseigne
                    </p>
                    <p className="text-xs text-gray-500">
                      Chaîne de magasins affiliée
                    </p>
                  </div>
                  {affiliateType === 'enseigne' && (
                    <Check className="h-5 w-5 text-purple-600 ml-auto" />
                  )}
                </button>

                <button
                  onClick={() => setAffiliateType('org_independante')}
                  className={cn(
                    'flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left',
                    affiliateType === 'org_independante'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <Building2
                    className={cn(
                      'h-5 w-5',
                      affiliateType === 'org_independante'
                        ? 'text-purple-600'
                        : 'text-gray-400'
                    )}
                  />
                  <div>
                    <p
                      className={cn(
                        'font-medium',
                        affiliateType === 'org_independante'
                          ? 'text-purple-700'
                          : 'text-gray-700'
                      )}
                    >
                      Organisation indépendante
                    </p>
                    <p className="text-xs text-gray-500">
                      Entreprise affiliée autonome
                    </p>
                  </div>
                  {affiliateType === 'org_independante' && (
                    <Check className="h-5 w-5 text-purple-600 ml-auto" />
                  )}
                </button>
              </div>
            </div>

            {/* Section 2: Sélection affilié */}
            {affiliateType && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Affilié *
                </label>
                {affiliatesLoading ? (
                  <div className="flex items-center gap-2 py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                    <span className="text-sm text-gray-500">
                      Chargement des affiliés...
                    </span>
                  </div>
                ) : affiliates && affiliates.length > 0 ? (
                  <div className="grid gap-2 max-h-40 overflow-y-auto">
                    {affiliates.map(affiliate => (
                      <button
                        key={affiliate.id}
                        onClick={() => setSelectedAffiliateId(affiliate.id)}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left',
                          selectedAffiliateId === affiliate.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        {affiliate.logo_url ? (
                          <Image
                            src={affiliate.logo_url}
                            alt={affiliate.display_name}
                            width={40}
                            height={40}
                            className="w-10 h-10 object-cover rounded"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                            <Store className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium">
                            {affiliate.display_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {affiliate.enseigne_name ??
                              affiliate.organisation_name ??
                              'Affilié LinkMe'}{' '}
                            • {affiliate.selections_count} sélection
                            {affiliate.selections_count > 1 ? 's' : ''}
                          </p>
                        </div>
                        {selectedAffiliateId === affiliate.id && (
                          <Check className="h-5 w-5 text-purple-600" />
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-amber-600 py-2">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    Aucun affilié de ce type disponible
                  </p>
                )}
              </div>
            )}

            {/* Section 3: Sélection (mini-boutique) */}
            {selectedAffiliateId && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  <Layers className="h-4 w-4 inline mr-1" />
                  Sélection (mini-boutique) *
                </label>
                {selectionsLoading ? (
                  <div className="flex items-center gap-2 py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-gray-500">
                      Chargement des sélections...
                    </span>
                  </div>
                ) : selections && selections.length > 0 ? (
                  <div className="grid gap-2 max-h-40 overflow-y-auto">
                    {selections.map((selection: AffiliateSelection) => (
                      <div
                        key={selection.id}
                        className="flex items-center gap-2"
                      >
                        <button
                          onClick={() => setSelectedSelectionId(selection.id)}
                          className={cn(
                            'flex-1 flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left',
                            selectedSelectionId === selection.id
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          )}
                        >
                          <Layers
                            className={cn(
                              'h-5 w-5',
                              selectedSelectionId === selection.id
                                ? 'text-purple-600'
                                : 'text-gray-400'
                            )}
                          />
                          <div className="flex-1">
                            <p className="font-medium">{selection.name}</p>
                            <p className="text-xs text-gray-500">
                              {selection.products_count ?? 0} produit
                              {(selection.products_count ?? 0) > 1 ? 's' : ''}
                            </p>
                          </div>
                          {selectedSelectionId === selection.id && (
                            <Check className="h-5 w-5 text-purple-600" />
                          )}
                        </button>
                        {/* Bouton preview */}
                        <button
                          onClick={() => setPreviewSelectionId(selection.id)}
                          className="p-2 hover:bg-purple-100 rounded-lg transition-colors border border-gray-200"
                          title="Aperçu des produits"
                        >
                          <Eye className="h-4 w-4 text-gray-500 hover:text-purple-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-amber-600 py-2">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    Aucune sélection disponible pour cet affilié
                  </p>
                )}
              </div>
            )}

            {/* Section 4: Client */}
            {selectedSelectionId && selectedAffiliateId && (
              <div className="space-y-3 border-t pt-6">
                <label className="block text-sm font-medium text-gray-700">
                  Client *
                </label>

                {/* Type de client */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setCustomerType('organization');
                      setSelectedCustomerId('');
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
                      setCustomerType('individual');
                      setSelectedCustomerId('');
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
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Rechercher un client..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
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

                {/* Formulaire création client */}
                {showCreateForm && (
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
                        onChange={e => setNewCustomerName(e.target.value)}
                        placeholder="Nom de l'organisation *"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={newCustomerFirstName}
                          onChange={e =>
                            setNewCustomerFirstName(e.target.value)
                          }
                          placeholder="Prénom *"
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <input
                          type="text"
                          value={newCustomerLastName}
                          onChange={e => setNewCustomerLastName(e.target.value)}
                          placeholder="Nom *"
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="email"
                        value={newCustomerEmail}
                        onChange={e => setNewCustomerEmail(e.target.value)}
                        placeholder="Email"
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <input
                        type="tel"
                        value={newCustomerPhone}
                        onChange={e => setNewCustomerPhone(e.target.value)}
                        placeholder="Téléphone"
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Ownership type (organisation uniquement) */}
                    {customerType === 'organization' && (
                      <div className="space-y-1">
                        <label className="block text-xs text-purple-700">
                          Type de point de vente
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setNewOrgOwnershipType(
                                newOrgOwnershipType === 'succursale'
                                  ? null
                                  : 'succursale'
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
                              setNewOrgOwnershipType(
                                newOrgOwnershipType === 'franchise'
                                  ? null
                                  : 'franchise'
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

                    {/* Adresse restaurant (organisation uniquement) */}
                    {customerType === 'organization' && (
                      <div className="space-y-2">
                        <label className="block text-xs text-purple-700">
                          Adresse du restaurant
                        </label>
                        <input
                          type="text"
                          value={newOrgAddress}
                          onChange={e => setNewOrgAddress(e.target.value)}
                          placeholder="Adresse (rue, numéro)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={newOrgPostalCode}
                            onChange={e => setNewOrgPostalCode(e.target.value)}
                            placeholder="Code postal"
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                          <input
                            type="text"
                            value={newOrgCity}
                            onChange={e => setNewOrgCity(e.target.value)}
                            placeholder="Ville"
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          void handleCreateCustomer().catch(error => {
                            console.error(
                              '[CreateLinkMeOrderModal] handleCreateCustomer failed:',
                              error
                            );
                          });
                        }}
                        disabled={
                          createOrganisation.isPending ||
                          createIndividualCustomer.isPending ||
                          (customerType === 'organization' &&
                            !newCustomerName.trim()) ||
                          (customerType === 'individual' &&
                            (!newCustomerFirstName.trim() ||
                              !newCustomerLastName.trim()))
                        }
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        {createOrganisation.isPending ||
                        createIndividualCustomer.isPending ? (
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
                        onClick={() => setShowCreateForm(false)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white text-sm"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}

                {/* Liste clients */}
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {customers.isLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                    </div>
                  ) : customerType === 'organization' ? (
                    filteredOrganisations.length > 0 ? (
                      filteredOrganisations.map(org => (
                        <button
                          key={org.id}
                          onClick={() => setSelectedCustomerId(org.id)}
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
                        onClick={() => setSelectedCustomerId(individual.id)}
                        className={cn(
                          'w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
                          selectedCustomerId === individual.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <User className="h-4 w-4 text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {individual.full_name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {individual.email ??
                              individual.city ??
                              "Pas d'email"}
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
            )}

            {/* Section 4 bis: Résumé client sélectionné */}
            {selectedCustomer && (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      {customerType === 'organization' ? (
                        <Building2 className="h-5 w-5 text-purple-600" />
                      ) : (
                        <User className="h-5 w-5 text-purple-600" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-purple-900">
                        {customerType === 'organization'
                          ? ((selectedCustomer as EnseigneOrganisationCustomer)
                              .name ??
                            (selectedCustomer as EnseigneOrganisationCustomer)
                              .legal_name)
                          : (selectedCustomer as EnseigneIndividualCustomer)
                              .full_name}
                      </p>
                      {'email' in selectedCustomer &&
                        selectedCustomer.email && (
                          <p className="text-sm text-purple-700">
                            📧 {selectedCustomer.email}
                          </p>
                        )}
                      {'phone' in selectedCustomer &&
                        selectedCustomer.phone && (
                          <p className="text-sm text-purple-700">
                            📞 {selectedCustomer.phone}
                          </p>
                        )}
                      {'address_line1' in selectedCustomer &&
                        (selectedCustomer.address_line1 ??
                          selectedCustomer.city) && (
                          <p className="text-sm text-purple-700">
                            📍{' '}
                            {[
                              selectedCustomer.address_line1,
                              selectedCustomer.postal_code,
                              selectedCustomer.city,
                            ]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCustomerId('')}
                    className="text-xs text-purple-600 hover:text-purple-800 underline"
                  >
                    Modifier
                  </button>
                </div>
              </div>
            )}

            {/* Section 5: Contacts & Adresses */}
            {selectedCustomerId && customerType === 'organization' && (
              <ContactsAddressesSection
                organisationId={selectedCustomerId}
                data={contactsAddressesData}
                onUpdate={updates =>
                  setContactsAddressesData(prev => ({ ...prev, ...updates }))
                }
                visible
              />
            )}

            {/* Section 4 ter: Frais additionnels */}
            {selectedSelectionId && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Frais additionnels (HT)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {/* Livraison */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Livraison
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={shippingCostHt ?? ''}
                        onChange={e =>
                          setShippingCostHt(
                            e.target.value ? parseFloat(e.target.value) : 0
                          )
                        }
                        placeholder="0.00"
                        className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                        EUR
                      </span>
                    </div>
                  </div>

                  {/* Manutention */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Manutention
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={handlingCostHt ?? ''}
                        onChange={e =>
                          setHandlingCostHt(
                            e.target.value ? parseFloat(e.target.value) : 0
                          )
                        }
                        placeholder="0.00"
                        className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                        EUR
                      </span>
                    </div>
                  </div>

                  {/* Assurance */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Assurance
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={insuranceCostHt ?? ''}
                        onChange={e =>
                          setInsuranceCostHt(
                            e.target.value ? parseFloat(e.target.value) : 0
                          )
                        }
                        placeholder="0.00"
                        className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                        EUR
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs text-gray-500 mb-2">
                    Taux de TVA sur les frais
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value: 0.2, label: '20%' },
                      { value: 0.1, label: '10%' },
                      { value: 0.055, label: '5,5%' },
                      { value: 0, label: '0%' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFraisTaxRate(opt.value)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg border text-sm transition-all',
                          fraisTaxRate === opt.value
                            ? 'border-purple-500 bg-purple-50 text-purple-700 font-medium'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Section 5: Produits de la sélection */}
            {selectedSelectionId && selectedCustomerId && (
              <div className="space-y-3 border-t pt-6">
                <label className="block text-sm font-medium text-gray-700">
                  <Package className="h-4 w-4 inline mr-1" />
                  Produits disponibles ({selectionDetails?.items?.length ?? 0})
                </label>

                {/* Barre de recherche produits + Filtre catégorie */}
                <div className="flex gap-2">
                  {/* Recherche texte */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={productSearchQuery}
                      onChange={e => setProductSearchQuery(e.target.value)}
                      placeholder="Rechercher (nom ou SKU)..."
                      className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    {productSearchQuery && (
                      <button
                        onClick={() => setProductSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Filtre hiérarchique par catégorie */}
                  <CategoryFilterCombobox
                    value={selectedSubcategoryId}
                    onValueChange={setSelectedSubcategoryId}
                    placeholder="Filtrer par catégorie..."
                    entityType="products"
                    className="w-64"
                  />
                </div>

                {/* Indicateur de filtres actifs */}
                {(productSearchQuery || selectedSubcategoryId) && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>
                      {filteredSelectionItems.length} produit(s) trouvé(s)
                    </span>
                    {(productSearchQuery || selectedSubcategoryId) && (
                      <button
                        onClick={() => {
                          setProductSearchQuery('');
                          setSelectedSubcategoryId(undefined);
                        }}
                        className="text-purple-600 hover:underline"
                      >
                        Réinitialiser les filtres
                      </button>
                    )}
                  </div>
                )}

                {selectionDetailsLoading ? (
                  <div className="flex items-center gap-2 py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-gray-500">
                      Chargement des produits...
                    </span>
                  </div>
                ) : filteredSelectionItems.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                    {filteredSelectionItems.map(item => {
                      const isInCart = cart.some(
                        c => c.product_id === item.product_id
                      );
                      // selling_price_ht déjà calculé en DB (GENERATED column)
                      const sellingPrice =
                        item.selling_price_ht ?? item.base_price_ht;
                      return (
                        <button
                          key={item.id}
                          onClick={() => addProductFromSelection(item)}
                          className={cn(
                            'flex items-center gap-3 p-2 rounded-lg border transition-all text-left',
                            isInCart
                              ? 'border-green-300 bg-green-50'
                              : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                          )}
                        >
                          {item.product_image_url ? (
                            <Image
                              src={item.product_image_url}
                              alt={item.product?.name ?? ''}
                              width={40}
                              height={40}
                              className="w-10 h-10 object-cover rounded"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                              <Package className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {item.product?.name ?? 'Produit'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {sellingPrice.toFixed(2)}€ HT
                              {item.margin_rate > 0 && (
                                <> • Marge {item.margin_rate.toFixed(0)}%</>
                              )}
                            </p>
                          </div>
                          {isInCart ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Plus className="h-4 w-4 text-purple-600" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 py-2">
                    {productSearchQuery.trim()
                      ? `Aucun produit ne correspond à "${productSearchQuery}"`
                      : 'Aucun produit dans cette sélection'}
                  </p>
                )}
              </div>
            )}

            {/* Section 6: Panier */}
            {cart.length > 0 && (
              <div className="space-y-3 border-t pt-6">
                <p className="text-sm font-medium text-gray-700">
                  Panier ({cart.length} produit{cart.length > 1 ? 's' : ''})
                </p>
                <div className="space-y-2">
                  {cart.map(item => (
                    <div
                      key={item.id}
                      className={cn(
                        'p-3 rounded-lg',
                        item.is_affiliate_product
                          ? 'bg-blue-50 border border-blue-200'
                          : 'bg-gray-50'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Package className="h-4 w-4 text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {item.product_name}
                            {item.is_affiliate_product && (
                              <span className="ml-2 text-xs font-normal text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                                Produit affilié
                              </span>
                            )}
                          </p>
                          {item.is_affiliate_product ? (
                            <>
                              <p className="text-xs text-gray-500">
                                {item.unit_price_ht.toFixed(2)}€ HT ×{' '}
                                {item.quantity} ={' '}
                                {(item.unit_price_ht * item.quantity).toFixed(
                                  2
                                )}
                                € HT
                              </p>
                              <p className="text-xs text-blue-600">
                                Commission Verone:{' '}
                                {(item.affiliate_commission_rate * 100).toFixed(
                                  0
                                )}
                                % ={' '}
                                {(
                                  item.unit_price_ht *
                                  item.quantity *
                                  item.affiliate_commission_rate
                                ).toFixed(2)}
                                €
                              </p>
                              <p className="text-xs text-green-600">
                                Revenu net affilié:{' '}
                                {(
                                  item.unit_price_ht *
                                  item.quantity *
                                  (1 - item.affiliate_commission_rate)
                                ).toFixed(2)}
                                €
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-xs text-gray-500">
                                {item.unit_price_ht.toFixed(2)}€ HT ×{' '}
                                {item.quantity} ={' '}
                                {(item.unit_price_ht * item.quantity).toFixed(
                                  2
                                )}
                                € HT
                              </p>
                              <p className="text-xs text-orange-600">
                                Marge:{' '}
                                {(item.base_price_ht > 0
                                  ? ((item.unit_price_ht - item.base_price_ht) /
                                      item.base_price_ht) *
                                    100
                                  : 0
                                ).toFixed(1)}
                                % (
                                {(
                                  (item.unit_price_ht - item.base_price_ht) *
                                  item.quantity
                                ).toFixed(2)}
                                €)
                              </p>
                              {/* Édition prix + commission (produits catalogue, back-office uniquement) */}
                              <div className="mt-1 flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <label className="text-xs text-gray-600 whitespace-nowrap">
                                    Prix vente HT
                                  </label>
                                  <input
                                    type="number"
                                    value={item.unit_price_ht}
                                    onChange={e =>
                                      updateUnitPrice(
                                        item.id,
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    min={0}
                                    step={0.01}
                                    className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                  />
                                  <span className="text-xs text-gray-500">
                                    €
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <label className="text-xs text-gray-600 whitespace-nowrap">
                                    Marge
                                  </label>
                                  <input
                                    type="number"
                                    value={parseFloat(
                                      (item.retrocession_rate * 100).toFixed(2)
                                    )}
                                    onChange={e =>
                                      updateRetrocessionRate(
                                        item.id,
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    min={0}
                                    max={100}
                                    step={0.5}
                                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                  />
                                  <span className="text-xs text-gray-500">
                                    %
                                  </span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 hover:bg-red-100 rounded text-red-600 ml-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {/* Inputs éditables pour produits affiliés */}
                      {item.is_affiliate_product && (
                        <div className="mt-2 pt-2 border-t border-blue-200 flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-600 whitespace-nowrap">
                              Prix vente HT
                            </label>
                            <input
                              type="number"
                              value={item.unit_price_ht}
                              onChange={e =>
                                updateUnitPrice(
                                  item.id,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              min={0}
                              step={0.01}
                              className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-xs text-gray-500">€</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-600 whitespace-nowrap">
                              Commission
                            </label>
                            <input
                              type="number"
                              value={Math.round(
                                item.affiliate_commission_rate * 100
                              )}
                              onChange={e =>
                                updateCommissionRate(
                                  item.id,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              min={0}
                              max={100}
                              step={1}
                              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-xs text-gray-500">%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Totaux */}
                <div className="border-t border-gray-200 pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total HT</span>
                    <span className="font-medium">
                      {cartTotals.totalHt.toFixed(2)}€
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">TVA</span>
                    <span>{cartTotals.totalTva.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span>Total TTC</span>
                    <span>{cartTotals.totalTtc.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-sm text-orange-600">
                    <span>Marge affilié HT</span>
                    <span>-{cartTotals.totalRetrocession.toFixed(2)}€</span>
                  </div>
                </div>
              </div>
            )}

            {/* Section 7: Date de commande + Notes */}
            {selectedSelectionId && (
              <div className="space-y-2 border-t pt-6">
                <label className="block text-sm font-medium text-gray-700">
                  Date de commande <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={orderDate}
                  onChange={e => setOrderDate(e.target.value)}
                  required
                  className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            {selectedSelectionId && (
              <div className="space-y-2 border-t pt-6">
                <label className="block text-sm font-medium text-gray-700">
                  Notes internes (optionnel)
                </label>
                <textarea
                  value={internalNotes}
                  onChange={e => setInternalNotes(e.target.value)}
                  placeholder="Notes visibles uniquement par l'équipe..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            {/* Section 7 bis: Récapitulatif - Design 2025 */}
            {canSubmit && (
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
                  Récapitulatif de la commande
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  {/* Card Client */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-3">
                      {customerType === 'organization' ? (
                        <Building2 className="h-4 w-4 text-slate-400" />
                      ) : (
                        <User className="h-4 w-4 text-slate-400" />
                      )}
                      <span className="text-xs font-medium text-slate-500 uppercase">
                        Client
                      </span>
                    </div>
                    <p className="font-medium text-slate-900">
                      {customerType === 'organization'
                        ? ((selectedCustomer as EnseigneOrganisationCustomer)
                            ?.name ??
                          (selectedCustomer as EnseigneOrganisationCustomer)
                            ?.legal_name)
                        : (selectedCustomer as EnseigneIndividualCustomer)
                            ?.full_name}
                    </p>
                    {selectedCustomer &&
                      'email' in selectedCustomer &&
                      selectedCustomer.email && (
                        <p className="text-sm text-slate-600 mt-1">
                          {selectedCustomer.email}
                        </p>
                      )}
                    {selectedCustomer &&
                      'address_line1' in selectedCustomer &&
                      (selectedCustomer.address_line1 ??
                        selectedCustomer.city) && (
                        <p className="text-sm text-slate-500 mt-1">
                          {[
                            selectedCustomer.address_line1,
                            selectedCustomer.postal_code,
                            selectedCustomer.city,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      )}
                  </div>

                  {/* Card Affilié */}
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Store className="h-4 w-4 text-purple-400" />
                      <span className="text-xs font-medium text-purple-500 uppercase">
                        Affilié
                      </span>
                    </div>
                    <p className="font-medium text-purple-900">
                      {selectedAffiliate?.display_name}
                    </p>
                    <p className="text-sm text-purple-600">
                      {affiliateType === 'enseigne'
                        ? 'Enseigne'
                        : 'Organisation indépendante'}
                    </p>
                  </div>
                </div>

                {/* Ligne Produits */}
                <div className="p-4 bg-white rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-slate-400" />
                      <span className="text-xs font-medium text-slate-500 uppercase">
                        {cart.length} Produit{cart.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">
                      TVA par ligne
                    </span>
                  </div>

                  {/* Mini liste produits */}
                  <div className="space-y-2 max-h-24 overflow-y-auto">
                    {cart.map(item => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-slate-700 truncate flex-1">
                          {item.product_name} × {item.quantity}
                        </span>
                        <span className="text-slate-900 font-medium ml-2">
                          {(item.unit_price_ht * item.quantity).toFixed(2)}€
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totaux - Design épuré */}
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Total HT</span>
                      <span>{cartTotals.totalHt.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>TVA</span>
                      <span>{cartTotals.totalTva.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between text-base font-semibold text-slate-900 pt-2 border-t">
                      <span>Total TTC</span>
                      <span>{cartTotals.totalTtc.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between text-sm text-orange-600 pt-1">
                      <span>Marge affilié HT</span>
                      <span>-{cartTotals.totalRetrocession.toFixed(2)}€</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Erreur */}
            {createOrder.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                <p className="text-sm text-red-700">
                  {createOrder.error instanceof Error
                    ? createOrder.error.message
                    : 'Erreur lors de la création'}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={() => {
                void handleSubmit().catch(error => {
                  console.error(
                    '[CreateLinkMeOrderModal] handleSubmit failed:',
                    error
                  );
                });
              }}
              disabled={!canSubmit || createOrder.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createOrder.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Créer la commande
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Dialog Preview Sélection */}
      {previewSelectionId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden mx-4">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-lg">
                Aperçu : {previewSelection?.name ?? 'Chargement...'}
              </h3>
              <button
                onClick={() => setPreviewSelectionId(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Contenu */}
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {previewLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                </div>
              ) : !previewSelection?.items?.length ? (
                <div className="text-center py-8 text-gray-500">
                  Aucun produit dans cette sélection
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {previewSelection.items.map(item => {
                    // selling_price_ht déjà calculé en DB (GENERATED column)
                    const sellingPrice =
                      item.selling_price_ht ?? item.base_price_ht;
                    return (
                      <div
                        key={item.id}
                        className="border rounded-lg p-2 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        {/* Image petite 64x64 */}
                        <div className="w-16 h-16 mx-auto mb-2 overflow-hidden rounded">
                          {item.product_image_url ? (
                            <Image
                              src={item.product_image_url}
                              alt={item.product?.name ?? 'Produit'}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        {/* Nom tronqué */}
                        <p className="text-xs font-medium text-center truncate">
                          {item.product?.name ?? 'Produit'}
                        </p>
                        {/* Prix */}
                        <p className="text-xs text-gray-500 text-center">
                          {sellingPrice.toFixed(2)}€
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t flex justify-end">
              <button
                onClick={() => setPreviewSelectionId(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
