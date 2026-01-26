'use client';

/**
 * BillingAddressSection - Section Adresse de Facturation
 *
 * IMPORTANT: L'organisation est FIXE (= restaurant de l'étape 1)
 * On gère uniquement les ADRESSES de facturation pour ce restaurant
 *
 * Comportement:
 * - Affiche l'organisation (restaurant) comme carte fixe non cliquable
 * - Grille d'adresses: "Adresse restaurant" (défaut), existantes, "+ Nouvelle"
 * - Formulaire d'adresse si "Nouvelle" sélectionnée
 * - Option "Définir par défaut"
 *
 * @module BillingAddressSection
 * @since 2026-01-20
 */

import { useState, useCallback, useMemo } from 'react';

import {
  Card,
  cn,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Checkbox,
  Label,
} from '@verone/ui';
import {
  Building2,
  ChevronDown,
  Check,
  MapPin,
  AlertCircle,
} from 'lucide-react';

import {
  useEntityAddresses,
  type Address,
} from '@/lib/hooks/use-entity-addresses';

import { AddressForm } from './AddressForm';
import { AddressGrid } from './AddressGrid';
import type { PartialAddressData } from '../../schemas/order-form.schema';

// ============================================================================
// TYPES
// ============================================================================

interface RestaurantInfo {
  id: string;
  name: string | null;
  city: string | null;
  country: string | null;
  addressLine1?: string | null;
  postalCode?: string | null;
}

export type BillingAddressMode =
  | 'restaurant_address'
  | 'existing_billing'
  | 'new_billing';

export interface BillingAddressData {
  /** Mode de sélection d'adresse */
  mode: BillingAddressMode;
  /** ID de l'adresse existante sélectionnée */
  existingAddressId: string | null;
  /** Données de l'adresse personnalisée (si nouvelle) */
  customAddress: PartialAddressData | null;
  /** Enregistrer comme défaut */
  setAsDefault: boolean;
}

interface BillingAddressSectionProps {
  /** Données d'adresse de facturation actuelles */
  billingAddress: BillingAddressData;
  /** Callback pour mettre à jour les données */
  onUpdate: (data: Partial<BillingAddressData>) => void;
  /** Restaurant de l'étape 1 (FIXE) */
  restaurant: RestaurantInfo | null;
  /** Section ouverte par défaut */
  defaultOpen?: boolean;
}

// ============================================================================
// SUB-COMPONENT: Fixed Organisation Card (non-clickable)
// ============================================================================

interface FixedOrganisationCardProps {
  restaurant: RestaurantInfo;
}

