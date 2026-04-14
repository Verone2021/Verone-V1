'use client';

/**
 * BillingAddressSection - Section adresse de facturation (SECTION 1)
 *
 * @module BillingAddressSection
 * @since 2026-04-14
 */

import { Card, Checkbox, Label, Button, cn } from '@verone/ui';
import {
  MapPin,
  Building2,
  FileText,
  Check,
  Save,
  Loader2,
} from 'lucide-react';

import type {
  BillingAddressData,
  PartialAddressData,
} from '../../schemas/order-form.schema';
import { AddressForm } from '../contacts/AddressForm';
import {
  RestaurantAddressCard,
  ParentAddressCard,
  NewAddressCard,
} from './BillingAddressCards';

// ============================================================================
// TYPES
// ============================================================================

interface RestaurantInfo {
  id: string;
  name: string | null;
  city: string | null;
  country: string | null;
  legalName: string | null;
  tradeName: string | null;
  addressLine1: string | null;
  postalCode: string | null;
  billingCity: string | null;
  siret: string | null;
  vatNumber: string | null;
}

interface ParentOrg {
  id: string;
  trade_name?: string | null;
  legal_name?: string | null;
}

interface ParentPrimaryAddress {
  addressLine1?: string | null;
  postalCode?: string | null;
  city?: string | null;
  siret?: string | null;
}

interface BillingAddressSectionProps {
  billingAddress: BillingAddressData;
  restaurantInfo: RestaurantInfo | null;
  parentOrg: ParentOrg | null | undefined;
  parentPrimaryAddress: ParentPrimaryAddress | null | undefined;
  showParentAddress: boolean;
  isLoading: boolean;
  isEditMode: boolean;
  isBillingAddressComplete: boolean;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onSelectRestaurantAddress: () => void;
  onSelectParentAddress: () => void;
  onCreateNewAddress: () => void;
  onAddressChange: (address: PartialAddressData) => void;
  onReplaceExistingChange: (checked: boolean) => void;
  onSetAsDefaultChange: (checked: boolean) => void;
  onSaveAddress: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function BillingAddressSection({
  billingAddress,
  restaurantInfo,
  parentOrg,
  parentPrimaryAddress,
  showParentAddress,
  isLoading,
  isEditMode,
  isBillingAddressComplete,
  hasUnsavedChanges,
  isSaving,
  onSelectRestaurantAddress,
  onSelectParentAddress,
  onCreateNewAddress,
  onAddressChange,
  onReplaceExistingChange,
  onSetAsDefaultChange,
  onSaveAddress,
}: BillingAddressSectionProps) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            isBillingAddressComplete
              ? 'bg-green-100 text-green-600'
              : 'bg-amber-100 text-amber-600'
          )}
        >
          {isBillingAddressComplete ? (
            <Check className="h-5 w-5" />
          ) : (
            <MapPin className="h-5 w-5" />
          )}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">
            Adresse de Facturation
          </h3>
          <p className="text-sm text-gray-500">
            Adresse pour l&apos;envoi de la facture
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GAUCHE: Formulaire avec design distinctif */}
        <Card
          className={cn(
            'p-4 transition-all',
            isEditMode || billingAddress.mode === 'new_billing'
              ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200'
              : 'bg-gray-50 border-dashed border-gray-300'
          )}
        >
          {/* En-tete distinctif */}
          {(isEditMode || billingAddress.mode === 'new_billing') && (
            <div className="flex items-center gap-3 pb-4 border-b border-blue-200 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900">
                  Adresse de facturation
                </h4>
                <p className="text-xs text-blue-600">
                  Ces informations seront utilisees pour la facture
                </p>
              </div>
            </div>
          )}

          {/* Message si aucune selection */}
          {!isEditMode && billingAddress.mode !== 'new_billing' && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <MapPin className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 mb-1">
                Aucune adresse selectionnee
              </p>
              <p className="text-xs text-gray-400">
                Cliquez sur une adresse a droite pour la selectionner
              </p>
            </div>
          )}

          {/* Formulaire d'adresse */}
          {(isEditMode || billingAddress.mode === 'new_billing') && (
            <>
              <AddressForm
                address={billingAddress.customAddress}
                onChange={onAddressChange}
                showLegalFields
                idPrefix="billingAddress"
              />

              {/* Checkboxes pour nouvelle adresse */}
              {billingAddress.mode === 'new_billing' && (
                <div className="mt-4 pt-4 border-t border-blue-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="replaceExistingAddress"
                      checked={billingAddress.replaceExistingAddress}
                      onCheckedChange={onReplaceExistingChange}
                    />
                    <Label
                      htmlFor="replaceExistingAddress"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Remplacer l&apos;adresse existante du restaurant
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="setAsDefaultAddress"
                      checked={billingAddress.setAsDefault}
                      onCheckedChange={onSetAsDefaultChange}
                    />
                    <Label
                      htmlFor="setAsDefaultAddress"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Definir comme adresse par defaut
                    </Label>
                  </div>
                </div>
              )}

              {/* Bouton Sauvegarder - UNIQUEMENT si modifications detectees */}
              {hasUnsavedChanges && billingAddress.sourceOrganisationId && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <Button
                    onClick={onSaveAddress}
                    disabled={isSaving}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Sauvegarde en cours...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Sauvegarder les modifications
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-blue-600 mt-2 text-center">
                    Les modifications seront enregistrees dans la fiche
                    restaurant
                  </p>
                </div>
              )}
            </>
          )}
        </Card>

        {/* DROITE: Choix d'adresse (restaurant, maison mere, nouvelle) */}
        <Card className="p-4">
          <div className="flex items-center gap-2 pb-3 border-b mb-4">
            <Building2 className="h-4 w-4 text-blue-600" />
            <h4 className="font-medium text-gray-700">Adresses disponibles</h4>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
            </div>
          )}

          {!isLoading && (
            <div className="space-y-3">
              {/* Adresse restaurant */}
              {restaurantInfo && (
                <RestaurantAddressCard
                  onClick={onSelectRestaurantAddress}
                  isActive={billingAddress.mode === 'restaurant_address'}
                  restaurantName={
                    restaurantInfo.tradeName ?? restaurantInfo.name
                  }
                  legalName={restaurantInfo.legalName}
                  addressLine1={restaurantInfo.addressLine1}
                  postalCode={restaurantInfo.postalCode}
                  city={restaurantInfo.billingCity ?? restaurantInfo.city}
                  siret={restaurantInfo.siret}
                  isIncomplete={!restaurantInfo.siret}
                />
              )}

              {/* Adresse maison mere (si propre/succursale) */}
              {showParentAddress && parentOrg && parentPrimaryAddress && (
                <ParentAddressCard
                  onClick={onSelectParentAddress}
                  isActive={billingAddress.mode === 'parent_address'}
                  parentName={
                    parentOrg.trade_name ?? parentOrg.legal_name ?? null
                  }
                  legalName={parentOrg.legal_name ?? null}
                  addressLine1={parentPrimaryAddress.addressLine1 ?? null}
                  postalCode={parentPrimaryAddress.postalCode ?? null}
                  city={parentPrimaryAddress.city ?? null}
                  siret={parentPrimaryAddress.siret ?? null}
                  isIncomplete={!parentPrimaryAddress.siret}
                />
              )}

              {/* Nouvelle adresse */}
              <NewAddressCard
                onClick={onCreateNewAddress}
                isActive={billingAddress.mode === 'new_billing'}
              />
            </div>
          )}
        </Card>
      </div>
    </Card>
  );
}
