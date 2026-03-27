import { useState } from 'react';

import {
  AddressAutocomplete,
  type AddressResult,
  Label,
  Input,
} from '@verone/ui';
import { Check } from 'lucide-react';

import type { StepProps } from './types';
import { ReadOnlyField, EditableField } from './FieldRenderer';

const BILLING_ADDRESS_KEYS = new Set([
  'organisation_billing_address',
  'organisation_billing_postal_code',
  'organisation_billing_city',
]);

export function StepEntreprise({ step, formValues, onFieldChange }: StepProps) {
  const [billingAddressValue, setBillingAddressValue] = useState(
    formValues['organisation_billing_address'] ?? ''
  );
  const [sameAsDelivery, setSameAsDelivery] = useState(false);

  const hasBillingAddressFields = step.missingFields.some(f =>
    BILLING_ADDRESS_KEYS.has(f.key)
  );
  const nonAddressFields = step.missingFields.filter(
    f => !BILLING_ADDRESS_KEYS.has(f.key)
  );

  const handleBillingAddressSelect = (address: AddressResult) => {
    setBillingAddressValue(address.streetAddress);
    onFieldChange('organisation_billing_address', address.streetAddress);
    onFieldChange('organisation_billing_postal_code', address.postalCode);
    onFieldChange('organisation_billing_city', address.city);
  };

  const handleSameAsDeliveryToggle = (checked: boolean) => {
    setSameAsDelivery(checked);
    if (checked) {
      const deliveryAddress = formValues['delivery_address'] ?? '';
      const deliveryPostalCode = formValues['delivery_postal_code'] ?? '';
      const deliveryCity = formValues['delivery_city'] ?? '';

      setBillingAddressValue(deliveryAddress);
      onFieldChange('organisation_billing_address', deliveryAddress);
      onFieldChange('organisation_billing_postal_code', deliveryPostalCode);
      onFieldChange('organisation_billing_city', deliveryCity);
    } else {
      setBillingAddressValue('');
      onFieldChange('organisation_billing_address', '');
      onFieldChange('organisation_billing_postal_code', '');
      onFieldChange('organisation_billing_city', '');
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Veuillez renseigner les informations legales de l&apos;entreprise.
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

      {/* Non-address missing fields (legal_name, siret, vat) */}
      {nonAddressFields.map(f => (
        <EditableField
          key={f.key}
          fieldKey={f.key}
          label={f.label}
          inputType={f.inputType}
          value={formValues[f.key] ?? ''}
          onChange={v => onFieldChange(f.key, v)}
        />
      ))}

      {/* Billing address block */}
      {hasBillingAddressFields && (
        <div className="space-y-4 pt-2 border-t border-gray-100">
          {/* Same as delivery checkbox */}
          <label className="flex items-center gap-2 cursor-pointer">
            <Input
              type="checkbox"
              checked={sameAsDelivery}
              onChange={e => handleSameAsDeliveryToggle(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Meme adresse que la livraison
            </span>
            {sameAsDelivery && <Check className="h-4 w-4 text-green-500" />}
          </label>

          {!sameAsDelivery && (
            <>
              <div className="space-y-1.5">
                <Label className="text-orange-700 font-medium text-sm">
                  Adresse de facturation *
                </Label>
                <AddressAutocomplete
                  value={billingAddressValue}
                  onChange={v => {
                    setBillingAddressValue(v);
                    onFieldChange('organisation_billing_address', v);
                  }}
                  onSelect={handleBillingAddressSelect}
                  placeholder="Rechercher une adresse..."
                  id="billing-address-autocomplete"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {step.missingFields
                  .filter(f => f.key === 'organisation_billing_postal_code')
                  .map(f => (
                    <EditableField
                      key={f.key}
                      fieldKey={f.key}
                      label="Code postal"
                      inputType={f.inputType}
                      value={formValues[f.key] ?? ''}
                      onChange={v => onFieldChange(f.key, v)}
                    />
                  ))}
                {step.missingFields
                  .filter(f => f.key === 'organisation_billing_city')
                  .map(f => (
                    <EditableField
                      key={f.key}
                      fieldKey={f.key}
                      label="Ville"
                      inputType={f.inputType}
                      value={formValues[f.key] ?? ''}
                      onChange={v => onFieldChange(f.key, v)}
                    />
                  ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