function FixedOrganisationCard({ restaurant }: FixedOrganisationCardProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Organisation de facturation (fixe)
      </label>
      <Card className="p-3 bg-gray-50 border-gray-200">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-4 w-4 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight">
              {restaurant.name || 'Restaurant'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {restaurant.city || 'Adresse non renseignée'}
              {restaurant.country &&
                restaurant.country !== 'FR' &&
                ` (${restaurant.country})`}
            </p>
            {restaurant.addressLine1 && (
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {restaurant.addressLine1}
              </p>
            )}
          </div>
          <div className="flex-shrink-0">
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
              Fixé
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function BillingAddressSection({
  billingAddress,
  onUpdate,
  restaurant,
  defaultOpen = false,
}: BillingAddressSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Fetch existing billing addresses for this restaurant
  const { data: addressesData, isLoading: addressesLoading } =
    useEntityAddresses('organisation', restaurant?.id || null, 'billing');

  // Check if section is complete
  const isComplete = useMemo(() => {
    switch (billingAddress.mode) {
      case 'restaurant_address':
        return true;
      case 'existing_billing':
        return !!billingAddress.existingAddressId;
      case 'new_billing':
        return !!(
          billingAddress.customAddress?.addressLine1 &&
          billingAddress.customAddress?.postalCode &&
          billingAddress.customAddress?.city
        );
      default:
        return false;
    }
  }, [billingAddress]);

  // Handle "restaurant address" selection
  const handleSelectRestaurantAddress = useCallback(() => {
    onUpdate({
      mode: 'restaurant_address',
      existingAddressId: null,
      customAddress: null,
    });
  }, [onUpdate]);

  // Handle existing address selection
  const handleSelectExistingAddress = useCallback(
    (address: Address) => {
      onUpdate({
        mode: 'existing_billing',
        existingAddressId: address.id,
        customAddress: null,
      });
    },
    [onUpdate]
  );

  // Handle "new address" selection
  const handleCreateNew = useCallback(() => {
    onUpdate({
      mode: 'new_billing',
      existingAddressId: null,
      customAddress: {
        addressLine1: '',
        postalCode: '',
        city: '',
        country: restaurant?.country || 'FR',
      },
    });
  }, [onUpdate, restaurant?.country]);

  // Handle address form change
  const handleAddressChange = useCallback(
    (address: PartialAddressData) => {
      onUpdate({ customAddress: address });
    },
    [onUpdate]
  );

  // Handle "save as default" change
  const handleSetAsDefaultChange = useCallback(
    (checked: boolean) => {
      onUpdate({ setAsDefault: checked });
    },
    [onUpdate]
  );

  // Get selected address info for display
  const selectedAddress = useMemo(() => {
    if (
      billingAddress.mode === 'existing_billing' &&
      billingAddress.existingAddressId
    ) {
      return addressesData?.all.find(
        a => a.id === billingAddress.existingAddressId
      );
    }
    return null;
  }, [
    billingAddress.mode,
    billingAddress.existingAddressId,
    addressesData?.all,
  ]);

  // Existing billing addresses (excluding default restaurant address)
  const billingAddresses = addressesData?.billing || [];

  if (!restaurant) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="overflow-hidden">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  isComplete
                    ? 'bg-green-100 text-green-600'
                    : 'bg-amber-100 text-amber-600'
                )}
              >
                {isComplete ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <MapPin className="h-5 w-5" />
                )}
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">
                  Adresse de Facturation
                </h3>
                <p className="text-sm text-gray-500">Adresse pour la facture</p>
              </div>
            </div>
            <ChevronDown
              className={cn(
                'h-5 w-5 text-gray-400 transition-transform',
                isOpen && 'rotate-180'
              )}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 pt-0 border-t space-y-6">
            {/* Fixed Organisation Card */}
            <FixedOrganisationCard restaurant={restaurant} />

            {/* Address Selection Grid */}
            {addressesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              </div>
            ) : (
              <AddressGrid
                addresses={billingAddresses}
                selectedId={billingAddress.existingAddressId}
                onSelect={handleSelectExistingAddress}
                onCreateNew={handleCreateNew}
                isCreatingNew={billingAddress.mode === 'new_billing'}
                showRestaurantAddressOption
                onSelectRestaurantAddress={handleSelectRestaurantAddress}
                isRestaurantAddressActive={
                  billingAddress.mode === 'restaurant_address'
                }
                restaurantName={restaurant.name || undefined}
                label="Sélectionner l'adresse de facturation"
              />
            )}

            {/* Selected existing address summary */}
            {billingAddress.mode === 'existing_billing' && selectedAddress && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-700">
                    <p className="font-medium">
                      {selectedAddress.label || selectedAddress.addressLine1}
                    </p>
                    <p className="text-xs">
                      {selectedAddress.addressLine1},{' '}
                      {selectedAddress.postalCode} {selectedAddress.city}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Restaurant address info */}
            {billingAddress.mode === 'restaurant_address' && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-700">
                    <p className="font-medium">Adresse du restaurant</p>
                    <p className="text-xs">
                      La facture sera adressée à {restaurant.name} (
                      {restaurant.city})
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* New address form */}
            {billingAddress.mode === 'new_billing' && (
              <div className="pt-4 border-t space-y-4">
                <h4 className="text-sm font-medium text-gray-700">
                  Nouvelle adresse de facturation
                </h4>
                <AddressForm
                  address={billingAddress.customAddress}
                  onChange={handleAddressChange}
                  showLegalFields
                  showSaveAsDefault
                  saveAsDefault={billingAddress.setAsDefault}
                  onSaveAsDefaultChange={handleSetAsDefaultChange}
                  idPrefix="billingAddress"
                />
              </div>
            )}

            {/* Set as default for existing address selection */}
            {billingAddress.mode === 'existing_billing' && (
              <div className="flex items-center gap-2 pt-2">
                <Checkbox
                  id="billingAddress-setDefault"
                  checked={billingAddress.setAsDefault}
                  onCheckedChange={handleSetAsDefaultChange}
                />
                <Label
                  htmlFor="billingAddress-setDefault"
                  className="text-sm font-normal cursor-pointer"
                >
                  Définir comme adresse par défaut
                </Label>
              </div>
            )}

            {/* Info note */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p>
                    L&apos;organisation facturée est{' '}
                    <strong>{restaurant.name}</strong>. Vous pouvez choisir une
                    adresse différente pour la livraison de la facture.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export default BillingAddressSection;
