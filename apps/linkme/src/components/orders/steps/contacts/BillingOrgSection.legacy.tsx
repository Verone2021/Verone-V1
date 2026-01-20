'use client';

/**
 * BillingOrgSection - Section Organisation de Facturation
 *
 * Gère UNIQUEMENT l'organisation de facturation (entite juridique):
 * - Sélection via cartes: Restaurant actuel, Org mère (si succursale), Autre
 * - Formulaire "Autre" avec SIRET, TVA, adresse
 *
 * NOTE: Le CONTACT de facturation est géré séparément dans ContactsStep
 *
 * @module BillingOrgSection
 * @since 2026-01-20
 */

import { useState, useCallback, useMemo } from 'react';

import {
  Card,
  Input,
  Label,
  Checkbox,
  cn,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@verone/ui';
import { Building2, ChevronDown, Check, AlertCircle } from 'lucide-react';

import { OrganisationGrid } from './OrganisationGrid.legacy';
import type { BillingOrganisation } from './OrganisationCard.legacy';

// ============================================================================
// TYPES
// ============================================================================

interface ParentOrganisation {
  id: string;
  legal_name: string | null;
  trade_name: string | null;
  siret?: string | null;
  vat_number?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  postal_code?: string | null;
  city?: string | null;
  country?: string | null;
  billing_address_line1?: string | null;
  billing_address_line2?: string | null;
  billing_postal_code?: string | null;
  billing_city?: string | null;
  billing_country?: string | null;
}

interface RestaurantOrg {
  id: string;
  legal_name: string | null;
  trade_name: string | null;
  siret: string | null;
  vat_number?: string | null;
  address_line1: string | null;
  address_line2?: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
}

export interface BillingOrgData {
  /** Mode de sélection */
  mode: 'restaurant' | 'parent_org' | 'other';
  /** ID de l'organisation sélectionnée (restaurant ou parent) */
  organisationId: string | null;
  /** Données de l'organisation (si autre) */
  customOrganisation: {
    legalName: string;
    tradeName?: string;
    siret: string;
    vatNumber?: string;
    addressLine1: string;
    addressLine2?: string;
    postalCode: string;
    city: string;
    country: string;
  } | null;
  /** Enregistrer comme défaut */
  saveAsDefault: boolean;
}

interface BillingOrgSectionProps {
  /** Données de facturation actuelles */
  billingOrg: BillingOrgData;
  /** Callback pour mettre à jour les données */
  onUpdate: (data: Partial<BillingOrgData>) => void;
  /** Restaurant actuel (pour option facturation) */
  restaurant: RestaurantOrg | null;
  /** Organisation mère (si succursale) */
  parentOrganisation: ParentOrganisation | null;
  /** Est-ce une franchise ? (pas d'option org mère) */
  isFranchise: boolean;
  /** Section ouverte par défaut */
  defaultOpen?: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

function buildOrganisationsOptions(
  restaurant: RestaurantOrg | null,
  parentOrg: ParentOrganisation | null,
  isFranchise: boolean
): BillingOrganisation[] {
  const options: BillingOrganisation[] = [];

  // Option 1: Restaurant actuel
  if (restaurant) {
    options.push({
      id: restaurant.id,
      type: 'restaurant',
      legalName: restaurant.legal_name,
      tradeName: restaurant.trade_name,
      siret: restaurant.siret,
      vatNumber: restaurant.vat_number,
      addressLine1: restaurant.address_line1,
      addressLine2: restaurant.address_line2,
      postalCode: restaurant.postal_code,
      city: restaurant.city,
      country: restaurant.country,
    });
  }

  // Option 2: Organisation mère (succursale uniquement)
  if (!isFranchise && parentOrg) {
    // Use billing address if available, otherwise main address
    const hasBillingAddress =
      parentOrg.billing_address_line1 && parentOrg.billing_city;

    options.push({
      id: parentOrg.id,
      type: 'parent_org',
      legalName: parentOrg.legal_name,
      tradeName: parentOrg.trade_name,
      siret: parentOrg.siret ?? null,
      vatNumber: parentOrg.vat_number ?? null,
      addressLine1: hasBillingAddress
        ? (parentOrg.billing_address_line1 ?? null)
        : (parentOrg.address_line1 ?? null),
      addressLine2: hasBillingAddress
        ? (parentOrg.billing_address_line2 ?? null)
        : (parentOrg.address_line2 ?? null),
      postalCode: hasBillingAddress
        ? (parentOrg.billing_postal_code ?? null)
        : (parentOrg.postal_code ?? null),
      city: hasBillingAddress ? (parentOrg.billing_city ?? null) : (parentOrg.city ?? null),
      country: hasBillingAddress
        ? (parentOrg.billing_country ?? null)
        : (parentOrg.country ?? null),
    });
  }

  return options;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function BillingOrgSection({
  billingOrg,
  onUpdate,
  restaurant,
  parentOrganisation,
  isFranchise,
  defaultOpen = false,
}: BillingOrgSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Build available organisations
  const availableOrgs = useMemo(
    () => buildOrganisationsOptions(restaurant, parentOrganisation, isFranchise),
    [restaurant, parentOrganisation, isFranchise]
  );

  // Check if section is complete
  const isComplete = useMemo(() => {
    if (billingOrg.mode === 'restaurant' || billingOrg.mode === 'parent_org') {
      return !!billingOrg.organisationId;
    }
    // Mode "other" requires custom organisation data
    return !!(
      billingOrg.customOrganisation?.legalName &&
      billingOrg.customOrganisation?.siret &&
      billingOrg.customOrganisation?.addressLine1 &&
      billingOrg.customOrganisation?.postalCode &&
      billingOrg.customOrganisation?.city
    );
  }, [billingOrg]);

  // Get selected org ID for grid
  const selectedOrgId = useMemo(() => {
    if (billingOrg.mode === 'other') return null;
    return billingOrg.organisationId;
  }, [billingOrg.mode, billingOrg.organisationId]);

  // Handle organisation selection
  const handleOrgSelect = useCallback(
    (org: BillingOrganisation) => {
      onUpdate({
        mode: org.type as 'restaurant' | 'parent_org',
        organisationId: org.id,
        customOrganisation: null,
      });
    },
    [onUpdate]
  );

  // Handle "other" selection
  const handleSelectOther = useCallback(() => {
    onUpdate({
      mode: 'other',
      organisationId: null,
      customOrganisation: {
        legalName: '',
        tradeName: '',
        siret: '',
        vatNumber: '',
        addressLine1: '',
        addressLine2: '',
        postalCode: '',
        city: '',
        country: 'FR',
      },
    });
  }, [onUpdate]);

  // Handle custom org field change
  const handleCustomOrgChange = useCallback(
    (field: string, value: string) => {
      onUpdate({
        customOrganisation: {
          ...(billingOrg.customOrganisation || {
            legalName: '',
            siret: '',
            addressLine1: '',
            postalCode: '',
            city: '',
            country: 'FR',
          }),
          [field]: value,
        },
      });
    },
    [billingOrg.customOrganisation, onUpdate]
  );

  // Handle save as default change
  const handleSaveAsDefaultChange = useCallback(
    (checked: boolean) => {
      onUpdate({ saveAsDefault: checked });
    },
    [onUpdate]
  );

  // Get selected org info for display
  const selectedOrg = useMemo(() => {
    if (billingOrg.mode === 'other') return null;
    return availableOrgs.find((org) => org.id === billingOrg.organisationId);
  }, [billingOrg.mode, billingOrg.organisationId, availableOrgs]);

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
                  <Building2 className="h-5 w-5" />
                )}
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">
                  Organisation de Facturation
                </h3>
                <p className="text-sm text-gray-500">
                  Entite a facturer (SIRET, adresse)
                </p>
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
            {/* Organisation Selection Grid */}
            <OrganisationGrid
              organisations={availableOrgs}
              selectedId={selectedOrgId}
              onSelect={handleOrgSelect}
              onSelectOther={handleSelectOther}
              isOtherSelected={billingOrg.mode === 'other'}
              label="Selectionner l'organisation a facturer"
            />

            {/* Selected organisation summary */}
            {selectedOrg && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-700">
                    <p className="font-medium">
                      {selectedOrg.tradeName || selectedOrg.legalName}
                    </p>
                    {selectedOrg.siret && (
                      <p className="text-xs">SIRET: {selectedOrg.siret}</p>
                    )}
                    {selectedOrg.addressLine1 && (
                      <p className="text-xs">
                        {selectedOrg.addressLine1}, {selectedOrg.postalCode}{' '}
                        {selectedOrg.city}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Custom organisation form (if "other" selected) */}
            {billingOrg.mode === 'other' && (
              <div className="pt-4 border-t space-y-4">
                <h4 className="text-sm font-medium text-gray-700">
                  Coordonnees de l&apos;organisation
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Raison sociale */}
                  <div className="space-y-2">
                    <Label htmlFor="billingOrg-legalName">
                      Raison sociale <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="billingOrg-legalName"
                      type="text"
                      value={billingOrg.customOrganisation?.legalName || ''}
                      onChange={(e) =>
                        handleCustomOrgChange('legalName', e.target.value)
                      }
                      placeholder="SAS Restaurant Lyon"
                    />
                  </div>

                  {/* Nom commercial */}
                  <div className="space-y-2">
                    <Label htmlFor="billingOrg-tradeName">Nom commercial</Label>
                    <Input
                      id="billingOrg-tradeName"
                      type="text"
                      value={billingOrg.customOrganisation?.tradeName || ''}
                      onChange={(e) =>
                        handleCustomOrgChange('tradeName', e.target.value)
                      }
                      placeholder="La Belle Vue"
                    />
                  </div>

                  {/* SIRET */}
                  <div className="space-y-2">
                    <Label htmlFor="billingOrg-siret">
                      SIRET <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="billingOrg-siret"
                      type="text"
                      value={billingOrg.customOrganisation?.siret || ''}
                      onChange={(e) =>
                        handleCustomOrgChange('siret', e.target.value)
                      }
                      placeholder="123 456 789 00015"
                    />
                  </div>

                  {/* TVA */}
                  <div className="space-y-2">
                    <Label htmlFor="billingOrg-vatNumber">
                      Numero TVA intracommunautaire
                    </Label>
                    <Input
                      id="billingOrg-vatNumber"
                      type="text"
                      value={billingOrg.customOrganisation?.vatNumber || ''}
                      onChange={(e) =>
                        handleCustomOrgChange('vatNumber', e.target.value)
                      }
                      placeholder="FR12345678901"
                    />
                  </div>
                </div>

                {/* Adresse */}
                <div className="space-y-4 pt-4 border-t">
                  <h5 className="text-sm font-medium text-gray-700">
                    Adresse de facturation
                  </h5>

                  <div className="space-y-2">
                    <Label htmlFor="billingOrg-addressLine1">
                      Adresse <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="billingOrg-addressLine1"
                      type="text"
                      value={billingOrg.customOrganisation?.addressLine1 || ''}
                      onChange={(e) =>
                        handleCustomOrgChange('addressLine1', e.target.value)
                      }
                      placeholder="15 rue Victor Hugo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billingOrg-addressLine2">
                      Complement d&apos;adresse
                    </Label>
                    <Input
                      id="billingOrg-addressLine2"
                      type="text"
                      value={billingOrg.customOrganisation?.addressLine2 || ''}
                      onChange={(e) =>
                        handleCustomOrgChange('addressLine2', e.target.value)
                      }
                      placeholder="Batiment A, 2eme etage"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="billingOrg-postalCode">
                        Code postal <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="billingOrg-postalCode"
                        type="text"
                        value={billingOrg.customOrganisation?.postalCode || ''}
                        onChange={(e) =>
                          handleCustomOrgChange('postalCode', e.target.value)
                        }
                        placeholder="69001"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="billingOrg-city">
                        Ville <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="billingOrg-city"
                        type="text"
                        value={billingOrg.customOrganisation?.city || ''}
                        onChange={(e) =>
                          handleCustomOrgChange('city', e.target.value)
                        }
                        placeholder="Lyon"
                      />
                    </div>
                  </div>

                  {/* Save as default */}
                  <div className="flex items-center gap-2 pt-2">
                    <Checkbox
                      id="billingOrg-saveDefault"
                      checked={billingOrg.saveAsDefault}
                      onCheckedChange={handleSaveAsDefaultChange}
                    />
                    <Label
                      htmlFor="billingOrg-saveDefault"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Enregistrer cette organisation par defaut
                    </Label>
                  </div>
                </div>
              </div>
            )}

            {/* Info for parent org */}
            {billingOrg.mode === 'parent_org' && parentOrganisation && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-purple-700">
                    <p className="font-medium">Facturation centralisee</p>
                    <p className="mt-1">
                      La facture sera adressee a l&apos;organisation mere :{' '}
                      <strong>
                        {parentOrganisation.trade_name ||
                          parentOrganisation.legal_name}
                      </strong>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export default BillingOrgSection;
