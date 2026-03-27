import { useState } from 'react';

import { AddressAutocomplete, type AddressResult, Label } from '@verone/ui';

import type { StepProps } from './types';
import { ReadOnlyField, EditableField } from './FieldRenderer';

const ADDRESS_KEYS = new Set([
  'delivery_address',
  'delivery_postal_code',
  'delivery_city',
]);

export function StepLivraison({ step, formValues, onFieldChange }: StepProps) {
  const [addressValue, setAddressValue] = useState(
    formValues['delivery_address'] ?? ''
  );

  // Check if delivery address fields are among the missing fields
  const hasAddressFields = step.missingFields.some(f =>
    ADDRESS_KEYS.has(f.key)
  );
  const contactFields = step.missingFields.filter(
    f => !ADDRESS_KEYS.has(f.key)
  );

  const handleAddressSelect = (address: AddressResult) => {
    setAddressValue(address.streetAddress);
    onFieldChange('delivery_address', address.streetAddress);
    onFieldChange('delivery_postal_code', address.postalCode);
    onFieldChange('delivery_city', address.city);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Veuillez renseigner le contact et l&apos;adresse de livraison.
      </p>

      {/* Existing read-only fields */}
      {step.existingFields.map(f => (
        <ReadOnlyField
          key={f.key}
          label={f.label}
          value={f.value}
          inputType="text"
        />
      ))}

      {/* Contact fields (non-address) */}
      {contactFields.map(f => (
        <EditableField
          key={f.key}
          fieldKey={f.key}
          label={f.label}
          inputType={f.inputType}
          value={formValues[f.key] ?? ''}
          onChange={v => onFieldChange(f.key, v)}
        />
      ))}

      {/* Address autocomplete block */}
      {hasAddressFields && (
        <div className="space-y-4 pt-2 border-t border-gray-100">
          <div className="space-y-1.5">
            <Label className="text-orange-700 font-medium text-sm">
              Adresse de livraison *
            </Label>
            <AddressAutocomplete
              value={addressValue}
              onChange={v => {
                setAddressValue(v);
                onFieldChange('delivery_address', v);
              }}
              onSelect={handleAddressSelect}
              placeholder="Rechercher une adresse..."
              id="delivery-address-autocomplete"
            />
          </div>

          {/* Show pre-filled address fields below for manual adjustment */}
          <div className="grid grid-cols-2 gap-3">
            {step.missingFields
              .filter(f => f.key === 'delivery_postal_code')
              .map(f => (
                <EditableField
                  key={f.key}
                  fieldKey={f.key}
                  label={f.label}
                  inputType={f.inputType}
                  value={formValues[f.key] ?? ''}
                  onChange={v => onFieldChange(f.key, v)}
                />
              ))}
            {step.missingFields
              .filter(f => f.key === 'delivery_city')
              .map(f => (
                <EditableField
                  key={f.key}
                  fieldKey={f.key}
                  label={f.label}
                  inputType={f.inputType}
                  value={formValues[f.key] ?? ''}
                  onChange={v => onFieldChange(f.key, v)}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
