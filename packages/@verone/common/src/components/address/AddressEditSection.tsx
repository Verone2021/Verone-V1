'use client';

import { ButtonV2 } from '@verone/ui';
import { Checkbox } from '@verone/ui';
import { cn } from '@verone/utils';
import {
  MapPin,
  Save,
  X,
  Edit,
  Building,
  Home,
  Navigation,
  Copy,
} from 'lucide-react';

import { AddressFormFields } from './AddressFormFields';
import { AddressReadView } from './AddressReadView';
import type { AddressEditSectionProps } from './address-edit.types';
import { useAddressEditSection } from './use-address-edit-section';

export function AddressEditSection({
  organisation,
  onUpdate,
  className,
}: AddressEditSectionProps) {
  const {
    editData,
    error,
    isEditing,
    isSaving,
    hasChanges,
    handleStartEdit,
    handleSave,
    handleCancel,
    handleFieldChange,
    handleBillingAddressSelect,
    handleShippingAddressSelect,
    handleCopyShippingToBilling,
    handleToggleDifferentShipping,
    copyAddressToClipboard,
  } = useAddressEditSection(organisation, onUpdate);

  if (isEditing) {
    return (
      <div className={cn('card-verone p-4', className)}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-medium text-black flex items-center">
            <MapPin className="h-4 w-4 mr-2" />
            Adresse
          </h3>
          <div className="flex space-x-2">
            <ButtonV2
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <X className="h-3 w-3 mr-1" />
              Annuler
            </ButtonV2>
            <ButtonV2
              variant="secondary"
              size="sm"
              onClick={() => void handleSave()}
              disabled={!hasChanges || isSaving}
            >
              <Save className="h-3 w-3 mr-1" />
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
            </ButtonV2>
          </div>
        </div>

        <div className="space-y-6">
          {/* Adresse de facturation */}
          <div className="space-y-4">
            <AddressFormFields
              prefix="billing"
              editData={editData}
              onFieldChange={handleFieldChange}
              onAddressSelect={handleBillingAddressSelect}
              onCountryChange={(field, value) =>
                handleFieldChange(field, value)
              }
              headerSlot={
                <div className="flex items-center justify-between">
                  <h4 className="text-md font-semibold text-black flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Adresse de facturation
                  </h4>
                  <ButtonV2
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyShippingToBilling}
                    className="flex items-center gap-2"
                    disabled={!editData?.has_different_shipping_address}
                  >
                    <Copy className="h-3 w-3" />
                    Copier vers facturation
                  </ButtonV2>
                </div>
              }
            />
          </div>

          {/* Toggle adresse de livraison différente */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="different_shipping"
              checked={editData?.has_different_shipping_address ?? false}
              onCheckedChange={checked =>
                handleToggleDifferentShipping(checked as boolean)
              }
            />
            <label
              htmlFor="different_shipping"
              className="text-sm font-medium text-black"
            >
              L'adresse de livraison est différente de l'adresse de facturation
            </label>
          </div>

          {/* Adresse de livraison (conditionnelle) */}
          {editData?.has_different_shipping_address && (
            <div className="space-y-4 border-t pt-4">
              <AddressFormFields
                prefix="shipping"
                editData={editData}
                onFieldChange={handleFieldChange}
                onAddressSelect={handleShippingAddressSelect}
                onCountryChange={(field, value) =>
                  handleFieldChange(field, value)
                }
                headerSlot={
                  <h4 className="text-md font-semibold text-black flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Adresse de livraison
                  </h4>
                }
              />
            </div>
          )}

          {/* Coordonnées GPS (lecture seule en édition) */}
          {(editData?.latitude ?? editData?.longitude) && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-700">
                <Navigation className="h-4 w-4" />
                <span className="text-sm font-medium">Coordonnées GPS</span>
                <span className="text-xs text-green-600 ml-auto">
                  (mises à jour automatiquement)
                </span>
              </div>
              <div className="mt-2 pl-6 text-sm text-green-800 font-mono">
                {typeof editData?.latitude === 'number'
                  ? editData.latitude.toFixed(6)
                  : ''}
                ,{' '}
                {typeof editData?.longitude === 'number'
                  ? editData.longitude.toFixed(6)
                  : ''}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded">
            ❌ {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('card-verone p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-black flex items-center">
          <MapPin className="h-5 w-5 mr-2" />
          Adresses
        </h3>
        <ButtonV2 variant="outline" size="sm" onClick={handleStartEdit}>
          <Edit className="h-3 w-3 mr-1" />
          Modifier
        </ButtonV2>
      </div>

      <AddressReadView
        organisation={organisation}
        onCopy={copyAddressToClipboard}
      />
    </div>
  );
}
