'use client';

/**
 * AddressForm - Formulaire d'adresse avec autocomplétion
 *
 * Composant réutilisable pour la saisie d'adresse avec :
 * - Autocomplétion via AddressAutocomplete
 * - Champs légaux optionnels (SIRET, TVA, raison sociale)
 * - Option "Enregistrer par défaut"
 *
 * @module AddressForm
 * @since 2026-01-20
 */

import { useCallback } from 'react';

import {
  AddressAutocomplete,
  type AddressResult,
  Input,
  Label,
  Checkbox,
  cn,
} from '@verone/ui';

import type { PartialAddressData } from '../../schemas/order-form.schema';

// ============================================================================
// TYPES
// ============================================================================

interface AddressFormProps {
  /** Données d'adresse actuelles */
  address: PartialAddressData | null;
  /** Callback quand l'adresse change */
  onChange: (address: PartialAddressData) => void;
  /** Afficher les champs légaux (raison sociale, SIRET, TVA) */
  showLegalFields?: boolean;
  /** Afficher l'option "Enregistrer par défaut" */
  showSaveAsDefault?: boolean;
  /** État de "Enregistrer par défaut" */
  saveAsDefault?: boolean;
  /** Callback quand "Enregistrer par défaut" change */
  onSaveAsDefaultChange?: (checked: boolean) => void;
  /** Mode lecture seule */
  readOnly?: boolean;
  /** Préfixe pour les IDs de champ (pour éviter les conflits) */
  idPrefix?: string;
  /** Désactiver les champs */
  disabled?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AddressForm({
  address,
  onChange,
  showLegalFields = false,
  showSaveAsDefault = false,
  saveAsDefault = false,
  onSaveAsDefaultChange,
  readOnly = false,
  idPrefix = 'address',
  disabled = false,
}: AddressFormProps) {
  // Handle single field change
  const handleFieldChange = useCallback(
    (field: keyof PartialAddressData, value: string | number | null) => {
      onChange({
        ...address,
        [field]: value,
      });
    },
    [address, onChange]
  );

  // Handle address selection from autocomplete
  const handleAddressSelect = useCallback(
    (result: AddressResult) => {
      onChange({
        ...address,
        addressLine1: result.streetAddress,
        postalCode: result.postalCode,
        city: result.city,
        region: result.region || null,
        country: result.countryCode,
        latitude: result.latitude,
        longitude: result.longitude,
      });
    },
    [address, onChange]
  );

  const isDisabled = disabled || readOnly;

  return (
    <div className="space-y-4">
      {/* Legal fields (if enabled) */}
      {showLegalFields && (
        <div className="space-y-4 pb-4 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-legalName`}>Raison sociale</Label>
              <Input
                id={`${idPrefix}-legalName`}
                type="text"
                value={address?.legalName || ''}
                onChange={(e) => handleFieldChange('legalName', e.target.value)}
                placeholder="SARL Example"
                disabled={isDisabled}
                readOnly={readOnly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-tradeName`}>Nom commercial</Label>
              <Input
                id={`${idPrefix}-tradeName`}
                type="text"
                value={address?.tradeName || ''}
                onChange={(e) => handleFieldChange('tradeName', e.target.value)}
                placeholder="Restaurant Example"
                disabled={isDisabled}
                readOnly={readOnly}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-siret`}>SIRET</Label>
              <Input
                id={`${idPrefix}-siret`}
                type="text"
                value={address?.siret || ''}
                onChange={(e) => handleFieldChange('siret', e.target.value)}
                placeholder="123 456 789 00012"
                maxLength={17}
                disabled={isDisabled}
                readOnly={readOnly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-vatNumber`}>N° TVA</Label>
              <Input
                id={`${idPrefix}-vatNumber`}
                type="text"
                value={address?.vatNumber || ''}
                onChange={(e) => handleFieldChange('vatNumber', e.target.value)}
                placeholder="FR12345678901"
                disabled={isDisabled}
                readOnly={readOnly}
              />
            </div>
          </div>
        </div>
      )}

      {/* Address fields */}
      <div className="space-y-4">
        {/* Address autocomplete or simple input */}
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-address`}>
            Adresse <span className="text-red-500">*</span>
          </Label>
          {readOnly ? (
            <Input
              id={`${idPrefix}-address`}
              type="text"
              value={address?.addressLine1 || ''}
              readOnly
              disabled
              className="bg-gray-50"
            />
          ) : (
            <AddressAutocomplete
              id={`${idPrefix}-address`}
              value={address?.addressLine1 || ''}
              onChange={(value) => handleFieldChange('addressLine1', value)}
              onSelect={handleAddressSelect}
              placeholder="Rechercher une adresse..."
              disabled={isDisabled}
            />
          )}
        </div>

        {/* Address line 2 */}
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-addressLine2`}>
            Complément d&apos;adresse
          </Label>
          <Input
            id={`${idPrefix}-addressLine2`}
            type="text"
            value={address?.addressLine2 || ''}
            onChange={(e) => handleFieldChange('addressLine2', e.target.value)}
            placeholder="Bâtiment, étage, etc."
            disabled={isDisabled}
            readOnly={readOnly}
          />
        </div>

        {/* Postal code and city */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-postalCode`}>
              Code postal <span className="text-red-500">*</span>
            </Label>
            <Input
              id={`${idPrefix}-postalCode`}
              type="text"
              value={address?.postalCode || ''}
              onChange={(e) => handleFieldChange('postalCode', e.target.value)}
              placeholder="75001"
              disabled={isDisabled}
              readOnly={readOnly}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor={`${idPrefix}-city`}>
              Ville <span className="text-red-500">*</span>
            </Label>
            <Input
              id={`${idPrefix}-city`}
              type="text"
              value={address?.city || ''}
              onChange={(e) => handleFieldChange('city', e.target.value)}
              placeholder="Paris"
              disabled={isDisabled}
              readOnly={readOnly}
            />
          </div>
        </div>

        {/* Country (display only if not France) */}
        {address?.country && address.country !== 'FR' && (
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-country`}>Pays</Label>
            <Input
              id={`${idPrefix}-country`}
              type="text"
              value={address.country}
              disabled
              className="bg-gray-50"
            />
          </div>
        )}
      </div>

      {/* Save as default option */}
      {showSaveAsDefault && !readOnly && (
        <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
          <Checkbox
            id={`${idPrefix}-saveDefault`}
            checked={saveAsDefault}
            onCheckedChange={(checked) =>
              onSaveAsDefaultChange?.(checked as boolean)
            }
            disabled={disabled}
          />
          <Label
            htmlFor={`${idPrefix}-saveDefault`}
            className={cn('cursor-pointer text-sm', disabled && 'opacity-50')}
          >
            Enregistrer comme adresse par défaut
          </Label>
        </div>
      )}
    </div>
  );
}

export default AddressForm;
